# SIH26155 — AI-Driven Multi-Vendor Network Security Compliance Auditor

[![Built for NTRO](https://img.shields.io/badge/Sponsor-NTRO-blue.svg)](https://www.sih.gov.in/)
[![Problem Statement](https://img.shields.io/badge/SIH%202026-SIH26155-orange.svg)](https://www.sih.gov.in/)
[![Python](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12+-green.svg)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Tailwind%20%7C%20Vite-cyan.svg)](https://vitejs.dev/)
[![Compliance Standards](https://img.shields.io/badge/Frameworks-CIS%20%7C%20NIST%20800--53%20%7C%20DISA%20STIG-purple.svg)](https://www.cisecurity.org/)
[![Air-Gapped Safe](https://img.shields.io/badge/Security-Air--Gapped%20Safe-emerald.svg)]()

> **"AI proposes, deterministic code decides, humans approve novel cases."**  
> A high-assurance, defense-grade multi-vendor network security compliance auditor built for **NTRO** (National Technical Research Organisation) under **Smart India Hackathon 2026**.

---

## 📑 Table of Contents
1. [Core Innovations & Differentiators](#-core-innovations--differentiators)
2. [Supported Vendors & Compliance Frameworks](#-supported-vendors--compliance-frameworks)
3. [Corpus Evaluation & Accuracy Metrics](#-corpus-evaluation--accuracy-metrics)
4. [Design Choice: Deterministic Parsing](#-design-choice-why-deterministic-structural-parsing-not-an-llm-is-the-core)
5. [Latency & Scaling (Measured)](#-latency--scaling-measured-not-estimated)
6. [Quick Start & Live Demo](#-quick-start--live-demo)
7. [API Reference](#-api-reference)
8. [Repository Structure](#-repository-structure)

---

## 🌟 Core Innovations & Differentiators

### 1. Air-Gapped High Assurance Architecture
Designed specifically for defense/intelligence deployment environments where public cloud LLMs (OpenAI, Anthropic) are strictly prohibited:
- Runs locally using **Ollama (`llama3.2:3b`)** or built-in offline structural heuristics.
- **Dual-database resilience**: Automatically connects to PostgreSQL (Neon DB) with instant zero-configuration fallback to SQLite when operating in isolated, air-gapped field environments.

### 2. Human-in-the-Loop AI with Persistent Dialect Caching
- **Deterministic First:** Known vendor configurations (**Cisco IOS**, **FortiOS**) are parsed with 100% deterministic, line-exact regex state machines.
- **AI Scoped to Unknowns:** When an unfamiliar or white-box config is uploaded, local AI analyzes the syntax and proposes a structured normalization.
- **Human Approval:** Security analysts review and approve proposed schemas in a side-by-side UI.
- **Dialect Caching:** Approved syntax fingerprints (SHA-256) are stored in cache, allowing all future devices using that white-box dialect to parse deterministically without re-invoking the model.

### 3. Attack-Path Threat Correlation & Strategic Single Fix
Rather than producing a disconnected list of 50+ violations, our correlator links failures into actionable exploit stories (e.g., *Cleartext Telnet + Missing VTY Access-Class + Default SNMP Community $\rightarrow$ Privileged Administrative Takeover*).

**The Key Differentiator — Single Key Fix Algorithm:**
The engine computes which single remediation command dismantles the maximum number of active threat chains at once, giving commanders and network engineers their highest-leverage first move.

### 4. Non-Naive Severity-Weighted Compliance Scoring
$$\text{Compliance Score} = \left(\frac{\sum \text{Weights of Passing Checks}}{\sum \text{Weights of All Evaluated Checks}}\right) \times 100$$
- **Critical:** Weight 20 (e.g. Telnet enabled, default SNMP community)
- **High:** Weight 10 (e.g. Missing VTY ACL, no remote syslog, HTTP enabled)
- **Medium:** Weight 5 (e.g. Inactivity timeout $> 10$ min, plaintext passwords)
- **Low:** Weight 2 (e.g. Logging timestamps, finger service)

---

## 🛡️ Supported Vendors & Compliance Frameworks

### Supported Network Hardware:
| Vendor / OS | Parsing Strategy | Line-Level Evidence |
| :--- | :--- | :--- |
| **Cisco IOS / IOS-XE** | Deterministic line-state machine | Exact line numbers & snippets |
| **Fortinet FortiOS** | Deterministic block-state parser | Exact section & directive lines |
| **White-Box / Unknown NOS** | AI proposal + Analyst approval + Cached dialect | Structural AST mapping |

### Implemented Compliance Frameworks:
- **CIS Benchmarks:**
  - *CIS Cisco IOS Benchmark v4.0.0* (18 automated checks)
  - *CIS Fortinet FortiOS Benchmark* (5 automated checks)
- **NIST SP 800-53 Rev 5:**
  - `AC-2` (Account Management)
  - `AC-3` (Access Enforcement)
  - `AC-12` (Session Termination)
  - `AC-17` (Remote Access Protection)
  - `AU-2` (Audit Events & Centralized Logging)
  - `IA-2` (Centralized AAA Identification)
  - `IA-5` (Cryptographic Authenticator Storage)
- **DISA STIGs (DoD Network Device SRG):**
  - `STIG-V-202007` (10-Minute Interactive Inactivity Lock)
  - `STIG-V-202065` (FIPS-Approved Password Hashing)
  - `STIG-V-202049` (Prohibition of Insecure Ports & Services)

---

## 📊 Corpus Evaluation & Accuracy Metrics

### Held-Out Real-World Corpus (not tuned against)
Beyond the hand-authored pipeline fixtures, the engine is evaluated on an
**independent held-out set**: five unmodified, sanitized Cisco IOS
`show running-config` files from the public [Batfish "Example Network"
(campus topology)](https://github.com/batfish/batfish) (Apache-2.0). These are
real enterprise configs written by the Batfish maintainers, *not* crafted to
fit this project's rules. Ground-truth labels were derived by human reading of
each config's actual text, independently of the engine.

```
================ HELD-OUT (REAL-WORLD) METRICS ================
Configs: 5  (Batfish public Cisco IOS running-configs)
True Positive (expected-pass, got-pass):       15
True Negative (expected-fail, got-fail):       42
False Positive (expected-pass, got-fail):      0
False Negative (expected-fail, got-pass):      0
Detection Rate (Recall):                       100.0%
False Positive Rate (FPR):                     0.0%
False Negative Rate (FNR):                     0.0%
By Severity:
  critical  detection=100.0%  FPR=  0.0%   (tp=1 tn=13 fp=0 fn=0)
  high      detection=100.0%  FPR=  0.0%   (tp=9 tn=23 fp=0 fn=0)
  medium    detection=100.0%  FPR=  0.0%   (tp=0 tn= 5 fp=0 fn=0)
  low       detection=100.0%  FPR=  0.0%   (tp=5 tn= 1 fp=0 fn=0)
===============================================================
```

### Labelled Pipeline Corpus (incl. partially-compliant cases)
The engine is also scored on the labelled corpus covering the *harder* bar of
**partially compliant** configs — not just compliant/non-compliant extremes:

```
================ CORPUS EVALUATION METRICS ================
# Configs: 8
True Detection Rate (Recall): 100.0%
False Positive Rate (FPR):     0.0%
Total Controls Verified:       35
Per Config (score | TP TN FP FN):
  100.0%  4 0 0 0  cisco_compliant.cfg
    0.0%  0 4 0 0  cisco_non_compliant.cfg
   62.1%  5 4 0 0  cisco_partially_compliant.cfg
   71.9%  3 0 0 0  fortios_compliant.cfg
    6.2%  0 3 0 0  fortios_non_compliant.cfg
   46.9%  1 3 0 0  fortios_partially_compliant.cfg
    0.0%  0 4 0 0  unknown_whitebox.cfg
    0.0%  0 4 0 0  unknown_mesh_node.cfg
By Severity Tier:
  critical  detection=100.0%  FPR=  0.0%   (tp=7 tn=10 fp=0 fn=0)
  high      detection=100.0%  FPR=  0.0%   (tp=3 tn=10 fp=0 fn=0)
  medium    detection=100.0%  FPR=  0.0%   (tp=3 tn= 2 fp=0 fn=0)
  low       detection=100.0%  FPR=  0.0%   (tp=0 tn= 0 fp=0 fn=0)
===========================================================
```

`pytest backend/tests/ -v -s` prints both tables live.

### Honest Scope of the Offline Fallback Confidence
The structural fallback's confidence (`0.42` base, `+0.09` per populated signal
category, capped at `0.92`) is a **heuristic, not a statistically calibrated
probability** — there is no labelled human-approval corpus to fit it against
yet. What *is* verified (`backend/tests/test_calibration.py`):
- every value emitted by the fallback is a literal substring of the real config
  text (0 synthetic values; verified 9/9 across unknown-vendor fixtures), and
- it is deterministic across repeated parses.

Interpret confidence as an *ordinal* signal ("more independent evidence found"),
never as a probability of correctness.

---

## 🔍 Design Choice: Why Deterministic Structural Parsing (Not an LLM) is the Core

For a defense/intelligence Security Operations context (NTRO), config
**parsing is deliberately deterministic**, and the LLM is deliberately *not* a
parser. This is a scoped architectural decision, not a technology shortcut:

| Concern | Deterministic structural parsing (chosen) | LLM-based parsing (rejected as core) |
| :--- | :--- | :--- |
| **Auditability** | Every finding traceable to exact line numbers & regex transitions | Probabilistic; same input can yield different output |
| **Reproducibility** | Identical input → identical report, every run (verified by test) | Non-deterministic (temperature/sampling), inconsistent evidence |
| **Vendor fidelity** | State machine encodes the *actual* CLI grammar (Cisco IOS, FortiOS) | Hallucinates syntax that doesn't exist on the device |
| **Air-gap & latency** | Sub-millisecond parsing, no model dependency | Requires model runtime/GPU, ~10s/device locally |
| **Certification** | Rules prove against labeled configs (corpus: 100% recall, 0% FPR) | Behavior changes across model versions |

**Where the LLM *is* used — and where it is not trusted:**
- The LLM runs **only** on *unknown/white-box* dialects the deterministic parsers
  cannot recognize (ostensibly arbitrary NOS).
- It *proposes* a structured mapping. It never decides. A human analyst inspects
  the proposal side-by-side with the raw config and **approves or rejects** it.
- Once approved, the dialect fingerprint is cached; the deterministic pipeline
  re-applies the human-approved mapping to future same-dialect devices without
  ever re-invoking the stochastic layer — and re-derives device identity
  (hostname, interface IPs) fresh from each device's actual config text.

This yields the property that the tagline advertises: **"AI proposes,
deterministic code decides, humans approve novel cases."**

---

## ⏱️ Latency & Scaling (Measured, Not Estimated)

Measured on this repository (`backend/tests/benchmark_latency.py`):

```
========== AUDIT LATENCY BENCHMARK (per device) ==========
deterministic cisco parse+audit : median    0.2 ms  (min   0.2, max    0.4)
structural fallback map+audit   : median    0.5 ms  (min   0.5, max    3.2)
ollama ai map+audit             : median 9832.8 ms  (min 6433.6, max 13232.0)

------ scaling (sequential audits, no warm cache) ------
    1 device   ->   0.8 ms total  (  0.77 ms/device)
   10 devices  ->   5.6 ms total  (  0.56 ms/device)
   50 devices  ->  21.7 ms total  (  0.43 ms/device)
```

- **Deterministic + fingerprint-cache paths scale linearly, sub-millisecond per
  device** — hundreds to thousands of devices audit in seconds (SQLite demo,
  network hop negligible). The only cost roughly linear in config size.
- **The AI path is the bottleneck** (~10 s/device on `llama3.2:3b` on Apple
  Silicon). Because AI is scoped to *first-seen unknown dialects only* and its
  result is cached, batch fleet audits hit the AI path at most once per dialect.
- Latency is also surfaced live per audit: every upload response (and the audit
  trail) carries `mapping_source` (`deterministic_parser` / `structural_fallback`
  / `ollama` / `fingerprint_cache`) and `mapping_latency_ms` / `total_latency_ms`.

---

## 🚀 Quick Start & Live Demo

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose
- (Optional) Local Ollama with `llama3.2:3b`

### 1. Launch Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run full test suite & corpus benchmark
PYTHONPATH=.. pytest tests/ -v -s

# Start the API server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

- **API Documentation (Swagger):** `http://localhost:8000/docs`
- **Health Endpoint:** `http://localhost:8000/api/health`

### 2. Launch Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- **Web Dashboard:** `http://localhost:3000`

### 3. Full-Stack Docker Deployment

```bash
docker-compose up --build
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/audit/upload` | Upload config file or raw text with vendor auto-detection |
| `GET` | `/api/audit/{id}` | Get audit results, findings, attack paths, and single key fix |
| `GET` | `/api/findings/{id}` | Filter findings by framework (`CIS`, `NIST-800-53`, `DISA-STIG`) or severity |
| `GET` | `/api/mappings/pending` | List pending AI normalization proposals for unknown vendors |
| `POST` | `/api/mappings/{id}/approve` | Approve AI mapping, cache fingerprint, and execute deterministic audit |
| `POST` | `/api/mappings/{id}/reject` | Reject proposed unknown vendor schema |
| `GET` | `/api/reports/{id}/html` | Generate print-ready executive compliance HTML report |
| `GET` | `/api/dashboard/overview` | Network fleet posture, average scores, and active exploit chains |
| `GET` | `/api/health` | Service health, database status, and Ollama connectivity |

---

## 📁 Repository Structure

```
SIh26/
├── backend/
│   ├── ai/                 # Ollama client, prompts & dialect cache
│   │   ├── fingerprint_cache.py
│   │   ├── ollama_client.py
│   │   └── prompts.py
│   ├── correlation/        # Threat chain correlation & single key fix engine
│   │   ├── attack_paths.py
│   │   └── remediation.py
│   ├── models/             # SQLAlchemy ORM database models
│   │   ├── audit_trail.py
│   │   ├── device.py
│   │   └── mapping.py
│   ├── parsers/            # Deterministic parsers & vendor detection
│   │   ├── base.py
│   │   ├── cisco_ios.py
│   │   ├── fortios.py
│   │   └── vendor_detect.py
│   ├── reporting/          # Defense-ready HTML compliance report generator
│   │   └── generator.py
│   ├── routes/             # FastAPI REST endpoints
│   │   ├── audit.py
│   │   ├── dashboard.py
│   │   ├── findings.py
│   │   ├── mappings.py
│   │   └── reports.py
│   ├── rules/              # CIS, NIST SP 800-53, and DISA STIG rules
│   │   ├── base.py
│   │   ├── cis_cisco.py
│   │   ├── cis_fortios.py
│   │   ├── disa_stig.py
│   │   ├── engine.py
│   │   └── nist_800_53.py
│   ├── sample_configs/     # Labelled test configs (Cisco, FortiOS, Whitebox)
│   ├── schemas/            # Pydantic DTOs & NormalizedConfig schema
│   │   ├── api.py
│   │   ├── finding.py
│   │   └── neutral_config.py
│   ├── tests/              # Pytest test suite & labelled corpus benchmarks
│   ├── config.py           # Configuration & settings loader
│   ├── database.py         # Database engine with Neon + SQLite fallback
│   ├── Dockerfile
│   ├── main.py             # FastAPI entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Typed API client
│   │   ├── components/     # Dashboard, Upload, AuditDetail, Mappings views
│   │   ├── types/          # TypeScript interface definitions
│   │   ├── App.tsx         # Main application orchestrator
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml      # Multi-container deployment (API, Web, Ollama)
├── .gitignore
└── README.md
```

---

## 🏆 Presentation & Live Demo Highlights

When demonstrating to judges:
1. **Hardened Cisco Preset:** Click the preset button $\rightarrow$ observe $>85\%$ compliance score, green control badges, and zero active attack paths.
2. **Vulnerable Cisco Preset:** Click the preset button $\rightarrow$ observe compliance score $<50\%$, multiple chained attack paths, and the **"Single Key Fix"** hero banner showing how applying `access-class` breaks 3 exploit chains at once.
3. **Unknown White-box Dialect:** Upload custom syntax $\rightarrow$ show how the AI proposes normalization, the analyst inspects raw vs proposed JSON side-by-side, and clicking **Approve** caches the dialect fingerprint for future audits.
4. **Export Executive Report:** Click **Export Auditor Report** to open the print-ready, formatted HTML compliance report.

---

## 👥 Authors & Acknowledgements
Built for **Smart India Hackathon 2026** (Problem Statement: **SIH26155**, Sponsor: **NTRO**).
