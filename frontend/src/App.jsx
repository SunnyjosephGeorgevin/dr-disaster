import { useState, useCallback } from 'react'
import { useWebSocket } from './hooks/useWebSocket.js'
import { fetchRoute } from './api/client.js'
import MapView from './components/MapView.jsx'
import PriorityList from './components/PriorityList.jsx'
import RouteMeta from './components/RouteMeta.jsx'
import ConnectivityBadge from './components/ConnectivityBadge.jsx'
import MissionStatus from './components/MissionStatus.jsx'
import DegradedBanner from './components/DegradedBanner.jsx'
import DemoControls from './components/DemoControls.jsx'

const THERMAL_FAULT_MSG =
  'Thermal sensor unavailable – RGB-only perception active.'

/* Calculate distance between two GPS coordinates in kilometres. */
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371

  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export default function App() {
  const { state, socketConnected } = useWebSocket()

  const [selectedId, setSelectedId] = useState(null)
  const [route, setRoute] = useState(null)
  const [routeError, setRouteError] = useState(null)

  const handleSelectVictim = useCallback(
    async (victimId) => {
      if (selectedId === victimId) {
        setSelectedId(null)
        setRoute(null)
        setRouteError(null)
        return
      }

      setSelectedId(victimId)
      setRoute(null)
      setRouteError(null)

      try {
        const result = await fetchRoute(victimId)

        if (result.error) {
          setRouteError(result.error)
        } else {
          setRoute(result)
        }
      } catch (err) {
        setRouteError(
          'Route request failed — backend unreachable.'
        )
      }
    },
    [selectedId]
  )

  const hasThermalFault = Boolean(
    state?.degraded_reasons?.includes(THERMAL_FAULT_MSG)
  )

  /*
   * Drone distance from the fixed rescue-team base.
   */
  const droneDistanceFromBase =
    state?.base && state?.drone
      ? distanceKm(
          state.base.lat,
          state.base.lon,
          state.drone.lat,
          state.drone.lon
        )
      : null

  return (
    <div className="app-shell">

      {/* =====================================================
          STATUS BAR
          ===================================================== */}

      <div className="statusbar">

        <div className="title-block">
          <h1>Field Response — Sector 7</h1>

          <span className="sector-tag">
            DEMO / MOCK DATA
          </span>
        </div>

        <div className="status-cluster">

          <MissionStatus
            status={state?.mission_status}
          />

          <ConnectivityBadge
            connectivity={state?.connectivity}
          />

          {!socketConnected && (
            <div className="badge danger">
              <span className="dot" />

              <span>
                Stream disconnected — retrying…
              </span>
            </div>
          )}

        </div>
      </div>

      {/* =====================================================
          DEGRADED MODE BANNER
          ===================================================== */}

      <DegradedBanner
        reasons={state?.degraded_reasons}
      />

      {/* =====================================================
          MAIN DASHBOARD
          ===================================================== */}

      <div className="main">

        {/* ===================================================
            MAP
            =================================================== */}

        <div className="map-panel">

          <div className="map-header">

            <span className="label">
              Operational Map — Sector 7
            </span>

            <span className="coord-readout">
              AUTONOMOUS RECONNAISSANCE · LOCAL DEMO
            </span>

          </div>

          <MapView
            base={state?.base}
            hazards={state?.hazards || []}
            victims={state?.victims || []}
            drone={state?.drone}
            route={route}
            selectedId={selectedId}
            onSelectVictim={handleSelectVictim}
          />

          {/* =================================================
              MAP LEGEND
              ================================================= */}

          <div className="legend">

            <span className="item">
              ▲ Victim — Critical
            </span>

            <span className="item">
              ■ Victim — Elevated
            </span>

            <span className="item">
              ● Victim — Low
            </span>

            <span className="item">
              ◆ Hazard zone
            </span>

            <span className="item">
              ➤ Autonomous drone
            </span>

            <span className="item">
              - - - Computed safe route
            </span>

          </div>

          {/* =================================================
              ROUTE INFORMATION
              ================================================= */}

          <RouteMeta
            selectedId={selectedId}
            route={route}
            error={routeError}
            onClear={() => {
              if (selectedId) {
                handleSelectVictim(selectedId)
              }
            }}
          />

        </div>

        {/* ===================================================
            RIGHT PANEL
            =================================================== */}

        <div className="list-panel">

          <PriorityList
            victims={state?.victims || []}
            selectedId={selectedId}
            onSelect={handleSelectVictim}
            routeError={routeError}
          />

          <DemoControls
            currentLink={state?.connectivity?.link}
            hasThermalFault={hasThermalFault}
            onThermalFaultChange={() => {}}
            drone={state?.drone}
            distanceFromBase={droneDistanceFromBase}
          />

        </div>

      </div>
    </div>
  )
}
