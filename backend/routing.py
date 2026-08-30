"""
Hazard-avoidance pathfinding.

Works in a local flat-earth coordinate system (meters, x = east, y = south
of a fixed origin) so the grid/A* logic stays simple. Conversion to/from
lat/lon for the Leaflet frontend happens in geo.py.

This is a direct port of the grid A* used in the original single-file HTML
prototype, factored out so the FastAPI route endpoint can call it.
"""
import heapq
import math
from typing import List, Optional, Tuple

CELL = 20          # meters per grid cell
COLS = 50
ROWS = 32
BUFFER = 15         # extra safety margin added to every hazard radius, meters


def is_blocked(x: float, y: float, hazards: list) -> bool:
    for h in hazards:
        dx, dy = x - h["x"], y - h["y"]
        if math.hypot(dx, dy) < h["radius"] + BUFFER:
            return True
    return False


def cell_center(c: int, r: int) -> Tuple[float, float]:
    return c * CELL + CELL / 2, r * CELL + CELL / 2


def to_cell(x: float, y: float) -> Tuple[int, int]:
    c = min(COLS - 1, max(0, int(x // CELL)))
    r = min(ROWS - 1, max(0, int(y // CELL)))
    return c, r


DIRS = [
    (1, 0, 1.0), (-1, 0, 1.0), (0, 1, 1.0), (0, -1, 1.0),
    (1, 1, math.sqrt(2)), (1, -1, math.sqrt(2)),
    (-1, 1, math.sqrt(2)), (-1, -1, math.sqrt(2)),
]


def heuristic(a: Tuple[int, int], b: Tuple[int, int]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def a_star(start: Tuple[int, int], goal: Tuple[int, int], hazards: list) -> Optional[List[Tuple[int, int]]]:
    open_heap = [(heuristic(start, goal), 0.0, start, None)]
    best_g = {start: 0.0}
    parent = {}
    closed = set()

    while open_heap:
        _, g, current, came_from = heapq.heappop(open_heap)
        if current in closed:
            continue
        closed.add(current)
        parent[current] = came_from

        if current == goal:
            path = []
            node = current
            while node is not None:
                path.append(node)
                node = parent[node]
            path.reverse()
            return path

        for dc, dr, cost in DIRS:
            nc, nr = current[0] + dc, current[1] + dr
            if not (0 <= nc < COLS and 0 <= nr < ROWS):
                continue
            neighbor = (nc, nr)
            if neighbor in closed:
                continue
            if neighbor != goal:
                wx, wy = cell_center(nc, nr)
                if is_blocked(wx, wy, hazards):
                    continue
            ng = g + cost
            if neighbor not in best_g or ng < best_g[neighbor]:
                best_g[neighbor] = ng
                heapq.heappush(open_heap, (ng + heuristic(neighbor, goal), ng, neighbor, current))

    return None


def simplify_path(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    if len(points) < 3:
        return points
    out = [points[0]]
    for i in range(1, len(points) - 1):
        ax, ay = out[-1]
        bx, by = points[i]
        cx, cy = points[i + 1]
        cross = (bx - ax) * (cy - by) - (by - ay) * (cx - bx)
        if abs(cross) > 1e-3:
            out.append((bx, by))
    out.append(points[-1])
    return out


def point_seg_dist(px, py, ax, ay, bx, by) -> float:
    dx, dy = bx - ax, by - ay
    len2 = dx * dx + dy * dy
    t = 0.0 if len2 == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / len2))
    cx, cy = ax + t * dx, ay + t * dy
    return math.hypot(px - cx, py - cy)


def compute_route(base: dict, victim: dict, hazards: list) -> Optional[dict]:
    """Returns {waypoints: [(x,y), ...], distance_m, avoided_hazard_ids} or None if unreachable."""
    start_cell = to_cell(base["x"], base["y"])
    goal_cell = to_cell(victim["x"], victim["y"])

    cell_path = a_star(start_cell, goal_cell, hazards)
    if cell_path is None:
        return None

    world_points = [(base["x"], base["y"])]
    for c, r in cell_path[1:-1]:
        world_points.append(cell_center(c, r))
    world_points.append((victim["x"], victim["y"]))

    simplified = simplify_path(world_points)

    distance = sum(
        math.hypot(simplified[i][0] - simplified[i - 1][0], simplified[i][1] - simplified[i - 1][1])
        for i in range(1, len(simplified))
    )

    avoided_ids = []
    for h in hazards:
        d_straight = point_seg_dist(h["x"], h["y"], base["x"], base["y"], victim["x"], victim["y"])
        if d_straight < h["radius"] + BUFFER:
            avoided_ids.append(h["id"])

    return {
        "waypoints": simplified,
        "distance_m": round(distance, 1),
        "avoided_hazard_ids": avoided_ids,
    }
