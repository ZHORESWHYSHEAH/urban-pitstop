# Urban Pitstop — A Real-Time Essential Facilities Network

Urban Pitstop is a mobile-first, local-first platform designed to help outdoor workers (delivery riders, street vendors, field staff, drivers, and commuters) find and access verified essential facilities nearby:
- 💧 **Drinking Water** (RO filtered dispensers, cold water coolers, potable public taps)
- 🚻 **Toilets** (public pay-and-use, partner cafes, petrol station washrooms)
- 🌳 **Shaded Resting Spots** (canopy parks, flyover waiting bays, rest shelters)
- ⚡ **Phone Charging** (fast USB stations, 3-pin plugs, partner pickup benches)
- ☕ **Safe Short-Break Locations**

> **Core Product Promise**: Find a nearby place you can *actually use* — not just a pin on a map. Avoid wasted trips caused by closed, unavailable, inaccessible, or incorrectly listed facilities.

---

## 🌟 Key Product & Technical Highlights

### 1. Reliability Before Proximity
A slightly farther facility confirmed to be available within the last hour ranks higher than an unverified or stale facility 50 meters closer.
- **Trust Scoring Engine**: Evaluates evidence hierarchy (Operator confirmation > Verified community visitor > Imported listings).
- **Status Decay Policies**: Category-specific volatility thresholds (e.g., toilets expire in 2.5–6 hours, whereas shade shelters decay over 24 hours).
- **Contradiction Detection**: Flags facilities with conflicting reports (e.g., 1 user reports open, another reports door lock jammed) and downgrades confidence until staff or community verifies.

### 2. Natural-Language Request Flow (Gemini AI Invisible Intelligence)
Users can type or speak natural requests into the existing search bar:
- *"Drinking water near me"*
- *"Find a toilet open to non-customers"*
- *"Need drinking water and shade within a short walk"*
- *"I have 10 minutes before my next delivery. Find somewhere to rest"*

**AI Orchestration**:
- Extracts structured constraints (`categories`, `maxWalkMinutes`, `accessConditionsAllowed`, `singleStopRequired`).
- Disambiguates complex multi-need requests with 1-tap chips: *"You asked for water and shade. Find one place with both? [Yes, one place] [Either is fine]"*.
- Falls back transparently to a deterministic local NLP parser when offline or without internet.

### 3. In-App Turn-by-Turn Walking Navigation HUD
- **Zero External App Redirects**: Navigation occurs entirely within the application map view without redirecting to external mapping apps.
- Real-time navigation HUD featuring:
  - Step-by-step turn maneuvers and directional icons (Straight, Turn Left, Turn Right, Arrive).
  - Live distance countdown and remaining walk time.
  - Heading compass indicator and walking speed gauge (4.6 km/h).
  - Next maneuver preview ("In 140m: Turn right into station concourse").
  - Upfront access requirements display (e.g., *"Ask security politely"* or *"Token required from counter"*).
  - Arrival verification button: *"I Have Arrived"* triggers instant 1-tap confirmation.

### 4. Role-Protected Portals & Enterprise Capabilities
- **Find (Public / Outdoor Worker View)**: 36+ verified facilities in the central corridor across all 5 essential categories with high-contrast outdoor ergonomics.
- **Worker Privileged Field Hygiene Inspection**: Outdoor workers and field inspectors conduct structured on-site sanitation audits:
  - 1-to-5 star cleanliness rating.
  - Sanitation condition (Spotless, Acceptable, Needs Cleaning, Hazardous).
  - Water flow & pressure verification (Optimal, Low, No Flow).
  - Supply check (Soap/Sanitizer, Running Water, Functional Lock, Lighting, Dustbin).
  - Safety & lighting assessment.
  - Direct update to platform reliability confidence.
- **Operator Self-Registration & Management**:
  - Independent facility owners can register their business and submit facility details.
  - Registrations enter `pending_approval` status for administrative review.
  - Approved operators gain full station management capabilities: `Available Now` / `Mark Unavailable` overrides and public notices.
- **Administrator Command Center (`AdminDashboard.tsx`)**:
  - **Spaces & Services Directory**: Full inventory of all 36+ facilities, search/filter by service, live status toggling, and space creation.
  - **Moderation & Review Queue**: AI-grounded contradiction triage with instant action execution (`Approve & Verify`, `Resolve Conflict`, `Mark Stale`, `Dismiss Spam`).
  - **Operator & User Management**: Review and approve/reject partner applications, create platform accounts, and manage user statuses.
  - **Security & RBAC Audit Logs**: Immutable chronological ledger of all authentication and authorization events.

