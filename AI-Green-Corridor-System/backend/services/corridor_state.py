import time

corridor_data = {
    "route": [],
    "signals": [],
    "signal_states": {},
    "gps": None,
    "active_trip": None
}


def set_corridor(route, signals, signal_states):
    """
    Store the current active green corridor.
    """

    corridor_data["route"] = route
    corridor_data["signals"] = signals
    corridor_data["signal_states"] = signal_states
    corridor_data["gps"] = None

    return corridor_data


def set_gps(lat, lon, metadata=None):
    corridor_data["gps"] = {
        "lat": lat,
        "lon": lon,
        "timestamp": time.time(),
        **(metadata or {}),
    }
    return corridor_data["gps"]


def get_gps():
    return corridor_data.get("gps")


def get_corridor():
    """
    Return the current corridor state.
    """

    return corridor_data


def set_active_trip(trip):
    """Store the active trip object."""
    corridor_data["active_trip"] = trip
    return trip


def get_active_trip():
    """Get the active trip object."""
    return corridor_data.get("active_trip")


def update_active_trip(**kwargs):
    """Update fields on the active trip object."""
    trip = corridor_data.get("active_trip")
    if trip:
        trip.update(kwargs)
    return trip


def reset_corridor():
    """Reset and end the active green corridor state."""
    corridor_data["route"] = []
    corridor_data["signals"] = []
    corridor_data["signal_states"] = {}
    corridor_data["gps"] = None
    corridor_data["active_trip"] = None
    return corridor_data