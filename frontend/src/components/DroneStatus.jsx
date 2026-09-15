import { useState, useEffect } from 'react'

/**
 * DroneStatus — live drone telemetry card shown below Mission Overview.
 * Uses mock data with cycled drone state (SEARCH → APPROACH → AVOID).
 * Live props (drone) are used when available for signal + last-update.
 */

const STATES   = ['SEARCH', 'APPROACH', 'AVOID']
const STATE_CLASS = { SEARCH: 'ds-state-search', APPROACH: 'ds-state-approach', AVOID: 'ds-state-avoid' }

const MOCK = {
  batteryPct:     78,
  speedMs:        4.2,
  signalStrength: 91,   // %
}

function BatteryIcon({ pct }) {
  const fill = pct > 60 ? '#3FA796' : pct > 30 ? '#D9A441' : '#E4572E'
  const w = Math.round((pct / 100) * 12)
  return (
    <svg width="20" height="12" viewBox="0 0 20 12" fill="none" style={{ flexShrink: 0 }}>
      <rect x="0.5" y="0.5" width="16" height="11" rx="1.5" stroke="#545F6B" strokeWidth="1"/>
      <rect x="17" y="3.5" width="2.5" height="5" rx="1" fill="#545F6B"/>
      <rect x="2" y="2" width={w} height="8" rx="1" fill={fill}/>
    </svg>
  )
}

function SignalIcon({ strength }) {
  const bars = strength > 75 ? 4 : strength > 50 ? 3 : strength > 25 ? 2 : 1
  const color = strength > 60 ? '#3FA796' : strength > 30 ? '#D9A441' : '#E4572E'
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" style={{ flexShrink: 0 }}>
      {[1,2,3,4].map((b) => (
        <rect
          key={b}
          x={1 + (b - 1) * 4.2}
          y={14 - b * 3.2}
          width="3"
          height={b * 3.2}
          rx="0.5"
          fill={b <= bars ? color : '#2B333B'}
        />
      ))}
    </svg>
  )
}

function formatTime(ts) {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  })
}

export default function DroneStatus({ drone }) {
  const [stateIdx, setStateIdx] = useState(0)

  // Cycle through SEARCH → APPROACH → AVOID every 4 s (mock)
  useEffect(() => {
    const t = setInterval(() => setStateIdx(i => (i + 1) % STATES.length), 4000)
    return () => clearInterval(t)
  }, [])

  const droneState    = STATES[stateIdx]
  const battery       = drone?.battery_pct  ?? MOCK.batteryPct
  const speed         = drone?.speed_ms     ?? MOCK.speedMs
  const signal        = drone?.signal_pct   ?? MOCK.signalStrength
  const lastUpdate    = drone?.last_updated ?? null

  return (
    <div className="drone-status-panel">

      <div className="ds-header">
        <span className="ds-title">DRONE STATUS</span>
        <span className={`ds-state-badge ${STATE_CLASS[droneState]}`}>{droneState}</span>
      </div>

      <div className="ds-grid">

        {/* Battery */}
        <div className="ds-row">
          <div className="ds-row-left">
            <BatteryIcon pct={battery} />
            <span className="ds-label">BATTERY</span>
          </div>
          <span className="ds-value" style={{ color: battery > 60 ? '#3FA796' : battery > 30 ? '#D9A441' : '#E4572E' }}>
            {battery}%
          </span>
        </div>

        {/* Speed */}
        <div className="ds-row">
          <div className="ds-row-left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M12 2a10 10 0 1 0 10 10" stroke="#545F6B" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M12 12L18 6" stroke="#F2C078" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="1.5" fill="#F2C078"/>
            </svg>
            <span className="ds-label">SPEED</span>
          </div>
          <span className="ds-value">{speed.toFixed(1)} m/s</span>
        </div>

        {/* Signal Strength */}
        <div className="ds-row">
          <div className="ds-row-left">
            <SignalIcon strength={signal} />
            <span className="ds-label">SIGNAL</span>
          </div>
          <span className="ds-value" style={{ color: signal > 60 ? '#3FA796' : signal > 30 ? '#D9A441' : '#E4572E' }}>
            {signal}%
          </span>
        </div>

        {/* Last Update */}
        <div className="ds-row">
          <div className="ds-row-left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="9" stroke="#545F6B" strokeWidth="1.8"/>
              <path d="M12 7v5l3 3" stroke="#8A96A3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="ds-label">LAST UPDATE</span>
          </div>
          <span className="ds-value ds-value-sm">{formatTime(lastUpdate)}</span>
        </div>

      </div>
    </div>
  )
}