### 5. Multi-Language Outdoor Ergonomics
- Available in **English**, **हिन्दी (Hindi)**, **ಕನ್ನಡ (Kannada)**, **தமிழ் (Tamil)**, and **Español (Spanish)**.
- 44–48px+ touch targets, high-contrast outdoor color palette (`#176B4D` Forest Green, `#202522` Charcoal, `#F7F8F5` Warm Surface, `#F4B942` Amber Alert, `#C64545` Muted Red).

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS v3 |
| **Mapping** | Leaflet with CartoDB Positron / OSM outdoor tiles + custom SVG pins & route preview |
| **Icons & UI** | Lucide React, CSS Transitions & Snap Points |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic |
| **GenAI** | Google Gemini (`google.genai` SDK / Vertex AI) + Local NLP Fallback |
| **Data & Offline** | Local-First Storage, Outbox Queue, In-Memory Pilot Corridor Database |
| **Security & RBAC** | Manual Credentials Authentication, Role-Based Access Control, Immutable Audit Logging (`/api/auth/audit-logs`) |
| **Deployment** | Google Cloud Run, Docker containerized |

---

## 🔐 Role-Based Access Control (RBAC) & Accounts

Urban Pitstop enforces strict credential-based role authentication with a clean, production-grade login interface (no exposed credentials). 1-click bypasses are disabled. To access protected views, sign in via the dedicated **Login Page** (`/login` or via the top user profile menu):

| Role / Actor | Email Address | Password | Permissions & Views |
|---|---|---|---|
| **Outdoor Worker / Field Inspector** | `rider@urbanpitstop.com` | `Worker@2026` | Real-time facility search, in-app navigation, arrival check-in, community confirmations, **Worker Field Hygiene Inspections**. |
| **Facility Operator (Service Provider)** | `operator@urbanpitstop.com` | `Operator@2026` | Station management, live `Available Now` / `Mark Unavailable` operational overrides, broadcast notices. |
| **Platform Administrator** | `admin@urbanpitstop.com` | `Admin@2026` | **Spaces & Services Directory**, AI moderation queue, **Operator Approvals**, **User Management**, **Security & RBAC Audit Logs**. |
| **Anonymous Guest** | `guest@urbanpitstop.com` | *(None)* | Read-only discovery and in-app walking navigation. Restricted from operational hub and administrative controls. |

### 🏢 Operator Self-Registration
Independent facility operators can apply for inclusion in the network directly via the **Partner / Operator Signup** tab on the login screen. Applications specify operating hours, capacity, amenities, and fee models. Upon submission, applications enter an administrative queue where platform admins can approve (activating the operator and adding the space to the network) or reject them.

### 🛡️ Security Audit Logging
Every authentication event (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `ACCESS_DENIED`) is recorded in an immutable audit ledger on both the client and the FastAPI backend (`POST /api/auth/audit-logs`). Administrators can review the live audit trail directly within the Admin Dashboard.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v20+)
- Python (v3.10+)

### 1. Run the Frontend
```bash
# In the project root directory
npm install
npm run dev
```
The app will be running at `http://127.0.0.1:5173/`.

### 2. Run the FastAPI Backend (Optional / Recommended)
```bash
# In another terminal window
python -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload
```
API documentation will be available at `http://127.0.0.1:8000/docs`.

### 3. Optional: Set Gemini API Key
```bash
# Windows PowerShell
$env:GEMINI_API_KEY="your-gemini-api-key"

# Linux / Mac
export GEMINI_API_KEY="your-gemini-api-key"
```
*(If no API key is provided, the system automatically uses its built-in rule-based NLP intent parser and evidence engine without crashing).*

---

## ☁️ Google Cloud Run Deployment

### Dockerfile
```dockerfile
# Multi-stage Dockerfile
FROM node:20-alpine AS build-frontend
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM python:3.10-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi uvicorn pydantic google-genai
COPY --from=build-frontend /app/dist /app/static
COPY server /app/server
ENV PORT=8080
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Deploy Command to Cloud Run
```bash
gcloud run deploy urban-pitstop \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="YOUR_KEY"
```
