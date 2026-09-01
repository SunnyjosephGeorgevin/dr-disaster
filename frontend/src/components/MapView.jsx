import { useMemo, Fragment } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polyline,
  Popup,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import DroneMarker from './DroneMarker.jsx'

const PRIORITY_COLOR = {
  critical: '#E4572E',
  elevated: '#D9A441',
  low: '#3FA796',
}

const PRIORITY_LETTER = {
  critical: 'C',
  elevated: 'E',
  low: 'L',
}

function shapeSvg(priority, color, letter) {
  if (priority === 'critical') {
    return `<svg width="26" height="26" viewBox="0 0 26 26">
      <polygon points="13,3 23,21 3,21" fill="#12171C" stroke="${color}" stroke-width="2.4"/>
      <text x="13" y="18" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="700" fill="${color}">${letter}</text>
    </svg>`
  }

  if (priority === 'elevated') {
    return `<svg width="26" height="26" viewBox="0 0 26 26">
      <rect x="4" y="4" width="18" height="18" fill="#12171C" stroke="${color}" stroke-width="2.4"/>
      <text x="13" y="17.5" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="700" fill="${color}">${letter}</text>
    </svg>`
  }

  return `<svg width="26" height="26" viewBox="0 0 26 26">
    <circle cx="13" cy="13" r="10" fill="#12171C" stroke="${color}" stroke-width="2.4"/>
    <text x="13" y="17" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="700" fill="${color}">${letter}</text>
  </svg>`
}

