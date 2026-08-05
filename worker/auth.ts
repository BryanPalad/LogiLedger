import { json, type Env } from './trips'

const COOKIE_NAME = 'logiledger_session'
const SESSION_SECONDS = 7 * 24 * 60 * 60
const MAX_ATTEMPTS = 5
const ATTEMPT_WINDOW_SECONDS = 15 * 60
const MAX_SIGNUPS = 3
const SIGNUP_WINDOW_SECONDS = 60 * 60
const PIN_HASH_ITERATIONS = 100_000

export interface AuthData extends Record<string, unknown> {
  companyId: string
  companyName: string
}

interface CompanyRow {
  id: string
  name: string
  pin_hash: string
  pin_salt: string
  session_version: number
}

const encoder = new TextEncoder()

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')

const randomHex = (length: number) => {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

const sign = async (value: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)))
}

const constantTimeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

const hashPin = async (pin: string, salt: string) => {
  const material = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits'])
  return toHex(await crypto.subtle.deriveBits({
    name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: PIN_HASH_ITERATIONS,
  }, material, 256))
}

const getCookie = (request: Request, name: string) => {
  const cookies = request.headers.get('Cookie') ?? ''
  for (const cookie of cookies.split(';')) {
    const [key, ...value] = cookie.trim().split('=')
    if (key === name) return value.join('=')
  }
  return null
}

const requireSecrets = (env: Env) => {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be configured with at least 32 characters.')
  }
}

const clientKey = async (request: Request, secret: string, purpose: 'login' | 'signup') => {
  const address = request.headers.get('CF-Connecting-IP') ?? 'local-client'
  return sign(`${purpose}:${address}`, secret)
}

const encodeSession = (data: { companyId: string; sessionVersion: number; expiresAt: number }) =>
  btoa(JSON.stringify(data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const decodeSession = (value: string) => {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
    return JSON.parse(atob(padded)) as { companyId?: unknown; sessionVersion?: unknown; expiresAt?: unknown }
  } catch { return null }
}

export const getSession = async (request: Request, env: Env): Promise<AuthData | null> => {
  requireSecrets(env)
  const token = getCookie(request, COOKIE_NAME)
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = await sign(payload, env.SESSION_SECRET!)
  if (!constantTimeEqual(signature, expected)) return null
  const data = decodeSession(payload)
  if (!data || typeof data.companyId !== 'string' || typeof data.sessionVersion !== 'number' || typeof data.expiresAt !== 'number' || data.expiresAt <= Math.floor(Date.now() / 1000)) return null
  const company = await env.DB.prepare('SELECT id, name, session_version FROM companies WHERE id = ?').bind(data.companyId).first<{ id: string; name: string; session_version: number }>()
  if (!company || company.session_version !== data.sessionVersion) return null
  return company ? { companyId: company.id, companyName: company.name } : null
}

export const isAuthenticated = async (request: Request, env: Env) => Boolean(await getSession(request, env))

export const createSessionCookie = async (env: Env, companyId: string) => {
  requireSecrets(env)
  const company = await env.DB.prepare('SELECT session_version FROM companies WHERE id = ?').bind(companyId).first<{ session_version: number }>()
  if (!company) throw new Error('Company workspace was not found.')
  const payload = encodeSession({ companyId, sessionVersion: company.session_version, expiresAt: Math.floor(Date.now() / 1000) + SESSION_SECONDS })
  const signature = await sign(payload, env.SESSION_SECRET!)
  return `${COOKIE_NAME}=${payload}.${signature}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`
}

export const clearSessionCookie = () =>
  `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`

const findCompany = async (env: Env, workspace: string) => env.DB.prepare(
  'SELECT id, name, pin_hash, pin_salt, session_version FROM companies WHERE id = ? OR name = ? COLLATE NOCASE',
).bind(workspace.trim().toLowerCase(), workspace.trim()).first<CompanyRow>()

export const verifyPinAttempt = async (request: Request, env: Env, workspace: string, pin: string) => {
  requireSecrets(env)
  const company = await findCompany(env, workspace)
  const key = await clientKey(request, env.SESSION_SECRET!, 'login')
  const now = Math.floor(Date.now() / 1000)
  const attempt = await env.DB.prepare(
    'SELECT attempt_count, window_started_at FROM auth_attempts WHERE client_key = ?',
  ).bind(key).first<{ attempt_count: number; window_started_at: number }>()

  if (attempt && now - attempt.window_started_at < ATTEMPT_WINDOW_SECONDS && attempt.attempt_count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: ATTEMPT_WINDOW_SECONDS - (now - attempt.window_started_at) }
  }

  const validPin = company?.pin_hash === 'legacy-env'
    ? Boolean(env.APP_PIN && /^\d{6}$/.test(env.APP_PIN) && constantTimeEqual(pin, env.APP_PIN))
    : Boolean(company && constantTimeEqual(await hashPin(pin, company.pin_salt), company.pin_hash))
  if (company && validPin) {
    await env.DB.prepare('DELETE FROM auth_attempts WHERE client_key = ?').bind(key).run()
    return { company, allowed: true, retryAfter: 0 }
  }

  if (!attempt || now - attempt.window_started_at >= ATTEMPT_WINDOW_SECONDS) {
    await env.DB.prepare(
      `INSERT INTO auth_attempts (client_key, attempt_count, window_started_at) VALUES (?, 1, ?)
       ON CONFLICT(client_key) DO UPDATE SET attempt_count = 1, window_started_at = excluded.window_started_at`,
    ).bind(key, now).run()
  } else {
    await env.DB.prepare('UPDATE auth_attempts SET attempt_count = attempt_count + 1 WHERE client_key = ?').bind(key).run()
  }
  return { company: null, allowed: false, retryAfter: 0 }
}

