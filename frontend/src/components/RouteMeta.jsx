/** Input: POST /api/route response, held in App state alongside the current selection. */
export default function RouteMeta({ selectedId, route, error, onClear }) {
  if (!selectedId) {
    return (
      <div className="route-meta">
        <span className="placeholder">Select a victim from the priority list to compute a hazard-avoidance route.</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="route-meta">
        <span className="placeholder">{error}</span>
      </div>
    )
  }

  if (!route) {
    return (
      <div className="route-meta">
        <span className="placeholder">Computing route…</span>
      </div>
    )
  }

  return (
    <div className="route-meta">
      <div className="rm-item"><span className="k">TARGET</span> <span className="v">{selectedId}</span></div>
      <div className="rm-item"><span className="k">DISTANCE</span> <span className="v">{route.distance_m} m</span></div>
      <div className="rm-item">
        <span className="k">AVOIDANCE</span>{' '}
        <span className="v">avoids {route.avoided_count} detected hazard{route.avoided_count === 1 ? '' : 's'}</span>
      </div>
      <div className="rm-item"><span className="k">WAYPOINTS</span> <span className="v">{route.waypoints.length}</span></div>
      <button onClick={onClear}>CLEAR ROUTE</button>
    </div>
  )
}
