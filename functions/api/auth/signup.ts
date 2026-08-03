import { authConfigurationError, createSessionCookie, registerCompany } from '../../../worker/auth'
import { json, type Env } from '../../../worker/trips'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json<{ companyName?: unknown; pin?: unknown }>()
    const companyName = typeof body.companyName === 'string' ? body.companyName : ''
    const pin = typeof body.pin === 'string' ? body.pin : ''
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
