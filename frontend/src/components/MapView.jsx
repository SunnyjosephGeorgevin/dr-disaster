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
  html: `<svg width="24" height="24" viewBox="0 0 24 24">
    <rect x="4" y="4" width="16" height="16" fill="#12171C" stroke="#E6EAEE" stroke-width="1.8"/>
    <line x1="1" y1="12" x2="23" y2="12" stroke="#E6EAEE" stroke-width="1"/>
    <line x1="12" y1="1" x2="12" y2="23" stroke="#E6EAEE" stroke-width="1"/>
  </svg>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
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

        {/* Base / reference point */}
        <Marker
          position={[base.lat, base.lon]}
          icon={BASE_ICON}
        >
          <Popup>
            <div className="map-popup">
              <strong>RESCUE TEAM BASE</strong>
              <div>Reference point for route calculations</div>
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
