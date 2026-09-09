def initialize_corridor(signals):
    """
    Initialize all traffic signals as RED.
    """

    signal_states = {}

    for signal in signals:
        signal_id = signal["id"]

        signal_states[signal_id] = {
            "id": signal_id,
            "lat": signal["lat"],
            "lon": signal["lon"],
            "state": "RED"
        }

    return signal_states


def activate_signal(signal_states, signal_id):
    """
    Activate one signal as GREEN.
    All other signals remain RED.
    """

    for current_id in signal_states:
        signal_states[current_id]["state"] = "RED"

    if signal_id in signal_states:
        signal_states[signal_id]["state"] = "GREEN"

    return signal_states