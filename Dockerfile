# =========================================================
# Stage 1: Build Frontend (React + Vite)
# =========================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# =========================================================
# Stage 2: Production Backend (Python 3.11 + OSMnx + Gunicorn)
# =========================================================
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for geospatial libraries (GEOS, GDAL, PROJ)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code and root launcher
COPY AI-Green-Corridor-System/backend/ ./AI-Green-Corridor-System/backend/
COPY app.py .

# Copy built frontend assets into static distribution folders
COPY --from=frontend-builder /app/frontend/dist ./AI-Green-Corridor-System/backend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose default HTTP port
EXPOSE 5000
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:${PORT}/ || exit 1

# Start production server with Gunicorn (timeout=120 for loading 180MB graphml)
CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:${PORT} --workers 2 --timeout 120"]

