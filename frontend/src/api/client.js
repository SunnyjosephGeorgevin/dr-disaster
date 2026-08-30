const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`)
  return res.json()
}

/** Calls the route endpoint for a given victim. Returns the waypoint list,
 *  distance, and hazard-avoidance confirmation described in the spec. */
export function fetchRoute(victimId) {
  return postJson('/api/route', { victim_id: victimId })
}

/** Demo control — simulates switching the drone's active link. */
export function setDroneLink(link) {
  return postJson('/api/drone/link', { link })
}

/** Demo control — steers the drone one step in the given heading (degrees). */
export function moveDrone(headingDeg) {
  return postJson('/api/drone/move', { heading_deg: headingDeg })
}

/** Demo control — sets/clears the mission's degraded-mode reasons. */
export function setDegradedReasons(reasons) {
  return postJson('/api/mission/degraded', { reasons })
}
