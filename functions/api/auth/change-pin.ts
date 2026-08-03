import { authConfigurationError, changeCompanyPin, type AuthData } from '../../../worker/auth'
import { json, type Env } from '../../../worker/trips'

export const onRequestPost: PagesFunction<Env, string, AuthData> = async ({ request, env, data }) => {
  try {
    const body = await request.json<{ currentPin?: unknown; newPin?: unknown }>()
    const currentPin = typeof body.currentPin === 'string' ? body.currentPin : ''
    const newPin = typeof body.newPin === 'string' ? body.newPin : ''
    await changeCompanyPin(request, env, data.companyId, currentPin, newPin)
    return json({ updated: true })
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: 'Invalid request.' }, 400)
    if (error instanceof Error && !error.message.includes('SESSION_SECRET') && !error.message.includes('D1')) {
      const status = error.message.includes('incorrect') ? 401 : error.message.includes('Too many') ? 429 : 400
      return json({ error: error.message }, status)
    }
    return authConfigurationError(error)
  }
}
