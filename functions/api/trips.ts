import { refreshRouteEstimate } from '../../worker/route-estimate'
import type { AuthData } from '../../worker/auth'
import { errorResponse, insertValues, json, rowToTrip, selectTrip, validateTrip, type Env, type TripRow } from '../../worker/trips'

const INSERT_SQL = `INSERT INTO trips (
  id, trip_date, truck_plate_number, driver_name, helper_name, driver_start_time, driver_end_time, destination, customer_name,
  revenue_centavos, driver_rate_centavos, helper_rate_centavos, gas_expense_centavos,
  parking_expense_centavos, toll_expense_centavos, food_expense_centavos, other_expense_centavos,
  remarks, created_at, updated_at,
  home_province_code, home_province, home_city_code, home_city, home_barangay_code, home_barangay, home_address,
  ending_province_code, ending_province, ending_city_code, ending_city, ending_barangay_code, ending_barangay, ending_address,
  origin_province_code, origin_province, origin_city_code, origin_city, origin_barangay_code, origin_barangay, origin_address,
  destination_province_code, destination_province, destination_city_code, destination_city, destination_barangay_code, destination_barangay, destination_address,
  sub_trips_json, additional_trips_json, company_id
) VALUES (${Array(51).fill('?').join(', ')})`

export const onRequestGet: PagesFunction<Env, string, AuthData> = async ({ env, data }) => {
  try {
    const result = await env.DB.prepare('SELECT * FROM trips WHERE company_id = ? ORDER BY trip_date DESC, created_at DESC').bind(data.companyId).all<TripRow>()
    return json(result.results.map(rowToTrip))
  } catch (error) {
    return errorResponse(error)
  }
}

export const onRequestPost: PagesFunction<Env, string, AuthData> = async ({ request, env, data }) => {
  try {
    const trip = validateTrip(await request.json())
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await env.DB.prepare(INSERT_SQL).bind(...insertValues(trip, id, now), data.companyId).run()
    await refreshRouteEstimate(env, id, trip)
    return json(await selectTrip(env.DB, id, data.companyId), 201)
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof Error && !error.message.includes('D1')) {
      return json({ error: error instanceof Error ? error.message : 'Invalid trip data.' }, 400)
    }
    return errorResponse(error)
  }
}
