import { rowToTruck, validateTruck, type TruckRow } from '../../worker/trucks'
import type { AuthData } from '../../worker/auth'
import { errorResponse, json, type Env } from '../../worker/trips'

export const onRequestGet: PagesFunction<Env, string, AuthData> = async ({ env, data }) => {
  try {
    const result = await env.DB.prepare('SELECT * FROM saved_trucks WHERE company_id = ? ORDER BY brand COLLATE NOCASE, plate_number COLLATE NOCASE').bind(data.companyId).all<TruckRow>()
    return json(result.results.map(rowToTruck))
  } catch (error) {
    return errorResponse(error)
  }
}

export const onRequestPost: PagesFunction<Env, string, AuthData> = async ({ request, env, data }) => {
  try {
    const truck = validateTruck(await request.json())
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await env.DB.prepare(`INSERT INTO saved_trucks (
      id, brand, truck_type, plate_number, color, fuel_efficiency_km_per_liter, created_at, updated_at, company_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, truck.brand, truck.truckType, truck.plateNumber, truck.color, truck.fuelEfficiencyKmPerLiter, now, now, data.companyId,
    ).run()
    const row = await env.DB.prepare('SELECT * FROM saved_trucks WHERE id = ? AND company_id = ?').bind(id, data.companyId).first<TruckRow>()
    return json(rowToTruck(row!), 201)
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE')) return json({ error: 'A truck with this plate number is already saved.' }, 409)
    if (error instanceof Error && !error.message.includes('D1')) return json({ error: error.message }, 400)
    return errorResponse(error)
  }
}
