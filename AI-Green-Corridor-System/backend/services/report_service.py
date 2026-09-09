import json
import os
from typing import List, Optional, Dict, Any

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
REPORTS_FILE = os.path.join(DATA_DIR, "reports.json")


def _ensure_storage() -> None:
    """Ensure data directory and reports.json file exist."""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(REPORTS_FILE):
        try:
            with open(REPORTS_FILE, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)
        except Exception as e:
            print(f"[REPORTS] Error initializing reports file: {e}")


def get_all_reports() -> List[Dict[str, Any]]:
    """Retrieve all persisted completed trip reports."""
    _ensure_storage()
    try:
        with open(REPORTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return []
    except Exception as e:
        print(f"[REPORTS] Error reading reports: {e}")
        return []


def get_report_by_id(trip_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve an individual trip report by trip_id."""
    reports = get_all_reports()
    for report in reports:
        if report.get("trip_id") == trip_id:
            return report
    return None


def save_report(report: Dict[str, Any]) -> Dict[str, Any]:
    """Persist a completed trip report."""
    _ensure_storage()
    reports = get_all_reports()

    # Update existing if same trip_id, otherwise prepend to list
    trip_id = report.get("trip_id")
    updated = False
    for i, existing in enumerate(reports):
        if existing.get("trip_id") == trip_id:
            reports[i] = report
            updated = True
            break

    if not updated:
        reports.insert(0, report)

    try:
        with open(REPORTS_FILE, "w", encoding="utf-8") as f:
            json.dump(reports, f, indent=2)
    except Exception as e:
        print(f"[REPORTS] Error writing report: {e}")

    return report
