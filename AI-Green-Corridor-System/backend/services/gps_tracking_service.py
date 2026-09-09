import math
import time

ON_ROUTE_THRESHOLD_M = 50


def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def _cumulative_distances(route):
    """ route: list of [lat, lon] """
    cum = [0.0]
    total = 0.0
    for i in range(len(route) - 1):
        d = haversine(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1])
        total += d
        cum.append(total)
    return cum, total


def process_location_update(lat, lon, corridor):
    """
    corridor: dict from get_corridor() with keys route, signals, signal_states
    Returns dict with gps tracking info or raises ValueError
    """
    route = corridor.get("route", [])
    signals = corridor.get("signals", [])

    if not route or len(route) == 0:
        raise ValueError("No active corridor")

    # Find nearest point on route (nearest coordinate, plus segment projection for progress)
    cum_dist, total_m = _cumulative_distances(route)

    # Find nearest coordinate index
    min_dist = float("inf")
    nearest_idx = 0
    for i, (rlat, rlon) in enumerate(route):
        d = haversine(lat, lon, rlat, rlon)
        if d < min_dist:
            min_dist = d
            nearest_idx = i

    # Also check segment projection for more accurate progress between nearest_idx and neighbors
    # Simple approach: if not at ends, check projection to segment nearest_idx-1 -> nearest_idx and nearest_idx -> nearest_idx+1
    # Compute distance along route to nearest point
    # Use nearest coordinate as proxy for projection
    on_route = min_dist <= ON_ROUTE_THRESHOLD_M

    # Determine route progress: use nearest_idx
    # If route has single point, progress 0
    if len(route) > 1:
        # Use cumulative distance at nearest_idx as travelled
        travelled_m = cum_dist[nearest_idx]
        # If GPS is between points, we could refine, but nearest_idx is sufficient for demo
        # Adjust for on_route: if off-route, progress still based on nearest
        progress = (travelled_m / total_m * 100) if total_m > 0 else 0
        progress = max(0.0, min(100.0, progress))
    else:
        travelled_m = 0.0
        progress = 0.0
        total_m = 0.0

    travelled_km = round(travelled_m / 1000, 2)
    total_km = round(total_m / 1000, 2)
    remaining_km = round(max(0.0, total_km - travelled_km), 2)
    remaining_m = max(0.0, total_m - travelled_m)

    # Upcoming signal: smallest route_index >= nearest_idx
    next_signal = None
    distance_to_next_m = None
    if signals:
        # signals are ordered by route_index
        candidates = [s for s in signals if s.get("route_index", 0) >= nearest_idx]
        if not candidates and signals:
            # If past last signal, no upcoming
            candidates = []
        if candidates:
            # Pick closest ahead
            # Choose signal with smallest route_index >= nearest_idx
            next_sig = min(candidates, key=lambda s: s.get("route_index", 0))
            s_lat = next_sig.get("lat")
            s_lon = next_sig.get("lon")
            if s_lat is not None and s_lon is not None:
                d_to_sig = haversine(lat, lon, s_lat, s_lon)
                distance_to_next_m = round(d_to_sig, 1)
                next_signal = {
                    "id": next_sig.get("id"),
                    "lat": s_lat,
                    "lon": s_lon,
                    "distance_m": distance_to_next_m,
                    "route_index": next_sig.get("route_index")
                }
                # Include full signal object structure cleanly
                # Keep original signal fields but ensure distance_m present
                # Use actual signal object where appropriate
                # Preserve original signal structure if needed
        # Also consider nearest signal overall for debugging
        # But spec asks for next_signal

    result = {
        "gps": {"lat": lat, "lon": lon},
        "route_progress": round(progress, 1),
        "distance_travelled_km": travelled_km,
        "distance_remaining_km": remaining_km,
        "distance_remaining_m": round(remaining_m, 1),
        "nearest_route_index": nearest_idx,
        "nearest_distance_m": round(min_dist, 1),
        "on_route": on_route,
    }
    if next_signal:
        result["next_signal"] = next_signal
    else:
        result["next_signal"] = None

    return result
