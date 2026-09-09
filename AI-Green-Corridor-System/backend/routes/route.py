import time
import uuid
from datetime import datetime, timezone
import concurrent.futures
import networkx as nx
from flask import Blueprint, request, jsonify

from services.osm_service import load_bengaluru_graph

from services.corridor_state import (
    set_corridor,
    get_corridor,
    set_gps,
    set_active_trip,
    get_active_trip,
    update_active_trip,
    reset_corridor,
)

from services.report_service import (
    save_report,
    get_all_reports,
    get_report_by_id,
)

from services.route_service import (
    get_nearest_nodes,
    calculate_shortest_path,
    get_route_coordinates,
    calculate_distance,
    calculate_eta
)

from services.traffic_signal_service import (
    get_route_signals,
    order_signals_along_route
)

from services.green_corridor_service import (
    initialize_corridor,
    activate_signal
)

from services.traffic_service import get_traffic_multiplier
from services.gps_tracking_service import process_location_update

route_bp = Blueprint("route", __name__)

graph = load_bengaluru_graph()


@route_bp.route("/route", methods=["POST"])
def find_route():
    route_start = time.perf_counter()

    data = request.get_json(silent=True) or {}
    if not data or "source" not in data or "destination" not in data:
        return jsonify({"status": "error", "message": "source and destination required"}), 400

    source = data["source"]
    destination = data["destination"]

    # Find nearest graph nodes
    t_nearest = time.perf_counter()
    source_node, destination_node = get_nearest_nodes(
        graph,
        source,
        destination
    )
    print(f"[TIMING] Nearest nodes: {time.perf_counter()-t_nearest:.3f} sec")

    # Calculate shortest path (fast initial route - unchanged)
    t_init_a = time.perf_counter()
    path = calculate_shortest_path(
        graph,
        source_node,
        destination_node
    )
    print(f"[TIMING] Initial A*: {time.perf_counter()-t_init_a:.3f} sec")

    # Traffic-aware reroute: sparse sampling (~12 edges) + local 250m weighting + single A*
    final_path = path
    traffic_adjusted = False
    traffic_adjusted_seconds = None
    try:
        t_bbox = time.perf_counter()
        source_lat = graph.nodes[source_node]["y"]
        source_lon = graph.nodes[source_node]["x"]
        dest_lat = graph.nodes[destination_node]["y"]
        dest_lon = graph.nodes[destination_node]["x"]
        lat_span = abs(dest_lat - source_lat)
        lon_span = abs(dest_lon - source_lon)
        lat_padding = max(0.02, lat_span * 0.2)
        lon_padding = max(0.02, lon_span * 0.2)
        min_lat = min(source_lat, dest_lat) - lat_padding
        max_lat = max(source_lat, dest_lat) + lat_padding
        min_lon = min(source_lon, dest_lon) - lon_padding
        max_lon = max(source_lon, dest_lon) + lon_padding
        bbox = (min_lon, min_lat, max_lon, max_lat)
        # Optimized: direct y/x filtering + subgraph view (avoids 29s OSMnx bbox copy)
        # Preserves same bbox nodes/edges/attributes, directed/multigraph, source/dest check
        nodes_in_bbox = [
            n for n, d in graph.nodes(data=True)
            if min_lat <= d["y"] <= max_lat and min_lon <= d["x"] <= max_lon
        ]
        subgraph = graph.subgraph(nodes_in_bbox)  # view, no copy - traffic_subgraph will copy
        print(f"Bounding-box subgraph: {subgraph.number_of_nodes()} nodes vs full graph: {graph.number_of_nodes()} nodes (bbox=({min_lat:.4f},{min_lon:.4f},{max_lat:.4f},{max_lon:.4f}))")
        print(f"[TIMING] Bbox subgraph: {time.perf_counter()-t_bbox:.3f} sec")
        if source_node not in subgraph or destination_node not in subgraph:
            raise ValueError("Source or destination not in bbox subgraph")

        # Select ~12 representative EDGES from original path
        edges = [(path[i], path[i + 1]) for i in range(len(path) - 1)]
        k = min(12, len(edges))
        if k == 0:
            raise ValueError("Path has no edges")
        step = len(edges) / k
        sampled_edges = [edges[int(i * step)] for i in range(k)]
        sampled_mids = []
        for u, v in sampled_edges:
            mid_lat = (graph.nodes[u]["y"] + graph.nodes[v]["y"]) / 2
            mid_lon = (graph.nodes[u]["x"] + graph.nodes[v]["x"]) / 2
            sampled_mids.append((u, v, mid_lat, mid_lon))

        # Concurrent TomTom fetch: one call per sampled edge (~12 calls)
        t_traffic_api = time.perf_counter()
        sampled_points = []  # list of (mid_lat, mid_lon, multiplier)
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            fut_to_edge = {
                executor.submit(get_traffic_multiplier, mid_lat, mid_lon): (u, v, mid_lat, mid_lon)
                for u, v, mid_lat, mid_lon in sampled_mids
            }
            for fut in concurrent.futures.as_completed(fut_to_edge):
                u, v, mid_lat, mid_lon = fut_to_edge[fut]
                try:
                    m = fut.result()
                except Exception:
                    m = 1.0
                sampled_points.append((mid_lat, mid_lon, m))
        print(f"[TIMING] Traffic API sampling: {time.perf_counter()-t_traffic_api:.3f} sec")
        for s_lat, s_lon, m in sampled_points:
            print(f"[TRAFFIC] lat={s_lat:.4f} lon={s_lon:.4f} multiplier={m:.2f}")
        num_affected = sum(1 for _, _, m in sampled_points if m > 1.0)
        if sampled_points:
            min_m = min(m for _, _, m in sampled_points)
            max_m = max(m for _, _, m in sampled_points)
            avg_m = sum(m for _, _, m in sampled_points) / len(sampled_points)
            print(f"[TRAFFIC] Samples: {len(sampled_points)}")
            print(f"[TRAFFIC] Affected samples (>1.0): {num_affected}")
            print(f"[TRAFFIC] Min multiplier: {min_m:.2f}")
            print(f"[TRAFFIC] Max multiplier: {max_m:.2f}")
            print(f"[TRAFFIC] Average multiplier: {avg_m:.2f}")
            if num_affected == 0:
                print("[TRAFFIC] No traffic slowdown detected in sampled points.")

        # Local 250m weighting: apply per-sample multiplier only to nearby edges
        t_weighting = time.perf_counter()
        from math import radians, sin, cos, sqrt, atan2

        def haversine(lat1, lon1, lat2, lon2):
            R = 6371000
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
            return 2 * R * atan2(sqrt(a), sqrt(1 - a))

        RADIUS = 250
        traffic_subgraph = subgraph.copy()
        edges_inspected = 0
        edges_modified = 0
        max_applied = 1.0
        for u, v in list(traffic_subgraph.edges()):
            edges_inspected += 1
            e_mid_lat = (traffic_subgraph.nodes[u]["y"] + traffic_subgraph.nodes[v]["y"]) / 2
            e_mid_lon = (traffic_subgraph.nodes[u]["x"] + traffic_subgraph.nodes[v]["x"]) / 2
            best_m = 1.0
            best_d = float("inf")
            for s_lat, s_lon, m in sampled_points:
                if m == 1.0:
                    continue
                d = haversine(e_mid_lat, e_mid_lon, s_lat, s_lon)
                if d <= RADIUS and d < best_d:
                    best_d = d
                    best_m = m
            if best_m != 1.0:
                edges_modified += 1
                if best_m > max_applied:
                    max_applied = best_m
                for key in list(traffic_subgraph[u][v].keys()):
                    traffic_subgraph[u][v][key]["travel_time"] *= best_m
        print(f"[TIMING] Traffic edge weighting: {time.perf_counter()-t_weighting:.3f} sec")
        print(f"[TRAFFIC] Edges inspected: {edges_inspected}")
        print(f"[TRAFFIC] Edges modified: {edges_modified}")
        print(f"[TRAFFIC] Max applied multiplier: {max_applied:.2f}")

        # Single traffic-aware A* (no enumeration)
        t_traffic_a = time.perf_counter()
        traffic_path = nx.astar_path(traffic_subgraph, source_node, destination_node, weight="travel_time")
        final_path = traffic_path
        traffic_adjusted = (final_path != path)
        print(f"[TRAFFIC] Original path edges: {len(path)-1}")
        print(f"[TRAFFIC] Traffic-aware path edges: {len(final_path)-1}")
        print(f"[TRAFFIC] Path changed: {traffic_adjusted}")
        if traffic_adjusted:
            print("[TRAFFIC] Traffic-aware rerouting occurred.")
        else:
            print("[TRAFFIC] Traffic did not change the selected route.")
        traffic_adjusted_seconds = 0
        for i in range(len(final_path) - 1):
            ed = traffic_subgraph.get_edge_data(final_path[i], final_path[i + 1])
            if ed is None:
                ed = graph.get_edge_data(final_path[i], final_path[i + 1])
            if ed:
                traffic_adjusted_seconds += ed[0]["travel_time"]
        print(f"[TIMING] Traffic-aware A*: {time.perf_counter()-t_traffic_a:.3f} sec")
    except Exception as e:
        final_path = path
        traffic_adjusted = False
        traffic_adjusted_seconds = None
        try:
            print(f"[TIMING] Traffic-aware A*: {time.perf_counter()-t_traffic_a:.3f} sec (fallback: {e})")
        except:
            print(f"[TIMING] Traffic-aware A*: fallback (no timing) - {e}")

    if traffic_adjusted_seconds is None:
        # Fallback ETA from original graph
        traffic_adjusted_seconds = 0
        for i in range(len(final_path) - 1):
            ed = graph.get_edge_data(final_path[i], final_path[i + 1])
            if ed:
                traffic_adjusted_seconds += ed[0]["travel_time"]

    t_signals = time.perf_counter()
    # Convert path to latitude/longitude coordinates
    coordinates = get_route_coordinates(
        graph,
        final_path
    )

    # Find nearby traffic signals
    traffic_signals = get_route_signals(
        coordinates
    )

    # Order signals according to ambulance route
    traffic_signals = order_signals_along_route(
        traffic_signals,
        coordinates
    )

    # Initialize all signals as RED
    signal_states = initialize_corridor(
        traffic_signals
    )

    # Store current corridor session
    set_corridor(
        coordinates,
        traffic_signals,
        signal_states
    )
    print(f"[TIMING] Signal detection + ordering: {time.perf_counter()-t_signals:.3f} sec")

    # Calculate route distance
    distance = calculate_distance(
        graph,
        final_path
    )

    # Calculate estimated travel time from traffic-aware seconds
    eta = round(traffic_adjusted_seconds / 60)
    print(f"[TIMING] TOTAL /route: {time.perf_counter()-route_start:.3f} sec")

    # Format location strings
    start_loc_str = source if isinstance(source, str) else (f"{source[0]:.4f}, {source[1]:.4f}" if isinstance(source, (list, tuple)) else str(source))
    dest_loc_str = destination if isinstance(destination, str) else (f"{destination[0]:.4f}, {destination[1]:.4f}" if isinstance(destination, (list, tuple)) else str(destination))
    trip_id = f"TRIP-{int(time.time())}-{uuid.uuid4().hex[:6].upper()}"
    ambulance_id = data.get("ambulance_id") or "AMB-BLR-108"

    # Initialize and track Active Trip
    active_trip = {
        "trip_id": trip_id,
        "ambulance_id": ambulance_id,
        "start_location": start_loc_str,
        "destination": dest_loc_str,
        "distance": distance,
        "planned_eta": eta,
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": None,
        "actual_duration": None,
        "traffic_adjusted_status": "Adjusted" if traffic_adjusted else "Optimal",
        "signals_monitored": len(traffic_signals),
        "signals_cleared": 0,
        "cleared_signal_ids": [],
        "delays": None,
        "route_deviation": False,
        "gps_progress": 0.0,
        "trip_status": "ACTIVE"
    }
    set_active_trip(active_trip)

    return jsonify({
        "status": "success",
        "trip_id": trip_id,
        "ambulance_id": ambulance_id,
        "distance_km": distance,
        "eta_minutes": eta,
        "route": coordinates,
        "traffic_signals": traffic_signals,
        "signal_states": list(signal_states.values()),
        "traffic_adjusted": traffic_adjusted
    })


