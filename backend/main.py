import asyncio
import time
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import mock_data
import routing
from geo import xy_to_latlon


app = FastAPI(
    title="Sector 7 Field Response — Demo API"
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Demo state
# ---------------------------------------------------------------------------

drone = mock_data.initial_drone_state()
mission = mock_data.initial_mission_state()

connected_sockets: List[WebSocket] = []


# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------

def serialize_base():
    lat, lon = xy_to_latlon(
        mock_data.BASE["x"],
        mock_data.BASE["y"],
    )

    return {
        "label": mock_data.BASE["label"],
        "lat": lat,
        "lon": lon,
    }


def serialize_hazards():
    out = []

    for h in mock_data.HAZARDS:
        lat, lon = xy_to_latlon(
            h["x"],
            h["y"],
        )

        out.append({
            **h,
            "lat": lat,
            "lon": lon,
        })

    return out


def serialize_victims():
    out = []

    for v in mock_data.VICTIMS:
        lat, lon = xy_to_latlon(
            v["x"],
            v["y"],
        )

        out.append({
            **v,
            "lat": lat,
            "lon": lon,
        })

    return out


def serialize_drone():
    lat, lon = xy_to_latlon(
        drone["x"],
        drone["y"],
    )

    return {
        "id": "DRONE-01",

        # Position
        "lat": lat,
        "lon": lon,

        # Orientation
        "heading": drone["heading"],

        # Autonomous operation
        "mode": drone["mode"],

        # Communication
        "link": drone["link"],

        # Localization
        "localization": drone["localization"],

        # Camera / perception
        "camera": drone["camera"],

        # Position freshness
        "stale": drone["stale"],
        "last_updated": drone["last_updated"],
    }


# ---------------------------------------------------------------------------
# Connectivity
# ---------------------------------------------------------------------------

def connectivity_message(link: str) -> str:
    return {
        "wifi": "Connected — Wi-Fi",
        "cell": "Connected — 4G/5G",
        "lora": "Connected — LoRa (limited data)",
        "none": "No connection — last known position shown",
    }[link]


def degraded_banner_messages() -> List[str]:
    msgs = list(
        mission["degraded_reasons"]
    )

    if drone["link"] == "lora":
        msgs.append(
            "Operating on LoRa — reduced update frequency."
        )

    if drone["link"] == "none":
        msgs.append(
            "Connectivity lost — showing last known drone position."
        )

    return msgs


# ---------------------------------------------------------------------------
# Complete dashboard state
# ---------------------------------------------------------------------------

def build_state():
    return {
        "type": "state_update",

        "server_time": time.time(),

        "mission_status": mission["status"],

        "degraded_reasons":
            degraded_banner_messages(),

        "connectivity": {
            "link": drone["link"],
            "message": connectivity_message(
                drone["link"]
            ),
            "stale": drone["stale"],
        },

        "base": serialize_base(),

        "hazards": serialize_hazards(),

        "victims": serialize_victims(),

        "drone": serialize_drone(),
    }


# ---------------------------------------------------------------------------
# WebSocket stream
# ---------------------------------------------------------------------------

async def broadcast(payload: dict):
    dead = []

    for ws in connected_sockets:
        try:
            await ws.send_json(payload)

        except Exception:
            dead.append(ws)

    for ws in dead:
        if ws in connected_sockets:
            connected_sockets.remove(ws)


@app.websocket("/ws/stream")
async def ws_stream(
    websocket: WebSocket,
):
    await websocket.accept()

    connected_sockets.append(
        websocket
    )

    try:
        # Initial state
        await websocket.send_json(
            build_state()
        )

        while True:

            # One-second heartbeat keeps the
            # dashboard timestamp/age information
            # current.
            await asyncio.sleep(1.0)

            await websocket.send_json(
                build_state()
            )

    except WebSocketDisconnect:
        pass

    finally:
        if websocket in connected_sockets:
            connected_sockets.remove(
                websocket
            )


# ---------------------------------------------------------------------------
# Route computation
# ---------------------------------------------------------------------------

class RouteRequest(BaseModel):
    victim_id: str


@app.post("/api/route")
async def get_route(
    req: RouteRequest,
):

    victim = next(
        (
            v
            for v in mock_data.VICTIMS
            if v["id"] == req.victim_id
        ),
        None,
    )

    if victim is None:
        return {
            "error":
                f"Unknown victim_id '{req.victim_id}'"
        }

    result = routing.compute_route(
        mock_data.BASE,
        victim,
        mock_data.HAZARDS,
    )

    if result is None:
        return {
            "error":
                "No safe route found — victim unreachable "
                "given current hazard zones."
        }

    waypoints_latlon = [
        xy_to_latlon(x, y)
        for x, y in result["waypoints"]
    ]

    return {
        "victim_id": req.victim_id,

        "waypoints": [
            {
                "lat": lat,
                "lon": lon,
            }
            for lat, lon in waypoints_latlon
        ],

        "distance_m":
            result["distance_m"],

        "avoided_hazard_ids":
            result["avoided_hazard_ids"],

        "avoided_count":
            len(
                result["avoided_hazard_ids"]
            ),
    }


# ---------------------------------------------------------------------------
# Mission degraded-mode demo
# ---------------------------------------------------------------------------

class DegradedRequest(BaseModel):
    reasons: List[str]


@app.post("/api/mission/degraded")
async def set_degraded(
    req: DegradedRequest,
):

    mission["degraded_reasons"] = (
        req.reasons
    )

    mission["status"] = (
        "DEGRADED"
        if req.reasons
        else "ACTIVE"
    )

    state = build_state()

    await broadcast(state)

    return state


# ---------------------------------------------------------------------------
# State snapshot
# ---------------------------------------------------------------------------

@app.get("/api/state")
async def get_state():
    return build_state()


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "service": "sector-7-dashboard-api",
        "mode": "AUTONOMOUS DRONE DEMO",
        "ws": "/ws/stream",
        "docs": "/docs",
    }
