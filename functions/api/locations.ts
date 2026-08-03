import { rowToSavedLocation, validateSavedLocation, type SavedLocationRow } from '../../worker/locations'
import type { AuthData } from '../../worker/auth'
import { errorResponse, json, type Env } from '../../worker/trips'

export const onRequestGet: PagesFunction<Env, string, AuthData> = async ({ env, data }) => {
  try {
    const result = await env.DB.prepare('SELECT * FROM saved_locations WHERE company_id = ? ORDER BY name COLLATE NOCASE').bind(data.companyId).all<SavedLocationRow>()
    return json(result.results.map(rowToSavedLocation))
  } catch (error) {
    return errorResponse(error)
  }
}

export const onRequestPost: PagesFunction<Env, string, AuthData> = async ({ request, env, data }) => {
  try {
    const location = validateSavedLocation(await request.json())
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await env.DB.prepare(`INSERT INTO saved_locations (
      id, name, province_code, province, city_code, city, barangay_code, barangay, address, created_at, updated_at, company_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, location.name, location.provinceCode, location.province, location.cityCode, location.city, location.barangayCode, location.barangay, location.address, now, now, data.companyId).run()
    const row = await env.DB.prepare('SELECT * FROM saved_locations WHERE id = ? AND company_id = ?').bind(id, data.companyId).first<SavedLocationRow>()
    return json(rowToSavedLocation(row!), 201)
  } catch (error) {
    if (error instanceof Error && !error.message.includes('D1')) return json({ error: error.message }, 400)
    if (error instanceof Error && error.message.includes('UNIQUE')) return json({ error: 'A saved location with this name already exists.' }, 409)
    return errorResponse(error)
  }
}
