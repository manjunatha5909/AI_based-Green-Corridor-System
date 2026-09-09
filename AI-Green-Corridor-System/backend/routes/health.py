from flask import Blueprint

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health():
    return {
        "project": "AI Green Corridor System",
        "status": "Backend Running Successfully",
        "version": "1.0"
    }