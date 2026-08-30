# Work Log — Sector 7 Field Response Dashboard

## Phase 1 — Single-file HTML/SVG prototype (offline)

Built to the original requirements spec (two-column layout, offline SVG map,
priority list, click-to-route with hazard avoidance, drone marker +
connectivity states, tactical visual language, accessibility basics).

**Delivered:** `disaster-response-dashboard.html` — one static file, no
build step, no network dependency. Map rendered as inline SVG on a 1000×640
local grid; hazard-avoidance routing done client-side with grid A*.

**Later refinement:** the drone originally moved on a random timer. Changed
to user-directed steering (arrow keys / on-screen D-pad), with movement
rules tied to link state — Wi-Fi/4G take fine steps, LoRa takes coarse
steps, "no link" ignores input entirely so the marker genuinely holds at
its last known position rather than silently drifting.

**Status:** complete, verified in-browser logic by hand (no automated
tests — it's a static file with no server).

---

## Phase 2 — React + Leaflet, FastAPI/WebSocket backend

Rebuilt as a real client/server app per the follow-up spec: React front end
on Leaflet, FastAPI backend streaming state over WebSocket, REST endpoint
for route computation. Kept the same visual language and mock dataset so
behavior matches Phase 1 one-for-one.

### Backend (`backend/`)

| File | Purpose |
|---|---|
| `mock_data.py` | Static victims/hazards/base + initial drone/mission state |
| `geo.py` | Local meter grid ⇄ lat/lon conversion (equirectangular approx, origin near Chennai — arbitrary, no live location data) |
| `routing.py` | Grid A* hazard-avoidance routing, ported from the Phase 1 JS |
| `main.py` | FastAPI app: `WS /ws/stream`, `POST /api/route`, plus demo-control endpoints for link/steer/degraded-reason |

**Bug found and fixed during this phase:** the A* implementation blocked
any grid cell inside a hazard's buffer radius — including the victim's own
cell if they happened to be standing near a hazard edge (e.g. `V-032`, ~64m
from a flood zone with an 85m buffer). That made a real, reachable victim
report as "unreachable." Fixed by exempting only the goal cell from the
blocked check, so the buffer still discourages routing *through* a hazard
elsewhere but never denies the actual rescue destination. Re-verified all
six mock victims resolve to a route after the fix.

**Verified locally, this session:**
- `pip install -r requirements.txt` — clean
- `python -m py_compile` on all backend modules — clean
- `uvicorn` boots; `GET /api/state`, `POST /api/route` (all 6 victims),
  `POST /api/drone/link`, `POST /api/drone/move` all exercised via curl
- WebSocket handshake confirmed with a throwaway Python client — receives
  a valid `state_update` payload with victims, hazards, drone, connectivity

### Frontend (`frontend/`, Vite + React 18 + react-leaflet 4)

| Component | Requirement it satisfies |
|---|---|
| `App.jsx` | Wires the WebSocket stream + REST calls into the full dashboard |
| `MapView.jsx` | Victim markers (shape+letter coded by priority), uncertainty radii, hazard overlays (marker + buffer ring), safe-route polyline, base marker, OSM tile layer |
| `DroneMarker.jsx` | Distinct heading-aware chevron icon; drops to reduced opacity + "last seen" popup label when `drone.stale` |
| `ConnectivityBadge.jsx` | Text-first badge with the exact spec wording ("Connected — Wi-Fi", "Connected — LoRa (limited data)", "No connection — last known position shown") |
| `DegradedBanner.jsx` | Renders every active degraded-mode reason as its own banner line, including the thermal-sensor example from the spec |
| `PriorityList.jsx` | Sorted, clickable, keyboard-operable victim list; click → route fetch |
| `RouteMeta.jsx` | Distance, hazard-avoidance count, waypoint count, clear control |
| `MissionStatus.jsx` | ACTIVE / DEGRADED badge |
| `DemoControls.jsx` | Link switcher, drone steering pad, thermal-fault toggle — calls the same REST endpoints a real ground link would use |

**Verified locally, this session:**
- `npm install` — 66 packages, clean
- `npx vite build` — production build succeeds (no type/syntax errors)
- Manual review of all Leaflet layer composition (grouped victim/hazard
  layers use `Fragment`, not stray `<div>`s, so nothing interferes with
  Leaflet's own pane structure)

**Not yet run in this session:** the full dev server pair (`vite dev` +
`uvicorn --reload`) side by side in a live browser. Backend and frontend
have each been verified independently (backend via curl/websockets client,
frontend via production build); wiring them together in an actual browser
tab is the natural next check before calling this "demo-ready."

### Design carried over from Phase 1

Dark tactical palette, Space Grotesk / IBM Plex Sans / IBM Plex Mono type
system, no emoji, minimal rounding, color-blind-safe priority coding
(shape + letter + weight, not color alone) — same tokens, same visual
language, now expressed as CSS custom properties in
`frontend/src/styles/dashboard.css` instead of inline `<style>`.

### What changed vs. the offline requirement

The original spec called for a fully offline map. This phase uses
OpenStreetMap's public tile server, which needs internet access in the
browser — a deliberate trade-off to get real Leaflet map behavior "within
free credentials" (no paid tile provider, no API key). If the offline
requirement is hard, the straightforward fix is self-hosting a small tile
set (e.g. via `mbtiles` + a local tile server) and pointing `TileLayer`'s
`url` at it — the rest of the app doesn't care where tiles come from.

### Known gaps / open items

- No automated test suite on either side (manual verification only, as
  logged above).
- `InitialFrame` in `MapView.jsx` fits map bounds once, on first data
  arrival — if the backend later moves the base marker significantly,
  the view won't auto-refit (deliberate, so it doesn't fight the
  operator's own pan/zoom).
- Demo controls (link switch, steering, thermal fault) are intentionally
  visible in the UI for this prototype; in a production build they'd move
  behind a debug flag or be removed entirely.
- Route requests are fire-and-forget from the client; a slow/unreachable
  backend surfaces as "Route request failed — backend unreachable." with
  no retry — acceptable for a demo, worth hardening later.
