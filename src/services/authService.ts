const readError = async (response: Response, fallback: string) => {
  const body = await response.json().catch(() => ({ error: fallback })) as { error?: string }
  return body.error || fallback
}

export interface CompanySession {
  id: string
  name: string
}

const WORKSPACE_KEY = 'logiledger_workspace'
const legacyWorkspace: CompanySession = { id: 'z-l-palm-line-logistic', name: 'Z&L Palm Line Logistic' }

const rememberCompany = (company: CompanySession) => localStorage.setItem(WORKSPACE_KEY, JSON.stringify(company))

const getRememberedCompany = (): CompanySession => {
  try {
    const value = JSON.parse(localStorage.getItem(WORKSPACE_KEY) ?? '') as Partial<CompanySession>
    return value.id && value.name ? { id: value.id, name: value.name } : legacyWorkspace
  } catch { return legacyWorkspace }
}

const readCompany = async (response: Response, fallback: string) => {
  if (!response.ok) throw new Error(await readError(response, fallback))
  const body = await response.json() as { company?: CompanySession }
  if (!body.company?.id || !body.company.name) throw new Error(fallback)
  return body.company
}

export const authService = {
  async hasSession(): Promise<CompanySession | null> {
    const response = await fetch('/api/auth/session', { cache: 'no-store' })
    if (response.status === 401) return null
    if (!response.ok) throw new Error(await readError(response, 'Unable to check authentication.'))
    const contentType = response.headers.get('Content-Type') ?? ''
    if (!contentType.includes('application/json')) return null
    const body = await response.json().catch(() => null) as { authenticated?: unknown; company?: CompanySession } | null
    if (body?.authenticated === true && body.company?.id && body.company.name) {
      rememberCompany(body.company)
      return body.company
    }
    return null
  },

  getRememberedCompany,

  async login(pin: string, workspace?: string): Promise<CompanySession> {
    const workspaceIdentifier = workspace?.trim() || getRememberedCompany().id
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace: workspaceIdentifier, pin }),
    })
    const company = await readCompany(response, 'Unable to sign in.')
    rememberCompany(company)
    return company
  },

  async signup(companyName: string, pin: string): Promise<CompanySession> {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, pin }),
    })
    const company = await readCompany(response, 'Unable to create the workspace.')
    rememberCompany(company)
    return company
  },

  async changePin(currentPin: string, newPin: string): Promise<void> {
    const response = await fetch('/api/auth/change-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPin, newPin }),
    })
    if (!response.ok) throw new Error(await readError(response, 'Unable to update the PIN.'))
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' })
  },
}
