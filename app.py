"""
AI Based Green Corridor System - Root Backend Server Entry Point
=================================================================
Initializes the OSMnx graph engine and launches the Flask REST API.
Compatible with Gunicorn, Render, Railway, Docker, and direct python app.py execution.
"""

import sys
import os

# Point to backend directory
BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AI-Green-Corridor-System", "backend")

if os.path.exists(BACKEND_DIR):
    if BACKEND_DIR not in sys.path:
        sys.path.insert(0, BACKEND_DIR)
    os.chdir(BACKEND_DIR)

from app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting AI Green Corridor Flask Backend on http://0.0.0.0:{port} ...")
    app.run(host="0.0.0.0", port=port, debug=False)
