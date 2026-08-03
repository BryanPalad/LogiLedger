import { rowToPersonnel, validatePersonnel, type PersonnelRow } from '../../worker/personnel'
import type { AuthData } from '../../worker/auth'
import { errorResponse, json, type Env } from '../../worker/trips'

export const onRequestGet: PagesFunction<Env, string, AuthData> = async ({ env, data }) => {
  try {
    const result = await env.DB.prepare('SELECT * FROM saved_personnel WHERE company_id = ? ORDER BY role, name COLLATE NOCASE').bind(data.companyId).all<PersonnelRow>()
    return json(result.results.map(rowToPersonnel))
  } catch (error) {
    return errorResponse(error)
  }
}

export const onRequestPost: PagesFunction<Env, string, AuthData> = async ({ request, env, data }) => {
  try {
    const person = validatePersonnel(await request.json())
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await env.DB.prepare(`INSERT INTO saved_personnel (
      id, role, name, default_rate_centavos, start_date, end_date, is_active, created_at, updated_at, company_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, person.role, person.name, Math.round(person.defaultRate * 100), person.startDate, person.endDate, person.isActive ? 1 : 0, now, now, data.companyId).run()
    const row = await env.DB.prepare('SELECT * FROM saved_personnel WHERE id = ? AND company_id = ?').bind(id, data.companyId).first<PersonnelRow>()
    return json(rowToPersonnel(row!), 201)
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE')) return json({ error: 'This name is already saved for that role.' }, 409)
    if (error instanceof Error && !error.message.includes('D1')) return json({ error: error.message }, 400)
    return errorResponse(error)
  }
}
