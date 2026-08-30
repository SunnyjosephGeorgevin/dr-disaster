import { useMemo } from 'react'
import { Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'

/**
 * Autonomous drone marker.
 *
 * Displays:
 * - Drone identity and autonomous status
 * - Heading
 * - Last location update
 * - Distance from rescue base
 * - GPS / VIO localization
 * - RGB / Thermal perception
 * - Communication link
 *
 * When drone.stale is true, the marker is reduced in opacity and
 * explicitly labeled as the last known position.
 */

function chevronIcon(heading, stale) {
  const opacity = stale ? 0.42 : 1

  const html = `
    <div class="drone-marker-wrapper ${stale ? 'stale' : ''}" style="opacity:${opacity};">

      <div
        class="drone-icon"
        style="
          transform:rotate(${heading}deg);
          width:40px;
          height:40px;
          display:flex;
          align-items:center;
          justify-content:center;
        "
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <polygon
            points="16,2 27,28 16,21 5,28"
            fill="#D9E1E8"
            stroke="#111820"
            stroke-width="2"
          />
          <polygon
            points="16,6 20,20 16,17 12,20"
            fill="#111820"
          />
        </svg>
      </div>

      <div class="drone-map-label">
        <strong>DRONE-01</strong>
        <span>${stale ? 'LAST KNOWN POSITION' : 'AUTONOMOUS'}</span>
      </div>

    </div>
  `

  return L.divIcon({
    html,
    className: '',
    iconSize: [190, 52],
    iconAnchor: [20, 26],
  })
}

function formatTimestamp(lastUpdatedEpochSeconds) {
  if (!lastUpdatedEpochSeconds) return 'UNKNOWN'

  return new Date(lastUpdatedEpochSeconds * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatAge(lastUpdatedEpochSeconds) {
  if (!lastUpdatedEpochSeconds) return 'UNKNOWN'

  const seconds = Math.max(
    0,
    Math.round(Date.now() / 1000 - lastUpdatedEpochSeconds)
  )

  if (seconds < 2) return 'JUST NOW'
  if (seconds < 60) return `${seconds}s AGO`

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) return `${minutes}m AGO`

  return `${Math.floor(minutes / 60)}h AGO`
}

function formatLocalization(localization) {
  switch (localization) {
    case 'gps':
      return 'GPS'
    case 'vio':
      return 'VIO'
    case 'gps_vio':
      return 'GPS + VIO'
    default:
      return 'UNKNOWN'
  }
}

function formatCamera(camera) {
  switch (camera) {
    case 'rgb':
      return 'RGB'
    case 'thermal':
      return 'THERMAL'
    case 'rgb_thermal':
      return 'RGB + THERMAL'
    default:
      return 'UNKNOWN'
  }
}

export default function DroneMarker({ drone, distanceFromBase }) {
  const icon = useMemo(
    () => chevronIcon(drone.heading, drone.stale),
    [drone.heading, drone.stale]
  )

  const timestamp = formatTimestamp(drone.last_updated)
  const age = formatAge(drone.last_updated)

  const localization = formatLocalization(drone.localization)
  const camera = formatCamera(drone.camera)

  const distance =
    typeof distanceFromBase === 'number'
      ? `${distanceFromBase.toFixed(2)} KM`
      : 'CALCULATING'

  return (
    <>
      <Circle
        center={[drone.lat, drone.lon]}
        radius={28}
        pathOptions={{
          color: '#7C93AC',
          weight: 1,
          dashArray: '3 5',
          fillOpacity: 0,
          opacity: drone.stale ? 0.2 : 0.6,
        }}
      />

      <Marker
        position={[drone.lat, drone.lon]}
        icon={icon}
      >
        <Popup>
          <div className="drone-popup">

            <div className="drone-popup-title">
              DRONE-01
            </div>

            <div className="drone-popup-status">
              {drone.stale
                ? 'LAST KNOWN POSITION'
                : 'AUTONOMOUS'}
            </div>

            <div className="drone-popup-divider" />

            <div className="drone-popup-row">
              <span>POSITION</span>
              <strong>
                {drone.lat.toFixed(5)}, {drone.lon.toFixed(5)}
              </strong>
            </div>

            <div className="drone-popup-row">
              <span>FROM BASE</span>
              <strong>{distance}</strong>
            </div>

            <div className="drone-popup-row">
              <span>HEADING</span>
              <strong>{Math.round(drone.heading)}°</strong>
            </div>

            <div className="drone-popup-row">
              <span>LAST UPDATED</span>
              <strong>{timestamp}</strong>
            </div>

            <div className="drone-popup-row">
              <span>AGE</span>
              <strong>{age}</strong>
            </div>

            <div className="drone-popup-row">
              <span>LOCALIZATION</span>
              <strong>{localization}</strong>
            </div>

            <div className="drone-popup-row">
              <span>PERCEPTION</span>
              <strong>{camera}</strong>
            </div>

            <div className="drone-popup-row">
              <span>LINK</span>
              <strong>{drone.link?.toUpperCase() || 'NONE'}</strong>
            </div>

          </div>
        </Popup>
      </Marker>
    </>
  )
}

