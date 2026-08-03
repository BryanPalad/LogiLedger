import { errorResponse, json, type Env } from '../../../../worker/trips'
import type { AuthData } from '../../../../worker/auth'

interface RouteMapRow {
  route_waypoints_json: string
  route_geometry_json: string
}

interface Waypoint {
  lat: number
  lon: number
  label: string
  markerText?: string
}

const parseJson = <T>(value: string, fallback: T): T => {
  try { return JSON.parse(value) as T } catch { return fallback }
}

export const onRequestGet: PagesFunction<Env, string, AuthData> = async ({ request, env, params, data }) => {
  try {
    if (!env.GEOAPIFY_API_KEY) return json({ error: 'Route maps are not configured.' }, 404)
    const row = await env.DB.prepare(
      'SELECT route_waypoints_json, route_geometry_json FROM trips WHERE id = ? AND company_id = ?',
    ).bind(String(params.id), data.companyId).first<RouteMapRow>()
    if (!row) return json({ error: 'Trip not found.' }, 404)

    const storedWaypoints = parseJson<Waypoint[]>(row.route_waypoints_json, [])
    const waypoints = storedWaypoints.map((waypoint, index) => waypoint.markerText === 'H'
      ? { ...waypoint, markerText: index === 0 ? 'S' : index === storedWaypoints.length - 1 ? 'E' : waypoint.markerText, label: index === 0 ? 'Starting location' : index === storedWaypoints.length - 1 ? 'Ending location' : waypoint.label }
      : waypoint)
    const geometry = parseJson<number[][]>(row.route_geometry_json, [])
    if (waypoints.length < 2 || !geometry.length) return json({ error: 'No route map is available for this trip.' }, 404)
    const sampleEvery = Math.max(1, Math.ceil(geometry.length / 800))
    const mapGeometry = geometry.filter((_, index) => index % sampleEvery === 0 || index === geometry.length - 1)

    const highResolution = new URL(request.url).searchParams.get('highres') === '1'
    const url = new URL('https://maps.geoapify.com/v1/staticmap')
    url.searchParams.set('apiKey', env.GEOAPIFY_API_KEY)
    const mapResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        style: 'osm-bright', width: 900, height: 420, scaleFactor: highResolution ? 2 : 1,
        markers: waypoints.map(({ lat, lon, markerText }, index) => ({
          lat, lon, type: 'circle',
          color: markerText === 'S' ? '#168159' : markerText === 'P' ? '#ea8a2f' : markerText === 'E' ? '#d04747' : '#3157d5',
          size: 'medium', text: markerText || String(index + 1), textsize: 'small',
        })),
        geometries: [{
          type: 'polyline', linecolor: '#3157d5', lineopacity: 0.9, linewidth: 5,
          value: mapGeometry.map(([lon, lat]) => ({ lat, lon })),
        }],
      }),
    })
    if (!mapResponse.ok) {
      console.error('Geoapify static map failed:', mapResponse.status, await mapResponse.text())
      throw new Error('The route map could not be generated.')
    }
    const headers = new Headers()
    headers.set('Content-Type', mapResponse.headers.get('Content-Type') || 'image/png')
    headers.set('Cache-Control', 'private, max-age=86400')
    return new Response(mapResponse.body, { status: 200, headers })
  } catch (error) {
    return errorResponse(error)
  }
}
