# RolloutGuard — Deployment Safety & Release Monitoring Platform

[![Testing](https://img.shields.io/badge/tests-12%20passing-emerald)](./backend/tests)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-blue)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18.3-cyan)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**RolloutGuard** is an automated canary deployment safety and release monitoring platform built with the MERN stack (MongoDB, Express, React, Node.js). It compares new software candidate releases against existing stable baselines in real time, computes error rates and latency regressions, evaluates configurable health thresholds, and automatically halts rollouts and provides guided rollback execution when degradations occur.

---

## 1. Problem Statement

Modern CI/CD pipelines frequently push updates directly to full production or coarse traffic splits. When an application version introduces a subtle regression—such as a database query causing elevated 5xx error rates, thread exhaustion, or tail latency spikes—hundreds or thousands of users suffer degraded experiences before operations teams detect the problem and orchestrate a rollback.

**RolloutGuard** provides an automated safety net:
- Progressive canary traffic scaling (5% → 25% → 50% → 100%).
- Rigorous statistical comparison against the baseline stable version.
- Automated threshold health evaluation.
- Instant progressive rollout halts and rollback recommendations upon breach.
- Simulated deployment lab with 6 reproducible release scenarios.

> **Transparency Note**: RolloutGuard utilizes a built-in simulated release traffic engine. While metrics, health checks, thresholds, MongoDB models, state machines, and rollback workflows are fully authentic and functional, traffic metrics and recovery events are generated in simulation and do not alter actual live cloud infrastructure (such as AWS ECS, Kubernetes Ingress, or Cloudflare DNS) unless an external infrastructure integration is configured.

---

## 2. Key Features

- **Release Management & State Machine**:
  - Full lifecycle tracking: `Draft`, `Running`, `Healthy`, `Degraded`, `Rolled Back`, `Completed`, `Cancelled`.
  - State machine validation preventing invalid transitions or corrupting rollout history.
  - Releases, metric snapshots, and timeline events persisted in MongoDB.

- **Automated Health Evaluator**:
  - Compares candidate error rates, average latency, p95 response time, and synthetic health probe statuses.
  - Dynamically classifies health states as `HEALTHY`, `WARNING`, or `UNHEALTHY`.
  - Produces human-readable explanations pinpointing the exact rule violated and actual vs. allowed values.

- **Progressive Rollout Engine**:
  - Bounded staging pipeline: 5% → 25% → 50% → 100%.
  - Supports start, stage advance, pause, resume, cancel, and rollback.
  - Halts traffic expansion automatically upon critical threshold breach.

- **Simulated Rollback & Recovery Execution**:
  - Freezes candidate traffic immediately upon degradation.
  - Generates recovery metrics showing traffic 100% returned to previous stable baseline.
  - Records detailed audit logs in the release timeline.

- **Interactive Simulation Lab**:
  - 6 coherent, reproducible deployment scenarios:
    1. **Healthy Release**: Clean deployment with low error rate (<1%) and fast latencies (~110ms).
    2. **Error Spike**: Candidate error rate jumps to ~18.5%, breaching the 5% error ceiling.
    3. **Slow API**: Tail latency spikes to p95 > 1,500ms, exceeding the 1,000ms latency ceiling.
    4. **Service Failure**: Synthetic `/healthz` probe returns HTTP 503, triggering consecutive probe failure rules.
    5. **Gradual Degradation**: Metrics look acceptable at 5%, warn at 25%, and breach critical error limits at 50%.
    6. **Recovery After Rollback**: Tests complete reversion sequence back to stable baseline metrics.

- **Observability Dashboard**:
  - Real-time aggregation of healthy releases, degraded releases, rollbacks triggered, and active release progress.
  - Recharts visual comparisons for error rates, latency curves, and historical trends.
  - Clean engineering dashboard aesthetic with responsive Tailwind CSS layout.

- **Configurable Safety Thresholds**:
  - Tune error rate ceilings, warning thresholds, p95 limits, avg latency, and consecutive probe limits.
  - Instant reset to factory defaults with validation.

---

## 3. Technology Stack

- **Frontend**:
  - React 18 with Vite
  - React Router v6
  - Tailwind CSS
  - Recharts for data visualizations
  - Lucide React for consistent icons
- **Backend**:
  - Node.js & Express.js
  - MongoDB & Mongoose
  - MongoMemoryServer (embedded development & automated testing fallback)
  - Express Rate Limiting & CORS security
- **Testing**:
  - Jest & Supertest (12 automated backend integration test cases)

---

## 4. Architecture & Folder Structure

```
MERN-PROJECT 2/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # MongoDB & MongoMemoryServer connection manager
│   │   │   └── thresholds.js         # Default health threshold definitions
│   │   ├── controllers/
│   │   │   ├── dashboardController.js # Aggregations and trend metrics
│   │   │   ├── healthController.js    # /api/health probe
│   │   │   ├── releaseController.js   # Release CRUD, stage actions, rollback
│   │   │   └── settingsController.js  # Global health threshold settings
│   │   ├── middleware/
│   │   │   ├── errorHandler.js       # Central error handling
│   │   │   └── rateLimiter.js        # IP rate limiter
│   │   ├── models/
│   │   │   ├── Application.js        # Registered applications
│   │   │   ├── MetricSnapshot.js     # Windowed baseline vs candidate snapshots
│   │   │   ├── Release.js            # Release records and state machine
│   │   │   ├── ReleaseEvent.js       # Chronological audit timeline events
│   │   │   └── ThresholdConfig.js    # Safety thresholds in MongoDB
│   │   ├── routes/
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── healthRoutes.js
│   │   │   ├── index.js
│   │   │   ├── releaseRoutes.js
│   │   │   └── settingsRoutes.js
│   │   ├── services/
│   │   │   ├── healthEvaluator.js    # Evaluates metrics against threshold rules
│   │   │   ├── metricCalculator.js   # Error rate & p95 arithmetic
│   │   │   ├── releaseService.js     # Release state transitions & rollback execution
│   │   │   └── simulationEngine.js   # 6 deployment scenario generators
│   │   ├── utils/
│   │   │   ├── seed.js               # Database seeding script with realistic data
│   │   │   └── stateTransitions.js   # State machine validation matrix
│   │   ├── validators/
│   │   │   ├── releaseValidator.js
│   │   │   └── settingsValidator.js
│   │   ├── app.js                    # Express app configuration
│   │   └── server.js                 # Server startup & auto-seed
│   ├── tests/
│   │   ├── rolloutguard.test.js      # 12 automated test cases
│   │   └── setup.js                  # MongoMemoryServer test isolation
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AlertBanner.jsx
│   │   │   ├── CreateReleaseModal.jsx
│   │   │   ├── HealthBadge.jsx
│   │   │   ├── MetricCharts.jsx
│   │   │   ├── MetricComparisonTable.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── RollbackModal.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── TimelineView.jsx
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Documentation.jsx
│   │   │   ├── MetricsIncidents.jsx
│   │   │   ├── ReleaseDetails.jsx
│   │   │   ├── Releases.jsx
│   │   │   ├── SettingsThresholds.jsx
│   │   │   └── SimulationLab.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── dashboardApi.js
│   │   │   ├── releaseApi.js
│   │   │   └── settingsApi.js
│   │   ├── utils/
│   │   │   ├── formatters.js
│   │   │   └── statusStyles.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── .gitignore
├── package.json                      # Workspace root scripts
└── README.md
```

---

## 5. Metric Calculations & Health Rules

### Calculations
- **Error Rate (%)**:
  $$\text{Error Rate} = \frac{\text{Failed Requests}}{\text{Total Requests}} \times 100$$
- **Delta Difference**:
  $$\Delta_{\text{Error Rate}} = \text{Candidate Error Rate} - \text{Baseline Error Rate}$$
- **p95 Latency**:
  Interpolated 95th percentile response time (milliseconds) across the evaluation window.

### Default Example Health Gates
| Rule Name | Severity | Default Condition | Action on Violation |
|---|---|---|---|
| `ERROR_RATE_EXCEEDED` | CRITICAL | Error Rate > 5.0% | Halt rollout, recommend immediate rollback |
| `ERROR_RATE_WARNING` | WARNING | Error Rate > 2.5% | Flag warning badge, pause investigation |
| `P95_LATENCY_EXCEEDED` | CRITICAL | p95 Latency > 1,000 ms | Halt rollout, recommend immediate rollback |
| `P95_LATENCY_WARNING` | WARNING | p95 Latency > 500 ms | Flag warning badge |
| `AVG_LATENCY_EXCEEDED` | CRITICAL | Avg Latency > 400 ms | Halt rollout |
| `HEALTH_CHECK_FAILURE` | CRITICAL | Probe returns HTTP 500/503 | Halt rollout immediately |

*All thresholds can be adjusted in the **Health Thresholds** settings page.*

---

## 6. Environment Variables Setup

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/rolloutguard
CLIENT_URL=http://localhost:5173
USE_IN_MEMORY_DB=auto
```

> **Zero-Config Database**: If MongoDB is not running locally on port 27017, the backend automatically spins up an embedded in-memory MongoDB instance (`MongoMemoryServer`) so that testing and demonstrations work seamlessly out-of-the-box.

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=/api
```

---

## 7. Installation & Running Locally

### Step 1: Install Dependencies
```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### Step 2: Seed Sample Data
Populate the database with sample applications, historical releases, metric snapshots, and events:
```bash
cd backend
npm run seed
```

### Step 3: Start the Backend Server
```bash
cd backend
npm run dev
# Server listens on http://localhost:5000
# Health check available at: http://localhost:5000/api/health
```

### Step 4: Start the Frontend Application
```bash
cd frontend
npm run dev
# Vite dev server runs at http://localhost:5173
```

Open your browser to `http://localhost:5173`.

---

## 8. Running Automated Tests

RolloutGuard includes real Jest and Supertest integration tests covering all 12 platform requirements:
1. Creating a release with valid input succeeds.
2. Invalid release data is rejected.
3. A healthy release completes successfully through all stages to 100%.
4. An error-spike scenario is detected as unhealthy.
5. A slow-API scenario triggers the relevant p95 latency threshold.
6. An unhealthy staged rollout stops progressing.
7. Rollback updates the simulated release state and records a timeline event.
8. A healthy release does not incorrectly trigger rollback.
9. Invalid state transitions are rejected.
10. Missing releases return the correct 404 error response.
11. The dashboard aggregates stored data correctly.
12. Configured thresholds influence health evaluation.

Execute the test suite:
```bash
cd backend
npm test
```

Expected output:
```
PASS tests/rolloutguard.test.js
  RolloutGuard Test Suite
    √ 1. Creating a release with valid input succeeds
    √ 2. Invalid release data is rejected
    √ 3. A healthy release completes successfully through all stages to 100%
    √ 4. An error-spike scenario is detected as unhealthy
    √ 5. A slow-API scenario triggers the relevant p95 latency threshold
    √ 6. An unhealthy staged rollout stops progressing
    √ 7. Rollback updates the simulated release state and records a timeline event
    √ 8. A healthy release does not incorrectly trigger rollback
    √ 9. Invalid state transitions are rejected
    √ 10. Missing releases return the correct 404 error response
    √ 11. The dashboard aggregates stored data correctly
    √ 12. Configured thresholds influence health evaluation

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
```

---

## 9. End-to-End Workflow Verification

To verify the complete platform lifecycle:

1. **Dashboard Overview**:
   - Open `http://localhost:5173`. Inspect summary cards, active releases, and trend charts.
2. **Launch Healthy Release**:
   - Navigate to **Simulation Lab**.
   - Select **Healthy Release**, click **Launch Simulation Run**.
   - Advance through stages (5% → 25% → 50% → 100%).
   - Verify that the release completes and is promoted to stable version.
3. **Trigger Error Spike**:
   - Select **Error Spike** in Simulation Lab.
   - Click **Launch Simulation Run**.
   - Observe that at the canary stage, error rate spikes to ~18.5%.
   - Notice the rollout is automatically halted and marked `Degraded`.
4. **Inspect Health Violation**:
   - Click **Inspect Release Details**.
   - Check the exact failing rule evidence (`ERROR_RATE_EXCEEDED: Candidate error rate of 18.5% exceeds critical threshold of 5%`).
5. **Execute Rollback**:
   - Click **Execute Rollback**, enter an audit justification, and confirm.
   - Notice the timeline records `ROLLBACK_EXECUTED`.
   - Observe the green recovery banner showing candidate traffic cut to 0% and error rate normalized to baseline (0.8%).
6. **Persistence**:
   - Refresh the browser; all releases and timeline events remain persisted in MongoDB.

---

## 10. Deployment Guidelines

### Backend (Render / Railway / Fly.io / Heroku)
- Set environment variables:
  - `NODE_ENV=production`
  - `PORT=5000`
  - `MONGODB_URI=<your-mongodb-atlas-connection-string>`
  - `CLIENT_URL=https://<your-frontend-domain>`
- Start command: `npm start`

### Frontend (Vercel / Netlify / Cloudflare Pages)
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_BASE_URL=https://<your-backend-domain>/api`

---

## 11. License

MIT License. Designed and built as a deployment safety and release monitoring platform.
