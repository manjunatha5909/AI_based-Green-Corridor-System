import logging
import osmnx as ox
from math import radians, sin, cos, sqrt, atan2
from collections import defaultdict

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)

_signals_cache = None

CLUSTER_RADIUS_METERS = 35


def load_traffic_signals():
    """
    Load all traffic signals in Bengaluru.

    Signals are fetched from OpenStreetMap once and cached in memory.
    Subsequent calls reuse the cached dataset instead of querying Overpass.
    """

    global _signals_cache

    if _signals_cache is not None:
        logger.info("Reusing cached traffic signals (%d signals).", len(_signals_cache))
        return _signals_cache

    logger.info("Traffic signal cache is empty. Fetching from OpenStreetMap...")

    try:
        signals = ox.features_from_place(
            "Bengaluru, Karnataka, India",
            tags={"highway": "traffic_signals"}
        )
    except Exception as error:
        logger.error(
            "Failed to load traffic signals from OpenStreetMap: %s. "
            "Continuing without signals for this request.",
            error
        )
        return None

    _signals_cache = signals

    logger.info("Traffic signals loaded and cached (%d signals).", len(_signals_cache))

    return _signals_cache


def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates in meters.
    """

    R = 6371000

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1))
        * cos(radians(lat2))
        * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


def cluster_signals(signals, radius_meters=CLUSTER_RADIUS_METERS):
    """
    Cluster nearby traffic signals that likely belong to the same
    physical intersection using a simple distance-based clustering.

    Returns a list of clusters, where each cluster is a dict with:
    - 'centroid': (lat, lon) - average position of signals in cluster
    - 'signals': list of raw signal dicts in this cluster
    - 'count': number of raw signals in cluster
    """
    if not signals:
        return []

    # Build adjacency: which signals are within radius of each other
    n = len(signals)
    visited = [False] * n
    clusters = []

    for i in range(n):
        if visited[i]:
            continue

        # Start new cluster with signal i
        cluster_indices = [i]
        visited[i] = True
        queue = [i]

        # BFS to find all signals within radius
        while queue:
            current = queue.pop(0)
            current_signal = signals[current]

            for j in range(n):
                if visited[j]:
                    continue

                other_signal = signals[j]
                distance = haversine(
                    current_signal["lat"],
                    current_signal["lon"],
                    other_signal["lat"],
                    other_signal["lon"]
                )

                if distance <= radius_meters:
                    visited[j] = True
                    cluster_indices.append(j)
                    queue.append(j)

        # Compute cluster centroid
        cluster_signals = [signals[idx] for idx in cluster_indices]
        centroid_lat = sum(s["lat"] for s in cluster_signals) / len(cluster_signals)
        centroid_lon = sum(s["lon"] for s in cluster_signals) / len(cluster_signals)

        clusters.append({
            "centroid": (centroid_lat, centroid_lon),
            "signals": cluster_signals,
            "count": len(cluster_signals)
        })

    return clusters


def order_signals_along_route(signals, route):
    """
    Order traffic signals based on their position
    along the ambulance route.
    """

    ordered_signals = []

    for signal in signals:

        closest_index = 0
        smallest_distance = float("inf")

        for index, point in enumerate(route):

            distance = haversine(
                signal["lat"],
                signal["lon"],
                point[0],
                point[1]
            )

            if distance < smallest_distance:
                smallest_distance = distance
                closest_index = index

        signal_copy = signal.copy()

        signal_copy["route_index"] = closest_index

        ordered_signals.append(signal_copy)

    ordered_signals.sort(
        key=lambda signal: signal["route_index"]
    )

    for index, signal in enumerate(ordered_signals, start=1):
        signal["id"] = index

    return ordered_signals


def get_route_signals(route_coordinates):
    """
    Find traffic signals near the ambulance route.
    """

    signals = load_traffic_signals()

    if signals is None:
        logger.warning("No traffic signal data available. Skipping signal lookup for this route.")
        return []

    # Extract all raw signal coordinates
    raw_signals = []
    for _, signal in signals.iterrows():
        raw_signals.append({
            "lat": signal.geometry.y,
            "lon": signal.geometry.x
        })

    # Filter signals within 50m of route
    nearby_raw = []
    for signal in raw_signals:
        signal_lat = signal["lat"]
        signal_lon = signal["lon"]

        for point in route_coordinates:
            distance = haversine(
                point[0],
                point[1],
                signal_lat,
                signal_lon
            )

            if distance <= 50:
                nearby_raw.append(signal)
                break

    # Cluster nearby signals into unique intersections (35m radius)
    clusters = cluster_signals(nearby_raw, radius_meters=CLUSTER_RADIUS_METERS)

    # Convert clusters to signal format with centroid coordinates
    clustered_signals = []
    for cluster in clusters:
        centroid_lat, centroid_lon = cluster["centroid"]
        clustered_signals.append({
            "lat": centroid_lat,
            "lon": centroid_lon,
            "_cluster": cluster  # Preserve raw cluster data internally
        })

    logger.info("Route signals: %d raw -> %d clustered (radius=%dm)",
                len(nearby_raw), len(clustered_signals), CLUSTER_RADIUS_METERS)

    # Order along route
    ordered = order_signals_along_route(clustered_signals, route_coordinates)

    return ordered