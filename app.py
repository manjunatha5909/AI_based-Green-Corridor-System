"""
AI Based Green Corridor System - Root Backend Server Entry Point
=================================================================
Initializes the OSMnx graph engine and launches the Flask REST API on port 5000.
"""

import importlib.util
import os
import sys

# Point to backend directory
BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AI-Green-Corridor-System", "backend")

if os.path.exists(BACKEND_DIR):
    if BACKEND_DIR not in sys.path:
        sys.path.insert(0, BACKEND_DIR)
    os.chdir(BACKEND_DIR)

backend_app_path = os.path.join(BACKEND_DIR, "app.py")
backend_spec = importlib.util.spec_from_file_location("green_corridor_backend", backend_app_path)
if backend_spec is None or backend_spec.loader is None:
    raise ImportError(f"Could not load backend application from {backend_app_path}")

backend_module = importlib.util.module_from_spec(backend_spec)
backend_spec.loader.exec_module(backend_module)
app = backend_module.app

if __name__ == "__main__":
    print("Starting AI Green Corridor Flask Backend on http://127.0.0.1:5000 ...")
    app.run(host="0.0.0.0", port=5000, debug=False)

