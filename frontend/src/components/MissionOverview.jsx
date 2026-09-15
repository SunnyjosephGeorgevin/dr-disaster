/**
 * MissionOverview - displays key mission statistics.
 */
export default function MissionOverview({ victims = [], hazards = [] }) {
  const MOCK = {
    areaCovered: 1.35,
    waypointsCompleted: 7,
    waypointsTotal: 15,
    searchPattern: 'Lawnmower',
    altitudeAGL: 82,
  }

  const victimsFound = victims.length || 5
  const hazardsFound = hazards.length || 12

  return (
    <div className="mission-overview-panel">
      <div className="mo-header">
        <span className="mo-title">MISSION OVERVIEW</span>
      </div>
      <div className="mo-grid">
        <div className="mo-card">
          <div className="mo-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="#8A96A3" strokeWidth="1.6"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="#8A96A3" strokeWidth="1.6"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="#8A96A3" strokeWidth="1.6"/>
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="#8A96A3" strokeWidth="1.6"/>
            </svg>
          </div>
          <div className="mo-card-body">
            <span className="mo-card-label">AREA COVERED</span>
            <span className="mo-card-value">{MOCK.areaCovered} km²</span>
          </div>
        </div>
        <div className="mo-card">
          <div className="mo-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" stroke="#8A96A3" strokeWidth="1.6"/>
              <circle cx="12" cy="12" r="3" fill="#8A96A3"/>
            </svg>
          </div>
          <div className="mo-card-body">
            <span className="mo-card-label">WAYPOINTS</span>
            <span className="mo-card-value">
              <span className="mo-wp-done">{MOCK.waypointsCompleted}</span>
              <span className="mo-wp-sep"> / </span>
              <span className="mo-wp-total">{MOCK.waypointsTotal}</span>
            </span>
          </div>
        </div>
        <div className="mo-card">
          <div className="mo-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="#D9A441" strokeWidth="1.6"/>
              <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#D9A441" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="mo-card-body">
            <span className="mo-card-label">VICTIMS FOUND</span>
            <span className="mo-card-value mo-value-victims">{victimsFound}</span>
          </div>
        </div>
        <div className="mo-card">
          <div className="mo-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L22 21H2L12 3Z" stroke="#E4572E" strokeWidth="1.6" strokeLinejoin="round"/>
              <line x1="12" y1="10" x2="12" y2="15" stroke="#E4572E" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="12" cy="18" r="0.9" fill="#E4572E"/>
            </svg>
          </div>
          <div className="mo-card-body">
            <span className="mo-card-label">HAZARDS FOUND</span>
            <span className="mo-card-value mo-value-hazards">{hazardsFound}</span>
          </div>
        </div>
      </div>
      <div className="mo-details">
        <div className="mo-detail-row">
          <span className="mo-detail-label">SEARCH PATTERN</span>
          <span className="mo-detail-value">{MOCK.searchPattern}</span>
        </div>
        <div className="mo-detail-row">
          <span className="mo-detail-label">CURRENT ALTITUDE</span>
          <span className="mo-detail-value">{MOCK.altitudeAGL} m AGL</span>
        </div>
      </div>
    </div>
  )
}
