import type { AuthData } from '../../worker/auth'
import { rowToShuttleService, validateShuttleService, type ShuttleServiceRow } from '../../worker/shuttleServices'
import { errorResponse, json, type Env } from '../../worker/trips'

export const onRequestGet: PagesFunction<Env, string, AuthData> = async ({ env, data }) => {
  try {
    const result = await env.DB.prepare(
      'SELECT * FROM shuttle_services WHERE company_id = ? ORDER BY service_date DESC, created_at DESC',
    ).bind(data.companyId).all<ShuttleServiceRow>()
    return json(result.results.map(rowToShuttleService))
  } catch (error) {
    return errorResponse(error)
  }
}

export const onRequestPost: PagesFunction<Env, string, AuthData> = async ({ request, env, data }) => {
  try {
    const record = validateShuttleService(await request.json())
    if (record.truckId) {
      const truck = await env.DB.prepare('SELECT id FROM saved_trucks WHERE id = ? AND company_id = ?').bind(record.truckId, data.companyId).first()
      if (!truck) return json({ error: 'The selected truck was not found in this workspace.' }, 400)
    }
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await env.DB.prepare(`INSERT INTO shuttle_services (
      id, company_id, service_date, truck_id, truck_plate_number, client_company, service_location, trip_count,
      driver_name, revenue_centavos, driver_rate_centavos, gas_expense_centavos, toll_expense_centavos,
      parking_expense_centavos, other_expense_centavos, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, data.companyId, record.serviceDate, record.truckId || null, record.truckPlateNumber,
      record.clientCompany, record.serviceLocation, record.tripCount, record.driverName,
      Math.round(record.revenue * 100), Math.round(record.driverRate * 100), Math.round(record.gasExpense * 100),
      Math.round(record.tollExpense * 100), Math.round(record.parkingExpense * 100), Math.round(record.otherExpense * 100),
      record.notes, now, now,
    ).run()
    const row = await env.DB.prepare('SELECT * FROM shuttle_services WHERE id = ? AND company_id = ?').bind(id, data.companyId).first<ShuttleServiceRow>()
    return json(rowToShuttleService(row!), 201)
  } catch (error) {
    if (error instanceof Error && !error.message.includes('D1')) return json({ error: error.message }, 400)
    return errorResponse(error)
  }
}
