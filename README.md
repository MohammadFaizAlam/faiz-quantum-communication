# Quantum Secure Communication (BB84) & Intruder Detection

An educational simulation and interactive workbench for the **BB84 Quantum Key Distribution (QKD)** protocol, demonstrating quantum measurement disturbance, statistical eavesdropper detection, and One-Time Pad (OTP) encryption.

---

## Architecture

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
* **Backend:** Python FastAPI, Uvicorn, Pydantic.

---

## Local Development

### 1. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8123 --reload
```
Runs at: `http://localhost:8123`

### 2. Frontend (Vite)
```bash
cd frontend
npm install
npm run dev
```
Runs at: `http://localhost:5173`

---

## Cloud Deployment

* **Backend:** Deploy `backend/` as a Python Web Service on **Render** (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
* **Frontend:** Deploy `frontend/` on **Netlify** with `npm run build` (publish dir: `dist`), setting `VITE_API_URL` to your Render backend URL.
