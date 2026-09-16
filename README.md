# SIH26155 — AI-Driven Multi-Vendor Network Security Compliance Auditor (NTRO)

A comprehensive, defense-grade network security compliance auditor built for **Smart India Hackathon 2026 (Problem Statement: SIH26155, Sponsoring Organization: NTRO)**.

---

## 🌟 Core Differentiators & Architecture

1. **Air-Gapped & High-Assurance:** Zero reliance on external proprietary LLMs/cloud APIs for security decisions. Operates completely offline with local Ollama models and deterministic fallback heuristics.
2. **"AI Proposes, Deterministic Code Decides, Humans Approve Novel Cases":**
   - Heuristic & regex state machines for deterministic parsing of known vendors (**Cisco IOS**, **Fortinet FortiOS**).
   - Local AI (Ollama) proposes schema mappings **only for unknown/white-box syntax**.
   - Human analyst signs off on proposed dialect normalizations; approved fingerprints are cached for instantaneous offline recognition.
3. **Multi-Framework Compliance Engine:**
   - **CIS Benchmarks** (Cisco IOS & FortiOS)
   - **NIST SP 800-53 Rev 5** (AC, AU, IA, SC control families)
   - **DISA STIGs** (SRG Network Device controls)
   - Non-naive weighted compliance scoring:
     $$\text{Compliance Score} = \frac{\sum \text{Weights of Passing Checks}}{\sum \text{Weights of All Evaluated Checks}} \times 100$$
4. **Attack-Path Threat Correlation & Strategic Remediation:**
   - Correlates multi-stage vulnerability chains (e.g., *Cleartext VTY + No ACL + Default SNMP $\rightarrow$ Unauthenticated Privileged Takeover*).
   - **Single Key Fix Algorithm:** Identifies the single highest-leverage configuration remediation command that dismantles the maximum number of active threat chains.
5. **Dual-Database Resilience:** Connects to PostgreSQL (Neon DB) by default and falls back seamlessly to SQLite for fully isolated, air-gapped demo runs.

---

## 📊 Measured Corpus Evaluation Metrics

Evaluated across hardened, vulnerable, and white-box device test corpora:
- **True Detection Rate (Recall):** `100.0%`
- **False Positive Rate (FPR):** `0.0%`
- **False Negative Rate (FNR):** `0.0%`
- **Total Controls Validated:** 14 automated baseline rules across CIS/NIST/STIG.

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run automated test suite
PYTHONPATH=.. pytest tests/ -v

# Start FastAPI server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API will be available at: `http://localhost:8000` (Docs: `http://localhost:8000/docs`).

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend UI will run at: `http://localhost:3000`.

### 3. Docker Compose (Full Stack)

```bash
docker-compose up --build
```

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── ai/                 # Ollama client & dialect fingerprint cache
│   ├── correlation/        # Attack chains & single-fix recommendation engine
│   ├── models/             # SQLAlchemy ORM models (Device, Audit, Finding, AttackPath)
│   ├── parsers/            # Base parser, Cisco IOS, FortiOS, and vendor detection
│   ├── reporting/          # Defense-ready HTML compliance report generator
│   ├── routes/             # FastAPI routers (audit, findings, mappings, reports, dashboard)
│   ├── rules/              # CIS, NIST 800-53, and DISA STIG rule definitions
│   ├── sample_configs/     # Labelled test configs (Cisco, FortiGate, Whitebox)
│   ├── schemas/            # Pydantic DTOs & NormalizedConfig schema
│   ├── tests/              # Pytest test suite & labelled corpus benchmarks
│   ├── config.py           # App settings & environment loader
│   ├── database.py         # SQLAlchemy engine with Neon + SQLite fallback
│   ├── Dockerfile
│   ├── main.py             # FastAPI entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # Dashboard, Upload, AuditDetail, Mappings views
│   │   ├── types/          # TypeScript definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

---

## 🛡️ License

Built for Smart India Hackathon 2026.
