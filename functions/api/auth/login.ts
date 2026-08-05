import { authConfigurationError, createSessionCookie, verifyPinAttempt } from '../../../worker/auth'
import { json, type Env } from '../../../worker/trips'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json<{ workspace?: unknown; pin?: unknown }>()
    const workspace = typeof body.workspace === 'string' ? body.workspace.trim() : ''
    const pin = typeof body.pin === 'string' ? body.pin : ''
    if (!workspace || workspace.length > 100) return json({ error: 'Enter a valid company name or workspace ID.' }, 400)
    if (!/^\d{6}$/.test(pin)) return json({ error: 'Enter a valid six-digit PIN.' }, 400)

    const result = await verifyPinAttempt(request, env, workspace, pin)
    if (result.retryAfter) {
      return new Response(JSON.stringify({ error: 'Too many attempts. Please wait 15 minutes.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(result.retryAfter), 'Cache-Control': 'no-store' },
      })
    }
    if (!result.allowed || !result.company) return json({ error: 'Company workspace or PIN is incorrect.' }, 401)

    return new Response(JSON.stringify({ authenticated: true, company: { id: result.company.id, name: result.company.name } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': await createSessionCookie(env, result.company.id), 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: 'Invalid request.' }, 400)
    return authConfigurationError(error)
  }
}