function victimIcon(priority, selected) {
  const color = PRIORITY_COLOR[priority]
  const letter = PRIORITY_LETTER[priority]

  const ring = selected
    ? `<div style="position:absolute; inset:-6px; border:1.4px dashed #F2C078; border-radius:50%;"></div>`
    : ''

  const html = `
    <div style="position:relative; width:26px; height:26px;">
      ${ring}
      ${shapeSvg(priority, color, letter)}
    </div>
  `

  return L.divIcon({
    html,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

const BASE_ICON = L.divIcon({
  html: `
    <div class="base-marker-wrapper">
      <div class="base-icon">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Outer tactical container with rounded corners and high-contrast glowing border -->
          <rect x="2" y="2" width="32" height="32" rx="6" fill="#0E1318" stroke="#3FA796" stroke-width="2.2"/>
          
          <!-- Tactical corner brackets -->
          <path d="M6 3.5 L3.5 3.5 L3.5 6" stroke="#E6EAEE" stroke-width="1" stroke-linecap="round" fill="none"/>
          <path d="M30 3.5 L32.5 3.5 L32.5 6" stroke="#E6EAEE" stroke-width="1" stroke-linecap="round" fill="none"/>
          <path d="M6 32.5 L3.5 32.5 L3.5 30" stroke="#E6EAEE" stroke-width="1" stroke-linecap="round" fill="none"/>
          <path d="M30 32.5 L32.5 32.5 L32.5 30" stroke="#E6EAEE" stroke-width="1" stroke-linecap="round" fill="none"/>
          
          <!-- Radio mast / antenna signal arcs -->
          <path d="M12 8.5 C14 6.5, 22 6.5, 24 8.5" stroke="#3FA796" stroke-width="1.3" stroke-linecap="round" fill="none"/>
          <path d="M14.5 10.5 C16 9.5, 20 9.5, 21.5 10.5" stroke="#3FA796" stroke-width="1.1" stroke-linecap="round" fill="none"/>
          <line x1="18" y1="8" x2="18" y2="13" stroke="#3FA796" stroke-width="1.8"/>
          <circle cx="18" cy="7.5" r="1.5" fill="#3FA796"/>

          <!-- Command Headquarters structure -->
          <path d="M8 17 L18 11.5 L28 17 L28 28.5 L8 28.5 Z" fill="#182026" stroke="#E6EAEE" stroke-width="1.6" stroke-linejoin="round"/>
          
          <!-- HQ Tactical Label -->
          <text x="18" y="24.5" text-anchor="middle" fill="#3FA796" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="700" letter-spacing="0.5">HQ</text>
        </svg>
      </div>

      <div class="base-map-label">
        <strong>RESCUE BASE</strong>
        <span>COMMAND HQ</span>
      </div>
    </div>
  `,
  className: '',
  iconSize: [190, 52],
  iconAnchor: [18, 22],
})

const HAZARD_ICON = L.divIcon({
  html: `<svg width="24" height="24" viewBox="0 0 24 24">
    <polygon
      points="12,2 22,12 12,22 2,12"
      fill="#3A1416"
      stroke="#C8383A"
      stroke-width="1.8"
    />
  </svg>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

/*
 * Calculates the great-circle distance between two geographic points.
 * Returns kilometres.
 */
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371

  const lat1Rad = (lat1 * Math.PI) / 180
  const lat2Rad = (lat2 * Math.PI) / 180

  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/*
 * Formats Unix epoch seconds into HH:MM:SS.
 */
function formatDetectionTime(epochSeconds) {
  if (!epochSeconds) return 'UNKNOWN'

  return new Date(epochSeconds * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/** Re-centers the map once, on first data arrival, without fighting the
 * user's subsequent pan/zoom. */
function InitialFrame({ base, victims }) {
  const map = useMap()

  useMemo(() => {
    if (!base) return

    const points = [
      [base.lat, base.lon],
      ...victims.map((v) => [v.lat, v.lon]),
    ]

    map.fitBounds(points, {
      padding: [40, 40],
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base?.lat, base?.lon])

  return null
}

export default function MapView({
  base,
  hazards,
  victims,
  drone,
  route,
  selectedId,
  onSelectVictim,
}) {
  if (!base || !drone) {
    return <div className="map-frame" />
  }

  const routeLatLngs = route
    ? route.waypoints.map((w) => [w.lat, w.lon])
    : null

  /*
   * Calculate the drone's real geographic distance from
   * the rescue team base.
   */
  const droneDistanceFromBase = distanceKm(
    base.lat,
    base.lon,
    drone.lat,
    drone.lon
  )

  return (
    <div className="map-frame">
      <MapContainer
        center={[base.lat, base.lon]}
        zoom={16}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <InitialFrame
          base={base}
          victims={victims}
        />

        {/* Base perimeter / comms radius */}
        <Circle
          center={[base.lat, base.lon]}
          radius={35}
          pathOptions={{
            color: '#3FA796',
            weight: 1.5,
            dashArray: '4 4',
            fillOpacity: 0.05,
            fillColor: '#3FA796',
            opacity: 0.6,
          }}
        />

        {/* Base / reference point */}
        <Marker
          position={[base.lat, base.lon]}
          icon={BASE_ICON}
        >
          <Popup>
            <div className="base-popup">
              <div className="base-popup-title">RESCUE TEAM BASE</div>
              <div className="base-popup-status">OPERATIONAL · COMMAND HQ</div>
              <div className="base-popup-divider" />
              <div className="base-popup-row">
                <span>COORDINATES</span>
                <strong>{base.lat.toFixed(5)}, {base.lon.toFixed(5)}</strong>
              </div>
              <div className="base-popup-row">
                <span>ROLE</span>
                <strong>Route Origin & Comms Relay</strong>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Hazard overlays */}
        {hazards.map((h) => (
          <Fragment key={h.id}>

            <Circle
              center={[h.lat, h.lon]}
              radius={h.radius}
              pathOptions={{
                color: '#C8383A',
                weight: 1,
                dashArray: '3 4',
                fillOpacity: 0.04,
                fillColor: '#C8383A',
                opacity: 0.5,
              }}
            />

            <Marker
              position={[h.lat, h.lon]}
              icon={HAZARD_ICON}
            >
              <Popup>
                <div className="hazard-popup">

                  <div className="hazard-popup-title">
                    {h.id}
                  </div>

                  <div className="hazard-popup-type">
                    {h.type.toUpperCase()}
                  </div>

                  <div className="hazard-popup-row">
                    <span>SEVERITY</span>
                    <strong>
                      {h.severity.toUpperCase()}
                    </strong>
                  </div>

                  <div className="hazard-popup-row">
                    <span>LOCATION</span>
                    <strong>
                      {h.lat.toFixed(5)}, {h.lon.toFixed(5)}
                    </strong>
                  </div>

                  <div className="hazard-popup-row">
                    <span>DETECTED</span>
                    <strong>
                      {formatDetectionTime(h.detected_at)}
                    </strong>
                  </div>

                </div>
              </Popup>
            </Marker>
          </Fragment>
        ))}

        {/* Safe route */}
        {routeLatLngs && (
          <Polyline
            positions={routeLatLngs}
            pathOptions={{
              color: '#F2C078',
              weight: 3,
              dashArray: '7 5',
            }}
          />
        )}

        {/* Victim markers */}
        {victims.map((v) => (
          <Fragment key={v.id}>

            <Circle
              center={[v.lat, v.lon]}
              radius={v.uncertainty_m}
              pathOptions={{
                color: PRIORITY_COLOR[v.priority],
                weight: 1,
                fillOpacity: 0.05,
                fillColor: PRIORITY_COLOR[v.priority],
                opacity: 0.35,
              }}
            />

            <Marker
              position={[v.lat, v.lon]}
              icon={victimIcon(
                v.priority,
                v.id === selectedId
              )}
              eventHandlers={{
                click: () => onSelectVictim(v.id),
              }}
            >
              <Popup>
                <div
                  style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: 12,
                  }}
                >
                  <div>
                    {v.id} — {v.priority.toUpperCase()}
                  </div>

                  <div>
                    Risk {v.risk} · {v.condition}
                  </div>

                  <div>
                    Position uncertainty: ±{v.uncertainty_m} m
                  </div>
                </div>
              </Popup>
            </Marker>

          </Fragment>
        ))}

        {/* Autonomous drone */}
        <DroneMarker
          drone={drone}
          distanceFromBase={droneDistanceFromBase}
        />

      </MapContainer>
    </div>
  )
}
