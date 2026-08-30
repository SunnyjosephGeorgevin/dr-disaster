import { setDegradedReasons } from '../api/client.js'

/**
 * Autonomous drone telemetry and demonstration panel.
 *
 * The drone is autonomous.
 * There are intentionally no manual steering controls
 * or communication-link switching controls.
 */
export default function DemoControls({
  currentLink,
  hasThermalFault,
  onThermalFaultChange,
  drone,
  distanceFromBase,
}) {

  const linkLabel = {
    wifi: 'WI-FI',
    cell: '4G / 5G',
    lora: 'LORA',
    none: 'NO CONNECTION',
  }

  const localizationLabel = {
    gps: 'GPS',
    vio: 'VIO',
    gps_vio: 'GPS + VIO',
  }

  const cameraLabel = {
    rgb: 'RGB',
    thermal: 'THERMAL',
    rgb_thermal: 'RGB + THERMAL',
  }

  function formatTime(timestamp) {
    if (!timestamp) return 'UNKNOWN'

    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  function formatAge(timestamp) {
    if (!timestamp) return 'UNKNOWN'

    const seconds = Math.max(
      0,
      Math.round(Date.now() / 1000 - timestamp)
    )

    if (seconds < 2) return 'JUST NOW'

    if (seconds < 60) {
      return `${seconds}s AGO`
    }

    const minutes = Math.floor(seconds / 60)

    if (minutes < 60) {
      return `${minutes}m AGO`
    }

    return `${Math.floor(minutes / 60)}h AGO`
  }

  const isStale = Boolean(drone?.stale)

  return (
    <div className="demo-panel">

      {/* =====================================================
          AUTONOMOUS STATUS
          ===================================================== */}

      <div className="label">
        AUTONOMOUS DRONE
      </div>

      <div
        className={`autonomous-status ${
          isStale ? 'stale' : ''
        }`}
      >

        <span className="status-indicator" />

        <div>
          <strong>
            DRONE-01
          </strong>

          <span>
            {isStale
              ? 'LAST KNOWN POSITION'
              : 'AUTONOMOUS RECONNAISSANCE ACTIVE'}
          </span>
        </div>

      </div>

      {/* =====================================================
          DRONE TELEMETRY
          ===================================================== */}

      <div className="drone-telemetry">

        <div className="telemetry-row">
          <span>LINK</span>

          <strong>
            {linkLabel[currentLink] || 'UNKNOWN'}
          </strong>
        </div>

        <div className="telemetry-row">
          <span>LOCALIZATION</span>

          <strong>
            {localizationLabel[drone?.localization] ||
              'UNKNOWN'}
          </strong>
        </div>

        <div className="telemetry-row">
          <span>PERCEPTION</span>

          <strong>
            {cameraLabel[drone?.camera] ||
              'UNKNOWN'}
          </strong>
        </div>

        <div className="telemetry-row">
          <span>LAST UPDATE</span>

          <strong>
            {formatTime(drone?.last_updated)}
          </strong>
        </div>

        <div className="telemetry-row">
          <span>POSITION AGE</span>

          <strong>
            {formatAge(drone?.last_updated)}
          </strong>
        </div>

        <div className="telemetry-row">
          <span>FROM BASE</span>

          <strong>
            {typeof distanceFromBase === 'number'
              ? `${distanceFromBase.toFixed(2)} KM`
              : 'CALCULATING'}
          </strong>
        </div>

        <div className="telemetry-row">
          <span>HEADING</span>

          <strong>
            {drone?.heading != null
              ? `${Math.round(drone.heading)}°`
              : 'UNKNOWN'}
          </strong>
        </div>

        <div className="telemetry-row">
          <span>COORDINATES</span>

          <strong>
            {drone?.lat != null && drone?.lon != null
              ? `${drone.lat.toFixed(4)}, ${drone.lon.toFixed(4)}`
              : 'UNKNOWN'}
          </strong>
        </div>

      </div>

      {/* =====================================================
          HAZARD DETECTION
          ===================================================== */}

      <div
        className="label"
        style={{ marginTop: 14 }}
      >
        PERCEPTION
      </div>

      <div className="detection-note">
        Autonomous hazard detection active.
        Detected hazards are tagged on the operational
        map with type, severity, location and timestamp.
      </div>

      {/* =====================================================
          SENSOR FAULT DEMO
          ===================================================== */}

      <div
        className="label"
        style={{ marginTop: 14 }}
      >
        DEMO — SENSOR FAULT
      </div>

      <div className="demo-buttons">

        <button
          className={hasThermalFault ? 'active' : ''}
          onClick={() => {
            const next = !hasThermalFault

            onThermalFaultChange(next)

            setDegradedReasons(
              next
                ? [
                    'Thermal sensor unavailable – RGB-only perception active.',
                  ]
                : []
            )
          }}
        >
          {hasThermalFault
            ? 'CLEAR THERMAL FAULT'
            : 'SIMULATE THERMAL FAULT'}
        </button>

      </div>

    </div>
  )
}