@route_bp.route("/location/update", methods=["POST"])
def update_location():
    data = request.get_json(silent=True) or {}
    lat = data.get("lat")
    lon = data.get("lon")

    if lat is None or lon is None:
        return jsonify({"status": "error", "message": "lat and lon are required."}), 400

    try:
        lat = float(lat)
        lon = float(lon)
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "lat and lon must be numeric."}), 400

    if not (-90 <= lat <= 90):
        return jsonify({"status": "error", "message": "lat must be between -90 and 90."}), 400
    if not (-180 <= lon <= 180):
        return jsonify({"status": "error", "message": "lon must be between -180 and 180."}), 400

    corridor = get_corridor()
    if not corridor.get("route"):
        return jsonify({"status": "error", "message": "No active corridor. Create a route first."}), 400

    try:
        result = process_location_update(lat, lon, corridor)
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to process location: {e}"}), 500

    location = set_gps(lat, lon, {
        "accuracy": data.get("accuracy"),
        "timestamp": data.get("timestamp") or datetime.now(timezone.utc).isoformat(),
        "vehicle_id": data.get("vehicle_id") or "AMB-BLR-108",
        "address": data.get("address"),
        "mode": data.get("mode") or "live",
    })

    # Build response using actual signal structure where possible
    resp = {
        "status": "success",
        "gps": result["gps"],
        "route_progress": result["route_progress"],
        "distance_travelled_km": result["distance_travelled_km"],
        "distance_remaining_km": result["distance_remaining_km"],
        "on_route": result["on_route"],
        "nearest_distance_m": result["nearest_distance_m"],
        "location": location,
    }
    # Include next_signal if available
    if result.get("next_signal") is not None:
        resp["next_signal"] = result["next_signal"]
    else:
        resp["next_signal"] = None

    # Update active trip tracking if available
    active_trip = get_active_trip()
    if active_trip:
        active_trip["gps_progress"] = result.get("route_progress", active_trip.get("gps_progress", 0.0))
        if not result.get("on_route", True):
            active_trip["route_deviation"] = True

    return jsonify(resp)


