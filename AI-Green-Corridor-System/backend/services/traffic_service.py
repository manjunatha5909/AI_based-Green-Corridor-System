import os
import time
import threading
import requests
from requests.adapters import HTTPAdapter
from dotenv import load_dotenv

load_dotenv()

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")

_cache = {}
_CACHE_TTL = 60

_thread_local = threading.local()


def _get_session():
    if not hasattr(_thread_local, "session"):
        session = requests.Session()
        adapter = HTTPAdapter(pool_connections=10, pool_maxsize=10, max_retries=0)
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        _thread_local.session = session
    return _thread_local.session


def _get_cache_key(lat, lon):
    return (round(lat, 4), round(lon, 4))


def get_traffic_multiplier(lat, lon):
    t_start = time.perf_counter()

    if not TOMTOM_API_KEY or TOMTOM_API_KEY == "your_actual_key_here":
        print(
            f"[TIMING] Traffic API call lat={lat:.4f} lon={lon:.4f}: "
            f"{time.perf_counter()-t_start:.3f} sec (no key)"
        )
        return 1.0

    cache_key = _get_cache_key(lat, lon)
    now = time.time()

    if cache_key in _cache:
        cached_time, cached_value = _cache[cache_key]
        if now - cached_time < _CACHE_TTL:
            print(
                f"[TIMING] Traffic API call lat={lat:.4f} lon={lon:.4f}: "
                f"{time.perf_counter()-t_start:.3f} sec (cached)"
            )
            return cached_value

    url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"

    params = {
        "point": f"{lat},{lon}",
        "key": TOMTOM_API_KEY
    }

    try:
        session = _get_session()
        response = session.get(url, params=params, timeout=5)

        response.raise_for_status()

        data = response.json()

        flow_data = data.get("flowSegmentData", {})
        current_speed = flow_data.get("currentSpeed")
        free_flow_speed = flow_data.get("freeFlowSpeed")

        if (
            current_speed is not None
            and free_flow_speed is not None
            and current_speed > 0
        ):
            multiplier = free_flow_speed / current_speed
            multiplier = max(1.0, min(3.0, multiplier))
        else:
            multiplier = 1.0

        print(
            f"[TIMING] Traffic API call lat={lat:.4f} lon={lon:.4f}: "
            f"{time.perf_counter()-t_start:.3f} sec"
        )

    except Exception as e:
        multiplier = 1.0
        print(
            f"[TRAFFIC ERROR] lat={lat:.4f} lon={lon:.4f}: "
            f"{type(e).__name__}: {e}"
        )

    _cache[cache_key] = (now, multiplier)
    return multiplier


if __name__ == "__main__":
    print("Testing TomTom traffic...")
    result = get_traffic_multiplier(12.9756, 77.6068)
    print("Traffic multiplier:", result)