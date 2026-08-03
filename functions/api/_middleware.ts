import { authConfigurationError, getSession, type AuthData } from '../../worker/auth'
import { json, type Env } from '../../worker/trips'

export const onRequest: PagesFunction<Env, string, AuthData> = async ({ request, env, data, next }) => {
  const path = new URL(request.url).pathname
  if (['/api/auth/login', '/api/auth/logout', '/api/auth/session', '/api/auth/signup'].includes(path)) return next()
  try {
    const session = await getSession(request, env)
    if (!session) return json({ error: 'Authentication required.' }, 401)
    data.companyId = session.companyId
    data.companyName = session.companyName
    return next()
  } catch (error) {
    return authConfigurationError(error)
  }
}
