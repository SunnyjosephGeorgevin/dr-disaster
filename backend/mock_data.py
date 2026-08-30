import time

BASE = {"x": 110, "y": 560, "label": "BASE"}

HAZARDS = [
    {
        "id": "HZ-1",
        "type": "Fire",
        "severity": "High",
        "x": 420,
        "y": 380,
        "radius": 100,
        "detected_at": time.time() - 142,
    },
    {
        "id": "HZ-2",
        "type": "Flood",
        "severity": "Medium",
        "x": 650,
        "y": 480,
        "radius": 70,
        "detected_at": time.time() - 218,
    },
    {
        "id": "HZ-3",
        "type": "Structural damage",
        "severity": "High",
        "x": 500,
        "y": 220,
        "radius": 90,
        "detected_at": time.time() - 311,
    },
    {
        "id": "HZ-4",
        "type": "Debris",
        "severity": "Low",
        "x": 760,
        "y": 300,
        "radius": 45,
        "detected_at": time.time() - 389,
    },
]

PRIORITY_ORDER = {"critical": 0, "elevated": 1, "low": 2}

VICTIMS = [
    {
        "id": "V-014",
        "priority": "critical",
        "risk": 92,
        "condition": "Moving",
        "x": 300,
        "y": 250,
        "uncertainty_m": 12,
    },
    {
        "id": "V-027",
        "priority": "critical",
        "risk": 88,
        "condition": "Still",
        "x": 860,
        "y": 150,
        "uncertainty_m": 8,
    },
    {
        "id": "V-032",
        "priority": "elevated",
        "risk": 61,
        "condition": "Moving",
        "x": 700,
        "y": 520,
        "uncertainty_m": 18,
    },
    {
        "id": "V-041",
        "priority": "elevated",
        "risk": 55,
        "condition": "Unknown",
        "x": 930,
        "y": 400,
        "uncertainty_m": 35,
    },
    {
        "id": "V-058",
        "priority": "low",
        "risk": 28,
        "condition": "Still",
        "x": 250,
        "y": 480,
        "uncertainty_m": 10,
    },
    {
        "id": "V-063",
        "priority": "low",
        "risk": 22,
        "condition": "Moving",
        "x": 550,
        "y": 600,
        "uncertainty_m": 15,
    },
]

VICTIMS.sort(key=lambda v: (PRIORITY_ORDER[v["priority"]], -v["risk"]))


def initial_drone_state():
    return {
        "x": 400.0,
        "y": 450.0,
        "heading": 40.0,

        # Autonomous drone status
        "mode": "AUTONOMOUS",

        # Communication state
        # wifi | cell | lora | none
        "link": "wifi",

        # Localization system
        # gps | vio | gps_vio
        "localization": "gps_vio",

        # Camera / perception system
        # rgb | thermal | rgb_thermal
        "camera": "rgb_thermal",

        # Position freshness
        "stale": False,
        "last_updated": time.time(),
    }


def initial_mission_state():
    return {
        "status": "ACTIVE",

        "degraded_reasons": [],

        # Demo perception state
        "hazard_detection": "ACTIVE",
    }