const companySlug = (name: string) => name.toLowerCase().normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'workspace'

export const registerCompany = async (env: Env, companyName: string, pin: string) => {
  requireSecrets(env)
  const name = companyName.trim().replace(/\s+/g, ' ')
  if (name.length < 2 || name.length > 100) throw new Error('Company name must be between 2 and 100 characters.')
  if (!/^\d{6}$/.test(pin)) throw new Error('Enter a valid six-digit PIN.')
  const existing = await env.DB.prepare('SELECT id FROM companies WHERE name = ? COLLATE NOCASE').bind(name).first()
  if (existing) throw new Error('A workspace with this company name already exists.')
  const base = companySlug(name)
  let id = base
  if (await env.DB.prepare('SELECT id FROM companies WHERE id = ?').bind(id).first()) id = `${base}-${randomHex(2)}`
  const salt = randomHex(16)
  const pinHash = await hashPin(pin, salt)
  const now = new Date().toISOString()
  await env.DB.prepare('INSERT INTO companies (id, name, pin_hash, pin_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, name, pinHash, salt, now, now).run()
  return { id, name }
}

export const consumeSignupAttempt = async (request: Request, env: Env) => {
  requireSecrets(env)
  const key = await clientKey(request, env.SESSION_SECRET!, 'signup')
  const now = Math.floor(Date.now() / 1000)
  const attempt = await env.DB.prepare(
    'SELECT attempt_count, window_started_at FROM auth_attempts WHERE client_key = ?',
  ).bind(key).first<{ attempt_count: number; window_started_at: number }>()

  if (attempt && now - attempt.window_started_at < SIGNUP_WINDOW_SECONDS && attempt.attempt_count >= MAX_SIGNUPS) {
    return SIGNUP_WINDOW_SECONDS - (now - attempt.window_started_at)
  }
  if (!attempt || now - attempt.window_started_at >= SIGNUP_WINDOW_SECONDS) {
    await env.DB.prepare(
      `INSERT INTO auth_attempts (client_key, attempt_count, window_started_at) VALUES (?, 1, ?)
       ON CONFLICT(client_key) DO UPDATE SET attempt_count = 1, window_started_at = excluded.window_started_at`,
    ).bind(key, now).run()
  } else {
    await env.DB.prepare('UPDATE auth_attempts SET attempt_count = attempt_count + 1 WHERE client_key = ?').bind(key).run()
  }
  return 0
}

export const changeCompanyPin = async (request: Request, env: Env, companyId: string, currentPin: string, newPin: string) => {
  if (!/^\d{6}$/.test(currentPin) || !/^\d{6}$/.test(newPin)) throw new Error('Both PINs must contain exactly six digits.')
  if (currentPin === newPin) throw new Error('Choose a new PIN that is different from the current PIN.')
  const result = await verifyPinAttempt(request, env, companyId, currentPin)
  if (result.retryAfter) throw new Error('Too many attempts. Please wait 15 minutes.')
  if (!result.allowed || !result.company) throw new Error('The current PIN is incorrect.')
  const salt = randomHex(16)
  const pinHash = await hashPin(newPin, salt)
  await env.DB.prepare('UPDATE companies SET pin_hash = ?, pin_salt = ?, session_version = session_version + 1, updated_at = ? WHERE id = ?')
    .bind(pinHash, salt, new Date().toISOString(), companyId).run()
}

export const authConfigurationError = (error: unknown) => {
  console.error(error)
  return json({ error: 'Authentication is not configured on the server.' }, 500)
}
