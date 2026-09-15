/**
 * HazardList — tabular view of all detected hazards with severity badges.
 * Uses mock data that mirrors the backend HAZARDS structure.
 */

const MOCK_HAZARDS = [
  { id: 'HAZ-001', type: 'Fire',              severity: 'CRITICAL', distance_m: 120, detected_at: Date.now() / 1000 - 25 },
  { id: 'HAZ-002', type: 'Debris',            severity: 'HIGH',     distance_m: 210, detected_at: Date.now() / 1000 - 30 },
  { id: 'HAZ-003', type: 'Flood',             severity: 'HIGH',     distance_m: 310, detected_at: Date.now() / 1000 - 35 },
  { id: 'HAZ-004', type: 'Debris',            severity: 'MEDIUM',   distance_m: 450, detected_at: Date.now() / 1000 - 45 },
  { id: 'HAZ-005', type: 'Fire',              severity: 'LOW',      distance_m: 620, detected_at: Date.now() / 1000 - 50 },
]

const SEVERITY_CLASS = {
  CRITICAL: 'hz-badge-critical',
  HIGH:     'hz-badge-high',
  MEDIUM:   'hz-badge-medium',
  LOW:      'hz-badge-low',
}

function HazardIcon({ type }) {
  if (type === 'Fire') return (
    <svg className="hz-type-icon" viewBox="0 0 24 24" width="14" height="14" fill="none">
      <path d="M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-4-4-6-4-10z" fill="#E4572E"/>
      <path d="M12 14c0 1.5-1 2.5-1 4a1 1 0 0 0 2 0c0-1.5-1-2.5-1-4z" fill="#F2C078"/>
    </svg>
  )
  if (type === 'Flood') return (
    <svg className="hz-type-icon" viewBox="0 0 24 24" width="14" height="14" fill="none">
      <path d="M2 14c2-4 4 0 6-4s4 0 6-4 4 0 6-4" stroke="#4B9CD3" strokeWidth="2" strokeLinecap="round"/>
      <path d="M2 18c2-4 4 0 6-4s4 0 6-4 4 0 6-4" stroke="#4B9CD3" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
  // Debris / default — triangle warning
  return (
    <svg className="hz-type-icon" viewBox="0 0 24 24" width="14" height="14" fill="none">
      <path d="M12 3L22 21H2L12 3Z" stroke="#D9A441" strokeWidth="2" strokeLinejoin="round"/>
      <line x1="12" y1="10" x2="12" y2="15" stroke="#D9A441" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="18" r="1" fill="#D9A441"/>
    </svg>
  )
}

function fmtTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  })
}

export default function HazardList({ hazards }) {
  // Use live hazards if available and non-empty, else fall back to mock
  const list = (hazards && hazards.length > 0)
    ? hazards.map((h, i) => ({
        id:          h.id || `HAZ-${String(i + 1).padStart(3, '0')}`,
        type:        h.type        || 'Unknown',
        severity:    h.severity?.toUpperCase() || 'MEDIUM',
        distance_m:  h.radius     || 0,
        detected_at: h.detected_at || Date.now() / 1000,
      }))
    : MOCK_HAZARDS

  return (
    <div className="hazard-list-panel">

      {/* ── Header ── */}
      <div className="hz-header">
        <span className="hz-title">HAZARD LIST</span>
        <span className="hz-count">{list.length} hazard{list.length !== 1 ? 's' : ''} detected</span>
      </div>

      {/* ── Table ── */}
      <div className="hz-table" role="table" aria-label="Hazard list">

        {list.map((h) => (
          <div className="hz-row" key={h.id} role="row">

            {/* ID */}
            <span className="hz-id" role="cell">{h.id}</span>

            {/* Type + icon */}
            <span className="hz-type" role="cell">
              <HazardIcon type={h.type} />
              {h.type}
            </span>

            {/* Severity badge */}
            <span className={`hz-badge ${SEVERITY_CLASS[h.severity] || 'hz-badge-medium'}`} role="cell">
              {h.severity}
            </span>

            {/* Distance */}
            <span className="hz-distance" role="cell">{h.distance_m} m</span>

            {/* Time */}
            <span className="hz-time" role="cell">{fmtTime(h.detected_at)}</span>

          </div>
        ))}

      </div>

    </div>
  )
}