@route_bp.route("/corridor/start", methods=["POST"])
def start_corridor():

    corridor = get_corridor()

    if not corridor["signals"]:
        return jsonify({
            "status": "error",
            "message": "No active route. Call /route first."
        }), 400

    signals = corridor["signals"]
    signal_states = corridor["signal_states"]

    # Activate the first signal
    first_signal_id = signals[0]["id"]

    signal_states = activate_signal(
        signal_states,
        first_signal_id
    )

    # Update stored signal states
    corridor["signal_states"] = signal_states

    return jsonify({
        "status": "success",
        "message": "Green Corridor started",
        "active_signal": first_signal_id,
        "signal_states": list(signal_states.values())
    })


@route_bp.route("/corridor/auto", methods=["POST"])
def auto_corridor():

    corridor = get_corridor()

    if not corridor["signals"]:
        return jsonify({
            "status": "error",
            "message": "No active route. Call /route first."
        }), 400

    signals = corridor["signals"]
    signal_states = corridor["signal_states"]

    activated_signals = []

    for signal in signals:

        signal_id = signal["id"]

        # Activate current signal
        signal_states = activate_signal(
            signal_states,
            signal_id
        )

        # Store updated state
        corridor["signal_states"] = signal_states

        activated_signals.append({
            "signal_id": signal_id,
            "state": "GREEN"
        })

        # Wait before moving to the next signal
        time.sleep(2)

    return jsonify({
        "status": "success",
        "message": "Green Corridor completed",
        "activated_signals": activated_signals,
        "signal_states": list(signal_states.values())
    })


