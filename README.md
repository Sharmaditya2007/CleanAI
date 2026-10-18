# Clean AI — Smarter Toilets. Cleaner Cities.

> **AI-Powered Public Toilet Cleanliness & Civic Sanitation Monitoring Platform**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg?logo=react)](https://react.dev/)
[![YOLOv11](https://img.shields.io/badge/Model-YOLOv11%20Nano-00FFFF.svg?logo=ultralytics)](https://ultralytics.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248.svg?logo=mongodb)](https://www.mongodb.com/)

---

## 🌟 Overview

**Clean AI** is an autonomous civic-technology platform designed to bring transparency, accountability, and real-time oversight to urban public sanitation. Powered by a custom-trained **YOLOv11 Nano Object Detection model** trained across **16 sanitation and cleanliness classes**, Clean AI inspects photographs of public washroom fixtures, evaluates hygienic conditions, and enforces strict municipal verification standards before publishing public ratings.

---

## 🚀 Key Features

### 1. 🏛️ Municipal Authority Portal
* **Live Civic Metrics:** Real-time dashboards calculating clean toilets, facilities needing cleaning, under-maintenance restrooms, completed inspections, and open citizen reports.
* **AI-Assisted Inspection Workflow:** Officers upload inspection photos, view real-time YOLO bounding box detections, and confirm or override the AI recommendation.
* **Integrity & Audit Logging:** Any officer override requires a recorded reason. All decisions are timestamped and permanently logged in the audit trail.
* **Facility Registrations & Approvals:** Review new public restroom applications submitted by facility contractors.
* **Sanitation Task Dispatch:** Directly assign urgent cleaning tasks with priority ratings.

### 2. 🏢 Toilet Owner & Contractor Portal
* **Facility Registration:** Submit new toilet facilities with GPS coordinates, accessibility info, and operating hours for municipal approval.
* **Cleaning Order Tracking:** Receive automated cleaning alerts dispatched from inspections or complaints.
* **Verification Integrity Policy:** When an owner reports cleaning complete, the facility updates to `Verification Pending`—preventing unverified self-certification until an officer confirms.
* **After-Cleaning Photo Uploads:** Optional AI analysis on post-cleaning photographs to preview detection before municipal re-inspection.

### 3. 🧭 Citizen Discovery Portal
* **Browser Geolocation:** Turn-on GPS discovery to locate the closest public toilets with exact distance calculations.
* **Interactive Map (Leaflet & OpenStreetMap):** Custom colored pins displaying verified cleanliness status (`Clean`, `Needs Cleaning`, `Under Maintenance`).
* **Turn-by-Turn Directions:** One-click navigation to Google Maps / OpenStreetMap.
* **Civic Reporting:** Submit reports for dirty floors, broken taps, or missing water, with an instant tracking reference number (`CMP-2026-XXXX`).

---

## 🧠 AI Model Specifications

* **Model File:** `clean ai/results/clean_ai_floor_v2/weights/best.pt`
* **Architecture:** Ultralytics YOLOv11 Nano (Object Detection)
* **Native Input Size:** `320x320` (`imgsz=320`, `conf=0.25`)
* **Trained Classes (16):**
  `clean_basin`, `clean_floor`, `clean_indian`, `clean_urinal`, `clean_western`, `damage`, `dirty_basin`, `dirty_floor`, `dirty_indian`, `dirty_urinal`, `dirty_western`, `garbage`, `partial_dirty_floor`, `partial_dirty_indian`, `partial_dirty_urinal`, `partial_dirty_western`.
* **Cautious Recommendation Engine:**
  * Clean fixtures detected & 0 dirty objects $\rightarrow$ `Clean`
  * Any dirty/garbage object detected $\rightarrow$ `Needs Cleaning`
  * Facility damage detected $\rightarrow$ `Under Maintenance`
  * No objects confidently identified $\rightarrow$ `Inconclusive - Officer Inspection Required`

---

## 🛠️ Local Development Setup

### 1. Quick Start (Windows)
Double-click `start_clean_ai.bat` to automatically launch both the Backend and Frontend servers.

Or start individually:
* **Backend:** Run `start_backend.bat` (accessible on `http://127.0.0.1:8000`)
* **Frontend:** Run `start_frontend.bat` (accessible on `http://localhost:5173`)

### 2. Manual Setup

#### Backend (Python & FastAPI):
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend (React, Vite, TypeScript):
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Cloud Deployment Guide

### Backend on Render:
1. Connect this repository to [Render](https://dashboard.render.com).
2. Create a new **Web Service**.
3. **Build Command:** `pip install --no-cache-dir -r backend/requirements.txt`
4. **Start Command:** `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Set Environment Variables:
   * `MONGODB_URI`: Your MongoDB Atlas connection string.
   * `MONGODB_DB_NAME`: `clean_ai_database`
   * `JWT_SECRET`: Random secure string.

### Frontend on Vercel:
1. Import this repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set Environment Variable:
   * `VITE_API_URL`: `https://<your-render-backend-url>/api`
4. Deploy!

---

## 🧪 Testing

Run the automated test suite verifying AI discovery, real model sample inference, auth, RBAC, and status consistency:

```bash
python backend/tests/test_full_suite.py
```
*(All 12 automated test suites pass cleanly).*

---

## 👥 Demo Credentials

* **Municipal Officer:** `officer@cleanai.gov` / `Officer@123`
* **Toilet Owner:** `owner@cleanai.com` / `Owner@123`
* **Public Citizen:** `citizen@cleanai.org` / `Citizen@123`
