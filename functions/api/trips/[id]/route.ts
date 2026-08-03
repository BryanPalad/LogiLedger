import { json, type Env } from '../../../../worker/trips'
import type { AuthData } from '../../../../worker/auth'

interface RouteRow {
  route_waypoints_json: string
  route_geometry_json: string
}

interface Waypoint {
  lat: number
  lon: number
  label: string
  markerText: string
}

const parseJson = <T>(value: string, fallback: T): T => {
  try { return JSON.parse(value) as T } catch { return fallback }
}

export const onRequestGet: PagesFunction<Env, string, AuthData> = async ({ env, params, data }) => {
  const row = await env.DB.prepare(
    'SELECT route_waypoints_json, route_geometry_json FROM trips WHERE id = ? AND company_id = ?',
  ).bind(String(params.id), data.companyId).first<RouteRow>()
  if (!row) return json({ error: 'Trip not found.' }, 404)

  const storedWaypoints = parseJson<Waypoint[]>(row.route_waypoints_json, [])
  const waypoints = storedWaypoints.map((waypoint, index) => waypoint.markerText === 'H'
    ? { ...waypoint, markerText: index === 0 ? 'S' : index === storedWaypoints.length - 1 ? 'E' : waypoint.markerText, label: index === 0 ? 'Starting location' : index === storedWaypoints.length - 1 ? 'Ending location' : waypoint.label }
    : waypoint)
  const geometry = parseJson<number[][]>(row.route_geometry_json, [])
  if (waypoints.length < 2 || !geometry.length) return json({ error: 'No route map is available for this trip.' }, 404)

  const sampleEvery = Math.max(1, Math.ceil(geometry.length / 5_000))
  const sampledGeometry = geometry.filter((_, index) => index % sampleEvery === 0 || index === geometry.length - 1)
  return json({ waypoints, geometry: sampledGeometry })
}
