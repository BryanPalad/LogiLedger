import type { AuthData } from '../../../worker/auth'
import { rowToShuttleService, validateShuttleService, type ShuttleServiceRow } from '../../../worker/shuttleServices'
import { errorResponse, json, type Env } from '../../../worker/trips'

export const onRequestPut: PagesFunction<Env, string, AuthData> = async ({ request, env, params, data }) => {
  try {
    const id = String(params.id)
    const record = validateShuttleService(await request.json())
    if (record.truckId) {
      const truck = await env.DB.prepare('SELECT id FROM saved_trucks WHERE id = ? AND company_id = ?').bind(record.truckId, data.companyId).first()
      if (!truck) return json({ error: 'The selected truck was not found in this workspace.' }, 400)
    }
    const result = await env.DB.prepare(`UPDATE shuttle_services SET
      service_date = ?, truck_id = ?, truck_plate_number = ?, client_company = ?, service_location = ?, trip_count = ?,
      driver_name = ?, revenue_centavos = ?, driver_rate_centavos = ?, gas_expense_centavos = ?, toll_expense_centavos = ?,
      parking_expense_centavos = ?, other_expense_centavos = ?, notes = ?, updated_at = ?
      WHERE id = ? AND company_id = ?`).bind(
      record.serviceDate, record.truckId || null, record.truckPlateNumber, record.clientCompany,
      record.serviceLocation, record.tripCount, record.driverName, Math.round(record.revenue * 100),
      Math.round(record.driverRate * 100), Math.round(record.gasExpense * 100), Math.round(record.tollExpense * 100),
      Math.round(record.parkingExpense * 100), Math.round(record.otherExpense * 100), record.notes,
      new Date().toISOString(), id, data.companyId,
    ).run()
    if (!result.meta.changes) return json({ error: 'Shuttle service record not found.' }, 404)
    const row = await env.DB.prepare('SELECT * FROM shuttle_services WHERE id = ? AND company_id = ?').bind(id, data.companyId).first<ShuttleServiceRow>()
    return json(rowToShuttleService(row!))
  } catch (error) {
    if (error instanceof Error && !error.message.includes('D1')) return json({ error: error.message }, 400)
    return errorResponse(error)
  }
}

export const onRequestDelete: PagesFunction<Env, string, AuthData> = async ({ env, params, data }) => {
  try {
    const result = await env.DB.prepare('DELETE FROM shuttle_services WHERE id = ? AND company_id = ?').bind(String(params.id), data.companyId).run()
    if (!result.meta.changes) return json({ error: 'Shuttle service record not found.' }, 404)
    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
