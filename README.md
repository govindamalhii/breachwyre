# 🛡️ Breachwyre — AI-Native Cyber Incident Response Platform

> **Enterprise-grade** cyber incident response platform featuring AI triage, cryptographic evidence preservation, RBAC access control, and expert routing.

[![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)](https://mysql.com)
[![Security](https://img.shields.io/badge/Security-OWASP%20Top%2010-red)](https://owasp.org)

---

## 📐 Architecture Overview

```
breachwyre/
├── backend/                  # Node.js + Express Hardened API
│   ├── config/
│   │   ├── db.js             # MySQL connection pool (mysql2/promise)
│   │   └── redis.js          # Redis client (sessions, rate-limiting)
│   ├── middleware/
│   │   ├── auth.js           # JWT verification + RBAC role enforcement
│   │   ├── rateLimiter.js    # express-rate-limit (5 req/15min for auth)
│   │   └── sanitize.js       # OWASP XSS/injection sanitizer
│   ├── routes/
│   │   ├── auth.routes.js    # Register, login, /me — bcrypt salt-12
│   │   ├── incident.routes.js# Panic button, file upload, SHA-256 hash
│   │   ├── expert.routes.js  # Triage queue, case notes, status updates
│   │   └── ai.routes.js      # NLP keyword classifier → severity scoring
│   ├── utils/
│   │   └── cryptoHasher.js   # Streaming SHA-256 (no memory overload)
│   ├── uploads/              # Encrypted evidence storage (UUID-renamed)
│   └── server.js             # Helmet, CORS, morgan, global error handler
├── frontend/                 # React 18 + Tailwind CSS + Framer Motion
│   └── src/
│       ├── components/
│       │   ├── PanicButton.jsx       # Glowing emergency report button
│       │   ├── IncidentForm.jsx      # Multi-step incident + evidence form
│       │   ├── ExpertDashboard.jsx   # Expert triage workbench
│       │   ├── UserDashboard.jsx     # Victim incident tracker
│       │   └── AIGuidanceWidget.jsx  # Containment recommendation display
│       ├── pages/
│       │   ├── Home.jsx              # Landing page
│       │   ├── Login.jsx             # Auth (sign in / register)
│       │   └── Dashboard.jsx         # Role-aware dashboard shell
│       ├── api.js                    # Axios instance + API endpoints
│       └── AuthContext.jsx           # Global auth state + JWT management
├── java-tools/               # Standalone JDK 17 Forensic CLI Utilities
│   ├── FileVerifier.java     # SHA-256 chain-of-custody verification
│   ├── LogAnalyzer.java      # Server log threat pattern scanner
│   └── README.md             # Java tools usage guide
└── schema.sql                # Complete MySQL database schema
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+ running locally
- Redis (optional — app boots without it in dev mode)
- JDK 17+ (for Java forensic tools only)

### 1. Database Setup
```bash
mysql -u root -p < schema.sql
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret
npm install
npm run dev        # starts on http://localhost:3001
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:5173
```

### 4. Java Forensic Tools
```bash
cd java-tools
javac FileVerifier.java
javac LogAnalyzer.java

# Verify a file's SHA-256 integrity:
java FileVerifier /path/to/evidence.zip abc123...expectedhash...

# Scan server logs for threats:
java LogAnalyzer /path/to/access.log --report
```

---

## 🔐 Security Architecture

| Layer             | Implementation                                        |
|-------------------|-------------------------------------------------------|
| Authentication    | JWT (7-day expiry) signed with HS256 + bcrypt-12      |
| Authorization     | RBAC: `user` / `expert` / `admin` role enforcement    |
| Injection Defense | mysql2 parameterized queries (prepared statements)    |
| XSS Prevention    | express-validator + xss sanitizer on all body fields  |
| Rate Limiting     | 5 auth attempts / 15 min per IP via express-rate-limit|
| File Security     | UUID rename, MIME validation, 50MB limit, SHA-256 pre-storage |
| Transport         | TLS 1.3 + HSTS + Helmet.js security headers           |
| Evidence Integrity| Streaming SHA-256 (FIPS 180-4) — no memory load       |
| At-Rest Encryption| AES-256-GCM (key per environment)                     |

### OWASP Top 10 Coverage
- ✅ **A01 Broken Access Control** — JWT middleware + role checks on every route
- ✅ **A03 Injection** — 100% parameterized queries
- ✅ **A04 Insecure Design** — UUID file naming, hash before disk write
- ✅ **A07 Auth Failures** — bcrypt salt-12, login rate limiting, HTTPS-only tokens
- ✅ **A05 Security Misconfiguration** — Helmet.js CSP, X-Frame-Options, HSTS

---

## 🤖 AI Triage Engine

The AI classification engine (`/api/ai/classify`) uses a keyword-based NLP classifier:

| Severity | Example Keywords | Containment Response |
|----------|-----------------|---------------------|
| 🔴 CRITICAL | ransomware, encrypted files, lateral movement | Isolate systems, preserve memory dumps, contact law enforcement |
| 🟠 HIGH | phishing, credential theft, unauthorized access | Change passwords, enable MFA, quarantine processes |
| 🟡 MEDIUM | suspicious email, port scan, account lockout | Document activity, run AV scan, review access logs |
| 🟢 LOW | spam, slow system, missing files | Log for records, run routine checks, patch software |

Confidence scores are calculated from keyword match density (0–99%).

---

## 🔬 Forensic Chain-of-Custody

Every uploaded evidence file goes through this pipeline:
```
File Upload → UUID Rename → SHA-256 Stream Hash → MySQL Record → Encrypted Storage
```

The SHA-256 hash can be independently verified via:
```bash
java FileVerifier <stored_filename> <expected_sha256>
# Output: [VALID] or [TAMPERED]
```

---

## 🌐 API Reference

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create user account (bcrypt-12 hash) |
| POST | `/login` | Authenticate + get JWT token |
| GET | `/me` | Get current user profile |

### Incidents (`/api/incidents`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | User | Create incident (triggers AI triage) |
| GET | `/` | User | List own incidents |
| GET | `/:id` | User | Incident detail with files + notes |
| POST | `/:id/files` | User | Upload evidence (SHA-256 fingerprinted) |
| PATCH | `/:id/status` | Expert | Update status |
| PATCH | `/:id/assign` | Expert | Assign expert |

### Expert Queue (`/api/expert`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/queue` | Expert | Priority-sorted triage queue |
| GET | `/:id` | Expert | Full case detail |
| POST | `/:id/notes` | Expert | Add investigation note |
| PATCH | `/:id/status` | Expert | Update case status |

### AI Triage (`/api/ai`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/classify` | User | NLP severity classification |

---

## 📄 License
Proprietary — Breachwyre Platform © 2026. All rights reserved.
