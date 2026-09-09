import osmnx as ox
import networkx as nx


def parse_coords(pt):
    if isinstance(pt, dict):
        lat = pt.get("lat", pt.get("latitude"))
        lon = pt.get("lon", pt.get("lng", pt.get("longitude")))
        return float(lat), float(lon)
    elif isinstance(pt, (list, tuple)) and len(pt) >= 2:
        return float(pt[0]), float(pt[1])
    raise ValueError(f"Invalid coordinate format: {pt}")


def get_nearest_nodes(graph, source, destination):
    src_lat, src_lon = parse_coords(source)
    dst_lat, dst_lon = parse_coords(destination)

    source_node = ox.distance.nearest_nodes(
        graph,
        X=src_lon,
        Y=src_lat
    )

    destination_node = ox.distance.nearest_nodes(
        graph,
        X=dst_lon,
        Y=dst_lat
    )

    return source_node, destination_node


def calculate_shortest_path(graph, source_node, destination_node):

    path = nx.astar_path(
        graph,
        source_node,
        destination_node,
        weight="travel_time"
    )

    return path


def get_route_coordinates(graph, path):

    coordinates = []

    for node in path:
        lat = graph.nodes[node]["y"]
        lon = graph.nodes[node]["x"]

        coordinates.append([lat, lon])

    return coordinates


def calculate_distance(graph, path):
    """
    Calculate total route distance in kilometers.
    """

    total_distance = 0

    for i in range(len(path) - 1):

        edge = graph.get_edge_data(path[i], path[i + 1])

        edge_length = edge[0]["length"]

        total_distance += edge_length

    return round(total_distance / 1000, 2)


def calculate_eta(graph, path):
    """
    Calculate ETA using actual road-based travel times (from OSMnx),
    instead of a flat average-speed assumption.
    """
    total_seconds = 0
    for i in range(len(path) - 1):
        edge = graph.get_edge_data(path[i], path[i + 1])
        total_seconds += edge[0]["travel_time"]
    return round(total_seconds / 60)