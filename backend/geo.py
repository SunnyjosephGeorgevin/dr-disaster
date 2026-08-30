"""
Converts the local flat-earth (x, y) meter grid used by mock_data.py and
routing.py into lat/lon pairs Leaflet can plot.

x = meters east of ORIGIN, y = meters south of ORIGIN. The area covered is
small (~1km x 0.65km) so a simple equirectangular approximation is well
within survey-grade error for a demo.
"""
import math

ORIGIN_LAT = 13.0827   # Chennai, IN — arbitrary demo origin, no live data
ORIGIN_LON = 80.2707

METERS_PER_DEG_LAT = 111_320.0
METERS_PER_DEG_LON = 111_320.0 * math.cos(math.radians(ORIGIN_LAT))


def xy_to_latlon(x: float, y: float) -> tuple:
    lat = ORIGIN_LAT - (y / METERS_PER_DEG_LAT)
    lon = ORIGIN_LON + (x / METERS_PER_DEG_LON)
    return round(lat, 7), round(lon, 7)


def latlon_to_xy(lat: float, lon: float) -> tuple:
    y = (ORIGIN_LAT - lat) * METERS_PER_DEG_LAT
    x = (lon - ORIGIN_LON) * METERS_PER_DEG_LON
    return x, y
