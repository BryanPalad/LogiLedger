import { refreshRouteEstimate } from '../../../worker/route-estimate'
import type { AuthData } from '../../../worker/auth'
import { errorResponse, json, selectTrip, updateValues, validateTrip, type Env } from '../../../worker/trips'

const UPDATE_SQL = `UPDATE trips SET
  trip_date = ?, truck_plate_number = ?, driver_name = ?, helper_name = ?, driver_start_time = ?, driver_end_time = ?, destination = ?, customer_name = ?,
  revenue_centavos = ?, driver_rate_centavos = ?, helper_rate_centavos = ?, gas_expense_centavos = ?,
  parking_expense_centavos = ?, toll_expense_centavos = ?, food_expense_centavos = ?, other_expense_centavos = ?,
  remarks = ?, updated_at = ?,
  home_province_code = ?, home_province = ?, home_city_code = ?, home_city = ?,
  home_barangay_code = ?, home_barangay = ?, home_address = ?,
  ending_province_code = ?, ending_province = ?, ending_city_code = ?, ending_city = ?,
  ending_barangay_code = ?, ending_barangay = ?, ending_address = ?,
  origin_province_code = ?, origin_province = ?, origin_city_code = ?, origin_city = ?,
  origin_barangay_code = ?, origin_barangay = ?, origin_address = ?,
  destination_province_code = ?, destination_province = ?, destination_city_code = ?, destination_city = ?,
  destination_barangay_code = ?, destination_barangay = ?, destination_address = ?,
  sub_trips_json = ?
  WHERE id = ? AND company_id = ?`

export const onRequestPut: PagesFunction<Env, string, AuthData> = async ({ request, env, params, data }) => {
  try {
    const id = String(params.id)
    if (!await selectTrip(env.DB, id, data.companyId)) return json({ error: 'Trip not found.' }, 404)
    const trip = validateTrip(await request.json())
    const now = new Date().toISOString()
    await env.DB.prepare(UPDATE_SQL).bind(...updateValues(trip, now, id), data.companyId).run()
    await refreshRouteEstimate(env, id, trip)
    return json(await selectTrip(env.DB, id, data.companyId))
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof Error && !error.message.includes('D1')) {
      return json({ error: error instanceof Error ? error.message : 'Invalid trip data.' }, 400)
    }
    return errorResponse(error)
  }
}

export const onRequestDelete: PagesFunction<Env, string, AuthData> = async ({ env, params, data }) => {
  try {
    const result = await env.DB.prepare('DELETE FROM trips WHERE id = ? AND company_id = ?').bind(String(params.id), data.companyId).run()
    if (!result.meta.changes) return json({ error: 'Trip not found.' }, 404)
    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
