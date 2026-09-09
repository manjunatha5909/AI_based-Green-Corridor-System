import os
import osmnx as ox

GRAPH_FILE = "bengaluru.graphml"

def load_bengaluru_graph():
    if os.path.exists(GRAPH_FILE):
        print("Loading saved graph...")
        return ox.load_graphml(GRAPH_FILE)

    print("Downloading Bengaluru road network...")
    graph = ox.graph_from_place(
        "Bengaluru, Karnataka, India",
        network_type="drive"
    )

    graph = ox.add_edge_speeds(graph)
    graph = ox.add_edge_travel_times(graph)

    ox.save_graphml(graph, GRAPH_FILE)
    print("Graph saved!")

    return graph