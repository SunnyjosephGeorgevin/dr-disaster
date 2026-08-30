/**
 * Sorted, clickable victim list. Selecting an entry (click or Enter/Space)
 * calls the parent's onSelect handler, which hits POST /api/route and
 * draws the returned waypoints on the map. Clicking the selected entry
 * again clears the route.
 *
 * Input: risk engine output arrives over the WebSocket stream as
 * `victims[]`, already priority-sorted by the backend.
 */
export default function PriorityList({ victims, selectedId, onSelect, routeError }) {
  return (
    <>
      <div className="list-header">
        <div className="label">Priority List</div>
        <div className="count">{victims.length} tagged victims, sorted by priority</div>
      </div>
      <ul className="victim-list" role="listbox" aria-label="Victims sorted by priority">
        {victims.map((v) => {
          const selected = v.id === selectedId
          return (
            <li key={v.id} role="option" aria-selected={selected}>
              <div
                className={`victim-item${selected ? ' selected' : ''}`}
                tabIndex={0}
                role="button"
                aria-pressed={selected}
                onClick={() => onSelect(v.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(v.id)
                  }
                }}
              >
                <div className="vi-top">
                  <span className="vi-id">{v.id}</span>
                  <span className={`priority-tag ${v.priority}`}>{v.priority}</span>
                </div>
                <div className="vi-bottom">
                  <span><span className="k">RISK</span> {v.risk}</span>
                  <span><span className="k">STATUS</span> {v.condition}</span>
                  <span><span className="k">±</span> {v.uncertainty_m} m</span>
                </div>
                {selected && routeError && <div className="vi-error">{routeError}</div>}
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
