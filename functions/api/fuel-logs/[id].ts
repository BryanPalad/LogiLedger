import { rowToFuelLog, validateFuelLog, type FuelLogRow } from '../../../worker/fuelLogs'
import type { AuthData } from '../../../worker/auth'
import { errorResponse, json, type Env } from '../../../worker/trips'

interface TruckPlateRow { plate_number: string }

export const onRequestPut: PagesFunction<Env, string, AuthData> = async ({ request, env, params, data }) => {
  try {
    const id = String(params.id)
    const log = validateFuelLog(await request.json())
    const truck = await env.DB.prepare('SELECT plate_number FROM saved_trucks WHERE id = ? AND company_id = ?').bind(log.truckId, data.companyId).first<TruckPlateRow>()
    if (!truck) return json({ error: 'The selected truck no longer exists.' }, 400)
    const result = await env.DB.prepare(`UPDATE fuel_logs SET
      truck_id = ?, truck_plate_number = ?, purchase_date = ?, amount_centavos = ?, liters = ?, odometer_km = ?, notes = ?, updated_at = ? WHERE id = ? AND company_id = ?`).bind(
      log.truckId, truck.plate_number, log.purchaseDate, Math.round(log.amount * 100), log.liters, log.odometerKm, log.notes, new Date().toISOString(), id, data.companyId,
    ).run()
    if (!result.meta.changes) return json({ error: 'Fuel purchase not found.' }, 404)
    const row = await env.DB.prepare('SELECT * FROM fuel_logs WHERE id = ? AND company_id = ?').bind(id, data.companyId).first<FuelLogRow>()
    return json(rowToFuelLog(row!))
  } catch (error) {
    if (error instanceof Error && !error.message.includes('D1')) return json({ error: error.message }, 400)
    return errorResponse(error)
  }
}

export const onRequestDelete: PagesFunction<Env, string, AuthData> = async ({ env, params, data }) => {
  try {
    const result = await env.DB.prepare('DELETE FROM fuel_logs WHERE id = ? AND company_id = ?').bind(String(params.id), data.companyId).run()
    if (!result.meta.changes) return json({ error: 'Fuel purchase not found.' }, 404)
    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
