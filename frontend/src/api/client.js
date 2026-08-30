const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'http://localhost:8000'

async function postJson(path, body) {
  const res = await fetch(
    `${API_BASE}${path}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    throw new Error(
      `${path} failed: ${res.status}`
    )
  }

  return res.json()
}

/*
 * Compute a safe route from the rescue
 * team base to the selected victim.
 */
export function fetchRoute(victimId) {
  return postJson(
    '/api/route',
    {
      victim_id: victimId,
    }
  )
}

/*
 * Demo control for degraded-mode testing.
 *
 * Used to simulate perception faults such
 * as thermal sensor failure.
 */
export function setDegradedReasons(reasons) {
  return postJson(
    '/api/mission/degraded',
    {
      reasons,
    }
  )
}

/*
 * Export the API base so other frontend
 * modules can use the deployed backend.
 */
export { API_BASE }
