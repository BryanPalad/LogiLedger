import { rowToFuelLog, validateFuelLog, type FuelLogRow } from '../../worker/fuelLogs'
import type { AuthData } from '../../worker/auth'
import { errorResponse, json, type Env } from '../../worker/trips'

interface TruckPlateRow { plate_number: string }

export const onRequestGet: PagesFunction<Env, string, AuthData> = async ({ env, data }) => {
  try {
    const result = await env.DB.prepare('SELECT * FROM fuel_logs WHERE company_id = ? ORDER BY purchase_date DESC, created_at DESC').bind(data.companyId).all<FuelLogRow>()
    return json(result.results.map(rowToFuelLog))
  } catch (error) {
    return errorResponse(error)
  }
}

export const onRequestPost: PagesFunction<Env, string, AuthData> = async ({ request, env, data }) => {
  try {
    const log = validateFuelLog(await request.json())
    const truck = await env.DB.prepare('SELECT plate_number FROM saved_trucks WHERE id = ? AND company_id = ?').bind(log.truckId, data.companyId).first<TruckPlateRow>()
    if (!truck) return json({ error: 'The selected truck no longer exists.' }, 400)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await env.DB.prepare(`INSERT INTO fuel_logs (
      id, truck_id, truck_plate_number, purchase_date, amount_centavos, liters, odometer_km, notes, created_at, updated_at, company_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, log.truckId, truck.plate_number, log.purchaseDate, Math.round(log.amount * 100), log.liters, log.odometerKm, log.notes, now, now, data.companyId,
    ).run()
    const row = await env.DB.prepare('SELECT * FROM fuel_logs WHERE id = ? AND company_id = ?').bind(id, data.companyId).first<FuelLogRow>()
    return json(rowToFuelLog(row!), 201)
  } catch (error) {
    if (error instanceof Error && !error.message.includes('D1')) return json({ error: error.message }, 400)
    return errorResponse(error)
  }
}
