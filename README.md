# Sector 7 — Field Response Dashboard (React + Leaflet)

A disaster-response operator dashboard: victim/hazard markers, uncertainty
radii, hazard-avoidance routing, drone position with heading and staleness
handling, connectivity status, and degraded-mode banners — backed by a
FastAPI service over WebSocket + REST.

Everything here runs on free, keyless infrastructure: OpenStreetMap's public
tile server (no API key) and open-source packages only. No paid services
are required to run this demo.

## Run the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Check it's alive: open `http://localhost:8000/api/state` or `http://localhost:8000/docs`.

## Run the frontend

```bash
cd frontend
npm install
cp .env.example .env   # defaults already point at localhost:8000
npm run dev
```

Open `http://localhost:5173`.

## What's mock vs. real

- Victim, hazard, and base coordinates are static demo data (`backend/mock_data.py`),
  per the "prototype phase, static/mock data acceptable" note in the original spec.
- The drone's position, heading, and link state are held server-side and pushed
  over `/ws/stream`; the on-screen "Demo Controls" panel drives them via REST
  so you can see every connectivity/staleness state without real hardware.
- Route computation (`POST /api/route`) is a real grid-based A* search that
  avoids hazard buffer zones — not mocked, not a straight line.
- Map tiles come from the public OpenStreetMap tile server. This requires
  internet access in the browser (unlike the earlier fully-offline SVG-map
  prototype). See `WORK_LOG.md` for the offline-tile note if that constraint
  still applies to your deployment.

See `WORK_LOG.md` for what's been built, what changed from the original
single-file prototype, and what's still open.
