# 🚀 Production Deployment Guide — AI Green Corridor System

This guide outlines how to deploy the full-stack **AI Based Green Corridor System** (Flask Backend + React Vite Frontend + OSMnx Bengaluru Road Graph).

---

## 🏗️ Architecture Options

The project is configured to support **two production architectures**:

### Option 1: Unified Single-Service Deployment (Recommended)
* **How it works**: The Flask backend serves both the REST API and the pre-compiled production React SPA (`frontend/dist`).
* **Advantages**:
  - **Single domain URL**: e.g., `https://green-corridor.onrender.com`
  - **Zero CORS configuration**: Frontend and backend share the exact same origin.
  - **Minimal hosting cost**: Requires only **one** web service / container.
  - **Works on**: Docker, Render, Railway, AWS EC2, DigitalOcean, or any VPS.

### Option 2: Decoupled Microservice Deployment
* **Frontend**: Hosted on **Vercel** or **Netlify** (Global Edge CDN).
* **Backend**: Hosted on **Render**, **Railway**, or **AWS EC2** (Python 3.11 with Gunicorn).
* **Advantages**: Independent frontend scaling, fast static edge caching.

---

## ⚙️ Environment Variables Reference

| Variable | Required? | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Auto by host | `5000` | Port where the backend server listens. |
| `TOMTOM_API_KEY` | Recommended | Built-in fallback | TomTom Traffic API key for real-time congestion sampling. |
| `VITE_API_URL` | Decoupled only | Same origin (`""`) | **Only needed if frontend is hosted on a separate domain (e.g. Vercel).** Set to your live backend URL (e.g., `https://your-backend.onrender.com`). |
| `VITE_CARTO_API_KEY` | Optional | `""` | CARTO basemap API key if using custom CARTO tiles (OpenStreetMap raster tiles are used by default without any watermark). |

---

## 🌐 Deployment Method 1: Render (Easiest Cloud Setup)

Render is the simplest platform to deploy Python + Docker web services with Git integration.

### Steps:
1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure production deployment"
   git push origin main
   ```
2. **Log in to [Render.com](https://render.com/)** and click **New +** → **Web Service**.
3. **Connect your GitHub repository**.
4. **Choose Deployment Type**:
   - **Environment**: Select **Docker** (Render will automatically detect our `Dockerfile`).
   - **Region**: Choose a region near your users (e.g. `Singapore` or `Frankfurt`).
   - **Instance Type**: Select **Starter** (requires at least 1 GB – 2 GB RAM for the Bengaluru road graph).
5. **Set Environment Variables**:
   - `TOMTOM_API_KEY`: *(Optional, enter your TomTom key if desired)*
   - `PORT`: `5000`
6. Click **Create Web Service**.
7. In ~3–5 minutes, your application is live at `https://your-app-name.onrender.com`!

---

## 🚂 Deployment Method 2: Railway

Railway offers seamless Docker-based deployments with high-performance containers.

### Steps:
1. Go to **[Railway.app](https://railway.app/)** and create an account.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your `green-corridor-system` repository.
4. Railway automatically recognizes the `Dockerfile`.
5. Under **Variables**, add:
   - `PORT`: `5000`
   - `TOMTOM_API_KEY`: *(Optional)*
6. Under **Settings** → **Networking**, click **Generate Domain**.
7. Railway will build the container and deploy your live URL.

---

## 🐳 Deployment Method 3: Self-Hosted VPS / Cloud VM (Docker Compose)

Deploy to **AWS EC2**, **DigitalOcean Droplet**, **Linode**, **Hetzner**, or **GCP Compute Engine**.

### 1. Requirements:
- Ubuntu 22.04+ with Docker and Docker Compose installed.
- Recommended minimum specs: **2 vCPU, 2 GB RAM, 10 GB SSD**.

### 2. Clone & Launch:
```bash
# Clone the repository
git clone https://github.com/manjunatha5909/AI_based-Green-Corridor-System.git
cd AI_based-Green-Corridor-System

# Start the complete system in background
docker compose up -d --build
```

### 3. Verify:
Visit `http://YOUR_SERVER_IP:5000` in your web browser.

### 4. Optional: Add Domain & Free HTTPS with Nginx + Certbot:
Create an Nginx reverse proxy configuration (`/etc/nginx/sites-available/corridor`):
```nginx
server {
    server_name corridor.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```
Enable and get SSL:
```bash
sudo ln -s /etc/nginx/sites-available/corridor /etc/nginx/sites-enabled/
sudo certbot --nginx -d corridor.yourdomain.com
```

---

## ⚡ Deployment Method 4: Decoupled (Vercel Frontend + Render Backend)

If you want the React frontend hosted on Vercel's global edge CDN:

### 1. Deploy the Backend to Render:
- Follow **Method 1** above to deploy the backend.
- Copy your backend URL: e.g. `https://corridor-api.onrender.com`.

### 2. Deploy the Frontend to Vercel:
1. Go to **[Vercel.com](https://vercel.com/)** → **Add New** → **Project**.
2. Select your repository.
3. Configure project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - Name: `VITE_API_URL`
   - Value: `https://corridor-api.onrender.com` *(your live backend URL)*
5. Click **Deploy**. Vercel will build and launch your frontend with instant global caching.

---

## 🔍 Post-Deployment Health Check

Once your deployment is live, verify the endpoints:

* **Frontend UI**: `GET /` → returns React HTML and map dashboard.
* **Backend Health**: `GET /` (or with `Accept: application/json`) → returns `{"project": "AI Green Corridor System", "status": "Backend Running Successfully"}`.
* **Route Calculation**: `POST /route` → returns calculated shortest path with signal states.
* **End Trip**: `POST /route/end` → terminates active trip and returns official trip report.
* **Reports Archive**: `GET /reports` → lists persisted completed reports.

