import { authConfigurationError, consumeSignupAttempt, createSessionCookie, registerCompany } from '../../../worker/auth'
import { json, type Env } from '../../../worker/trips'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json<{ companyName?: unknown; pin?: unknown }>()
    const companyName = typeof body.companyName === 'string' ? body.companyName : ''
    const pin = typeof body.pin === 'string' ? body.pin : ''
    if (companyName.trim().length < 2 || companyName.trim().length > 100) return json({ error: 'Company name must be between 2 and 100 characters.' }, 400)
    if (!/^\d{6}$/.test(pin)) return json({ error: 'Enter a valid six-digit PIN.' }, 400)
    const retryAfter = await consumeSignupAttempt(request, env)
    if (retryAfter) {
      return new Response(JSON.stringify({ error: 'Too many workspace registrations. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' },
      })
    }
    const company = await registerCompany(env, companyName, pin)
    return new Response(JSON.stringify({ authenticated: true, company }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': await createSessionCookie(env, company.id), 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: 'Invalid request.' }, 400)
    if (error instanceof Error && !error.message.includes('SESSION_SECRET') && !error.message.includes('D1')) {
      const status = error.message.includes('already exists') ? 409 : 400
      return json({ error: error.message }, status)
    }
    return authConfigurationError(error)
  }
}
