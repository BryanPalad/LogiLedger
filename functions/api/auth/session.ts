import { authConfigurationError, getSession } from '../../../worker/auth'
import { json, type Env } from '../../../worker/trips'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const session = await getSession(request, env)
    return session
      ? json({ authenticated: true, company: { id: session.companyId, name: session.companyName } })
      : json({ authenticated: false }, 401)
  } catch (error) {
    return authConfigurationError(error)
  }
}
