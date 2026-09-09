# AI Green Corridor System

The outer project is the local launcher for the application. The frontend is tracked here, while the backend remains in the nested `AI-Green-Corridor-System` repository so its independent history and local changes are preserved.

## Project structure

```text
green-corridor-system/
├── app.py                         # Root backend launcher
├── package.json                   # Root convenience scripts
├── frontend/                      # React + Vite application
│   ├── src/
│   ├── public/
│   └── package.json               # Frontend dependencies and scripts
└── AI-Green-Corridor-System/      # Backend repository
    ├── backend/
    │   ├── app.py                 # Flask application
    │   ├── routes/
    │   ├── services/
    │   └── requirements.txt
    ├── backend/data/               # Runtime reports
    ├── backend/test_*.py           # Backend checks
    └── mappls-test/
```

## Run locally

Install frontend dependencies from `frontend/`, then use the root scripts:

```powershell
npm install --prefix frontend
npm run dev
python app.py
```

The React app runs on Vite's default port and the Flask API runs on `http://127.0.0.1:5000`.