@route_bp.route("/activate-signal/<int:signal_id>", methods=["POST"])
def activate_corridor_signal(signal_id):

    corridor = get_corridor()

    if not corridor["signals"]:
        return jsonify({
            "status": "error",
            "message": "No active route. Call /route first."
        }), 400

    signal_states = corridor["signal_states"]

    if signal_id not in signal_states:
        return jsonify({
            "status": "error",
            "message": "Signal not found"
        }), 404

    # Make selected signal GREEN
    signal_states = activate_signal(
        signal_states,
        signal_id
    )

    # Update stored state
    corridor["signal_states"] = signal_states

    active_trip = get_active_trip()
    if active_trip:
        cleared_ids = active_trip.setdefault("cleared_signal_ids", [])
        if signal_id not in cleared_ids:
            cleared_ids.append(signal_id)
        active_trip["signals_cleared"] = len(cleared_ids)

    return jsonify({
        "status": "success",
        "activated_signal": signal_id,
        "signal_states": list(signal_states.values())
    })


@route_bp.route("/route/end", methods=["POST"])
def end_trip():
    active_trip = get_active_trip()
    if not active_trip or active_trip.get("trip_status") != "ACTIVE":
        return jsonify({
            "status": "error",
            "message": "No active trip to end."
        }), 400

    end_time_dt = datetime.now(timezone.utc)
    end_time_iso = end_time_dt.isoformat()

    # Calculate actual duration
    duration_str = None
    try:
        start_time_dt = datetime.fromisoformat(active_trip["start_time"])
        total_seconds = max(0, int((end_time_dt - start_time_dt).total_seconds()))
        mins, secs = divmod(total_seconds, 60)
        duration_str = f"{mins}m {secs}s"
    except Exception:
        pass

    # Finalize signal stats from corridor if active
    corridor = get_corridor()
    signal_states = corridor.get("signal_states", {})
    cleared_from_states = sum(
        1 for s in signal_states.values()
        if isinstance(s, dict) and s.get("state") in ("GREEN", "CLEARED")
    )
    cleared_count = max(active_trip.get("signals_cleared", 0), cleared_from_states)

    finalized_report = {
        "trip_id": active_trip.get("trip_id"),
        "ambulance_id": active_trip.get("ambulance_id"),
        "start_location": active_trip.get("start_location"),
        "destination": active_trip.get("destination"),
        "distance": active_trip.get("distance"),
        "planned_eta": active_trip.get("planned_eta"),
        "actual_duration": duration_str,
        "traffic_adjusted_status": active_trip.get("traffic_adjusted_status"),
        "signals_monitored": active_trip.get("signals_monitored"),
        "signals_cleared": cleared_count,
        "delays": active_trip.get("delays"),
        "route_deviation": active_trip.get("route_deviation"),
        "start_time": active_trip.get("start_time"),
        "end_time": end_time_iso,
        "trip_status": "COMPLETED"
    }

    # Persist the completed report so it survives restarts
    save_report(finalized_report)

    # End the active green corridor state
    reset_corridor()

    return jsonify({
        "status": "success",
        "message": "Trip ended successfully",
        "report": finalized_report
    })


@route_bp.route("/reports", methods=["GET"])
def get_reports_list():
    reports = get_all_reports()
    return jsonify({
        "status": "success",
        "reports": reports
    })


@route_bp.route("/reports/<string:trip_id>", methods=["GET"])
def get_single_report(trip_id):
    report = get_report_by_id(trip_id)
    if not report:
        return jsonify({
            "status": "error",
            "message": f"Report for trip_id '{trip_id}' not found."
        }), 404
    return jsonify({
        "status": "success",
        "report": report
    })