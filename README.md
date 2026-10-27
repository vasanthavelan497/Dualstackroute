# DualStackRoute

**Intelligent Dual-Stack Routing, QoS Optimization & Network Resilience Analysis Platform**

DualStackRoute is an end-to-end network engineering research and operations platform designed to simulate, analyze, and optimize dual-stack IPv4/IPv6 traffic flows. It implements deterministic multi-objective Dijkstra routing with configurable QoS constraints (latency, packet loss, bottleneck bandwidth, hop counts), dynamic link degradation and failure simulation, and persistent experiment benchmarking.

---

## Quick Start (One-Click)

### Option A: Using PowerShell
From the project root:
```powershell
.\start.ps1
```

### Option B: Using Windows Command Prompt / File Explorer
Double-click `run.bat` or run:
```cmd
run.bat
```

This will automatically launch the **FastAPI Backend** and the **Vite React Frontend** in separate terminal windows.

---

## Manual Step-by-Step Instructions

### 1. Backend Server (FastAPI)
The backend runs on Python 3.12 with FastAPI and SQLite.

```powershell
# Open terminal in project root
cd "c:\Users\SRIDHARAN G\Documents\Dualstackroute"

# Set python path so the backend package resolves correctly
$env:PYTHONPATH="."

# Run the Uvicorn development server
.\backend\venv\Scripts\uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

- **API Endpoint:** `http://127.0.0.1:8000/api/v1`
- **Interactive Swagger Documentation:** `http://127.0.0.1:8000/docs`
- **ReDoc Documentation:** `http://127.0.0.1:8000/redoc`

---

### 2. Frontend Application (React + Vite + TypeScript)
The frontend is built with React 19, Vite, Lucide Icons, Recharts, and XYFlow.

```powershell
# Open terminal in the frontend directory
cd "c:\Users\SRIDHARAN G\Documents\Dualstackroute\frontend"

# Start the Vite development server
npm run dev
```

- **Frontend Application URL:** `http://localhost:5173`

---

## Running Automated Tests

### Backend Unit Tests (Pytest)
```powershell
cd "c:\Users\SRIDHARAN G\Documents\Dualstackroute"
$env:PYTHONPATH="."
.\backend\venv\Scripts\pytest backend\tests -v
```
*(Runs 23 tests covering API routing, IP address and subnet validation, and Dijkstra QoS routing calculations).*

### Frontend Unit Tests (Vitest)
```powershell
cd "c:\Users\SRIDHARAN G\Documents\Dualstackroute\frontend"
npx vitest run
```

### Frontend Production Build Check
```powershell
cd "c:\Users\SRIDHARAN G\Documents\Dualstackroute\frontend"
npm run build
```

---

## Platform Features

1. **Network Operations Center (Overview):**
   Real-time system telemetry, active routing metrics (total cost, latency, loss, hop count), and live event feed.
2. **Interactive Topology Graph:**
   Canvas powered by React Flow displaying nodes (PC1, R1, R2, R3, R4, PC2), dual-stack subnets, interface metrics, and live link manipulation modal.
3. **Routing Lab:**
   Customizable multi-objective QoS constraint solver with adjustable weights for latency, packet loss, and hop count. Computes optimal path and ranks candidate routes.
4. **Failure & Resilience Simulator:**
   Sever or degrade any link on the fly to observe deterministic re-routing and compare before/after performance metrics.
5. **Dual-Stack Inspector:**
   RFC 4213 transition analyzer and interactive IPv4 / IPv6 syntax and CIDR subnet validator.
6. **Experiment History & Benchmark Archive:**
   Persistent SQLite record of benchmark runs, JSON/CSV exports, and side-by-side metric comparison modal.
7. **Analytics & Reports:**
   Empirical Recharts visualizations evaluating latency distribution, cost vs loss trade-offs, and reachability ratios.
8. **Network Engineering Concepts:**
   Theoretical reference for RFC 4213, dual-stack co-existence, multi-criteria routing, and QoS mathematical formulations.
