import os
from flask import Flask, send_from_directory
from flask_cors import CORS

from routes.health import health_bp
from routes.route import route_bp

# Locate pre-built frontend distribution if present
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
POSSIBLE_DIST_PATHS = [
    os.path.abspath(os.path.join(BASE_DIR, "..", "..", "frontend", "dist")),
    os.path.abspath(os.path.join(BASE_DIR, "dist")),
    os.path.abspath(os.path.join(BASE_DIR, "static_dist")),
    os.path.abspath(os.path.join(BASE_DIR, "public")),
]

FRONTEND_DIST = None
for p in POSSIBLE_DIST_PATHS:
    if os.path.isdir(p) and os.path.exists(os.path.join(p, "index.html")):
        FRONTEND_DIST = p
        break

if FRONTEND_DIST:
    print(f"[STATIC] Serving production frontend from: {FRONTEND_DIST}")
    app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path="")
else:
    app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

app.register_blueprint(health_bp)
app.register_blueprint(route_bp)

# If frontend bundle exists, route non-API paths to React SPA index.html
if FRONTEND_DIST:
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        # Don't intercept API endpoints
        if path in ("health", "route", "reports") or path.startswith(("route/", "reports/", "location/", "corridor/", "activate-signal/")):
            return {"status": "error", "message": "Not Found"}, 404
        if path != "" and os.path.exists(os.path.join(FRONTEND_DIST, path)):
            return send_from_directory(FRONTEND_DIST, path)
        return send_from_directory(FRONTEND_DIST, "index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting AI Green Corridor Flask Backend on http://0.0.0.0:{port} ...")
    app.run(host="0.0.0.0", port=port, debug=False)