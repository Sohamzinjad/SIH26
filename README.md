# TRINETRA (त्रिनेत्र) — SIH26155
## AI-Driven Multi-Vendor Network Security Compliance Auditor

[![Built for NTRO](https://img.shields.io/badge/Sponsor-NTRO-blue.svg)](https://www.sih.gov.in/)
[![Problem Statement](https://img.shields.io/badge/SIH%202026-SIH26155-orange.svg)](https://www.sih.gov.in/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12+-green.svg)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Tailwind%20%7C%20Vite-cyan.svg)](https://vitejs.dev/)
[![Compliance Standards](https://img.shields.io/badge/Frameworks-CIS%20%7C%20NIST%20800--53%20%7C%20DISA%20STIG-purple.svg)](https://www.cisecurity.org/)
[![Audit Trail](https://img.shields.io/badge/Audit%20Trail-SHA--256%20Cryptographic%20Chain-gold.svg)]()
[![Air-Gapped Safe](https://img.shields.io/badge/Security-Air--Gapped%20Safe-emerald.svg)]()

> **"AI proposes, deterministic code decides, humans approve novel cases."**  
> A high-assurance, defense-grade multi-vendor network security compliance auditor and exploit correlator built for the **National Technical Research Organisation (NTRO)** under **Smart India Hackathon 2026**.

---

## 📑 Table of Contents
1. [Executive Summary & Core Philosophy](#-executive-summary--core-philosophy)
2. [Key Innovations & Differentiators](#-key-innovations--differentiators)
3. [Supported Vendors & Compliance Frameworks](#-supported-vendors--compliance-frameworks)
4. [Empirical Accuracy & Corpus Benchmarks](#-empirical-accuracy--corpus-benchmarks)
5. [Architectural Decision: Deterministic Rules over Probabilistic LLMs](#-architectural-decision-why-deterministic-rules-not-an-llm-is-the-core)
6. [Latency & Fleet Scaling Benchmarks](#-latency--fleet-scaling-benchmarks-measured)
7. [Enterprise Web Interface & Visual Capabilities](#-enterprise-web-interface--visual-capabilities)
8. [Comprehensive REST API Reference](#-comprehensive-rest-api-reference)
9. [Repository Architecture](#-repository-architecture)
10. [Quick Start & Setup Guide](#-quick-start--setup-guide)

---

## 🛡️ Executive Summary & Core Philosophy

In mission-critical, defense, and intelligence operations (such as NTRO), network infrastructure compliance cannot rely on black-box, probabilistic AI models that hallucinate syntax or generate inconsistent verdicts.

**TRINETRA** resolves the tension between multi-vendor flexibility and defense-grade certifiability:
1. **Deterministic Core:** Known network operating systems (**Cisco IOS/IOS-XE**, **Fortinet FortiOS**) are parsed via exact state machines that pinpoint violations to specific line numbers and snippets.
2. **AI Strictly Constrained:** Local AI (**Ollama / `llama3.2:3b`**) is invoked *only* when an unknown or proprietary white-box NOS syntax is encountered.
3. **Analyst in the Loop:** The security analyst inspects raw syntax side-by-side with proposed AST schemas and formally approves or rejects the mapping.
4. **Dialect Fingerprint Caching:** Approved schemas are hashed via SHA-256 and stored in an immutable cache; all subsequent devices running that dialect parse deterministically with zero model latency.
5. **Tamper-Evident Governance:** Every audit result, mapping approval, and compliance waiver is sealed in a cryptographic SHA-256 forward-linked chain to guarantee non-repudiation.

---

## 🌟 Key Innovations & Differentiators

### 1. Air-Gapped High-Assurance Architecture
Designed for air-gapped secure enclaves where external API connections (OpenAI, Anthropic, cloud SaaS) are prohibited by military doctrine:
- Completely local execution with **Ollama (`llama3.2:3b`)** and offline heuristic fallbacks.
- **Dual-Database Resilience:** Automatically binds to enterprise PostgreSQL, with automatic zero-config fallback to SQLite for rapid field deployments or portable laptops.

### 2. Attack-Path Threat Correlation & Strategic "Single Key Fix"
Rather than dumping 50+ disconnected compliance failures on an overworked security team, TRINETRA's graph correlator models how violations combine into real-world exploit chains (e.g., *Cleartext Telnet + Missing VTY ACL + Default SNMP Community $\rightarrow$ Privileged Administrative Takeover*).

**The Key Differentiator — Single Key Fix Algorithm:**
The correlation engine calculates which single remediation command dismantles the maximum number of active threat chains across the device or fleet, providing network commanders with their highest-leverage first move.

### 3. Multi-Device Fleet Batch Auditing & Configuration Drift
- **Fleet Bulk Ingestion:** Upload dozens of configs simultaneously or submit compressed `.zip` archives. Hardened with zip-bomb safeguards (50MB size cap, 5,000 member limit) and path traversal protection.
- **Cross-Device Analytics:** Computes real aggregate failure frequencies, common threat chains across devices, and fleet-wide posture scores.
- **Longitudinal Drift Tracking:** Evaluates successive audits of a device and classifies every rule as `same`, `improved`, `worsened`, `new`, or `disappeared`, calculating an overall drift velocity score.

### 4. Cryptographic Tamper-Evident Audit Trail
- Non-repudiation is enforced through a **forward-linked SHA-256 hash chain** across all administrative events (audits, AI mapping approvals, mapping rejections, waiver grants, waiver revocations).
- Each record's hash incorporates canonical sorted JSON fields, timestamp, actor, and the previous record's hash ($H_n = \text{SHA256}(\text{Payload}_n \parallel H_{n-1})$).
- The `/api/audit-trail/verify` endpoint walks the entire ledger in $O(N)$ time to mathematically verify chain integrity and detect any out-of-band database tampering.

### 5. Offline CVE Reference Enrichment
- Failed compliance findings are automatically enriched with verified National Vulnerability Database (NVD) CVE identifiers (e.g., Cisco SNMP remote execution vulnerability `CVE-2017-6742`, CVSS 9.8).
- Powered by a committed, deterministic offline CVE cache (`cve_cache.json`), ensuring **zero external network queries** while providing analysts with rich vulnerability context and advisory links.

### 6. Formal Waiver & Governance Workflow
- Analysts can grant time-stamped compliance exceptions for operational necessities (e.g., legacy subnet with approved compensating controls).
- Every waiver requires mandatory justification, records the authorizing operator, updates finding status, and writes an immutable entry to the cryptographic audit trail.

### 7. Non-Naive Severity-Weighted Scoring
$$\text{Compliance Score} = \left(\frac{\sum \text{Weights of Passing Checks}}{\sum \text{Weights of All Evaluated Checks}}\right) \times 100$$
- **Critical (Weight 20):** Telnet enabled, default SNMP community string, cleartext administrative secrets.
- **High (Weight 10):** Missing VTY ACL, remote syslog unconfigured, HTTP management active.
- **Medium (Weight 5):** Inactivity timeout $> 10$ minutes, plaintext service passwords.
- **Low (Weight 2):** Missing logging timestamps, finger service active.

---

## 🛡️ Supported Vendors & Compliance Frameworks

### Supported Network Hardware & Operating Systems:
| Vendor / OS | Parsing Strategy | Line-Level Evidence |
| :--- | :--- | :--- |
| **Cisco IOS / IOS-XE** | Deterministic line-state machine | Exact starting/ending line numbers & code snippet |
| **Fortinet FortiOS** | Deterministic block-state parser | Exact block directives and hierarchical statements |
| **White-Box / Proprietary NOS** | AI proposal + Human review + Cached dialect | Structural AST mapping with heuristic fallback |

### Implemented Compliance Standards:
- **CIS Benchmarks:**
  - *CIS Cisco IOS Benchmark v4.0.0* (18 automated checks covering AAA, banners, NTP, syslog, SSH, SNMP, VTY ACLs)
  - *CIS Fortinet FortiOS Benchmark* (5 automated checks covering admin ports, password policies, remote syslog)
- **NIST SP 800-53 Rev 5:**
  - `AC-2` (Account Management)
  - `AC-3` (Access Enforcement & Port Restrictions)
  - `AC-12` (Session Termination / Inactivity Timeouts)
  - `AC-17` (Remote Access Protection)
  - `AU-2` (Audit Events & Centralized Syslog)
  - `IA-2` (Centralized AAA Identification & Multi-Factor)
  - `IA-5` (Cryptographic Authenticator & Salted Password Hashing)
- **DISA STIGs (DoD Network Device SRG):**
  - `STIG-V-202007` (10-Minute Interactive Inactivity Lock)
  - `STIG-V-202065` (FIPS-Approved Type 8/9 Password Hashing)
  - `STIG-V-202049` (Prohibition of Insecure Ports & Cleartext Protocols)

---

## 📊 Empirical Accuracy & Corpus Benchmarks

### 1. Held-Out Real-World Corpus (Sanitized Batfish Enterprise Data)
Evaluated on an independent, held-out corpus of five enterprise Cisco IOS `show running-config` files from the public [Batfish Example Network](https://github.com/batfish/batfish) (Apache-2.0). Ground truth was independently derived by manual inspection:

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
  critical  detection=100.0%  FPR=  0.0%   (tp=1  tn=13 fp=0 fn=0)
  high      detection=100.0%  FPR=  0.0%   (tp=9  tn=23 fp=0 fn=0)
  medium    detection=100.0%  FPR=  0.0%   (tp=0  tn= 5 fp=0 fn=0)
  low       detection=100.0%  FPR=  0.0%   (tp=5  tn= 1 fp=0 fn=0)
===============================================================
```

### 2. Labelled Pipeline Corpus (Including Partially-Compliant Scenarios)
Tested against 8 curated reference configurations with mixed compliance postures:

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
===========================================================
```

---

## 🔍 Architectural Decision: Why Deterministic Rules (Not an LLM) is the Core

For an intelligence and defense agency, configuration compliance auditing demands **provable reproducibility and zero hallucination**:

| Requirement | Deterministic Structural Parsing (TRINETRA Core) | Pure LLM-Based Parsing |
| :--- | :--- | :--- |
| **Auditability** | Every finding maps to deterministic regex transitions & exact lines | Probabilistic output; cannot provide legal guarantee |
| **Reproducibility** | $100\%$ identical output for identical input every single run | Subject to temperature, sampling variance, model updates |
| **CLI Grammar Fidelity** | Hardened state machine understands vendor-specific subtleties | Frequently invents or misidentifies CLI flags and contexts |
| **Air-Gap Performance** | Sub-millisecond execution ($<0.5\text{ ms}$ per device) | Requires heavy GPU runtime; $\sim 10\text{ s}$ per device |
| **Safety in Defense** | Fully certifiable against CIS and DISA STIG benchmarks | Non-deterministic behavior introduces vulnerability blind spots |

**Role of the LLM in TRINETRA:**
- **AI proposes:** Local LLM runs *only* on novel, unmapped white-box configurations to suggest structural syntax mappings.
- **Deterministic code decides:** All compliance rules and scoring formulas execute deterministically on normalized data.
- **Humans approve novel cases:** Security analysts verify the schema before any dialect is cached.

---

## ⏱️ Latency & Fleet Scaling Benchmarks (Measured)

Empirically measured via `backend/tests/benchmark_latency.py`:

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

- **Deterministic & Fingerprint-Cached Paths:** Sub-millisecond per device, enabling thousands of devices to be audited in seconds.
- **AI Path Scoped to Novelty:** The $\sim 10\text{ s}$ AI processing overhead is incurred at most once per unknown dialect family, amortizing to near-zero across fleet operations.

---

## 💻 Enterprise Web Interface & Visual Capabilities

Built with React 18, Vite, and Tailwind CSS, the user interface delivers a defense-grade operational experience:

- **Landing Terminal (`LandingView`):** Interactive introductory dashboard showcasing TRINETRA’s defense architecture, live stats, quick test presets, and mission tenets.
- **Executive Posture (`DashboardView`):** Fleet compliance average, severity distribution charts, critical exploit chain alerts, and recent audit activity.
- **Interactive Attack Path Graph (`AttackPathGraph`):** Canvas-rendered directed exploit flow illustrating how minor configuration weaknesses cascade into full administrative compromise.
- **Single Key Fix Hero Banner:** Visual highlight on the highest-leverage remediation command that eliminates the maximum number of attack paths.
- **Fleet Bulk Auditor (`FleetView`):** Multi-file and ZIP archive ingestion, cross-fleet failure aggregations, and top threat chain reports.
- **Device History & Configuration Drift (`DeviceHistoryView`, `DevicesView`):** Chronological audit history, drift velocity score, and rule-by-rule transition tracking (`same`, `improved`, `worsened`, `new`, `disappeared`).
- **Comprehensive Findings Database (`FindingsView`):** Unified multi-dimensional search across framework, severity, status, and waiver state, featuring inline CVE advisories and waiver controls.
- **Human-in-the-Loop Mappings Studio (`MappingsView`):** Side-by-side comparison of raw configuration text and AI-proposed JSON AST with single-click dialect approval and fingerprint caching.
- **Cryptographic Audit Trail (`AuditTrailView`):** Live SHA-256 forward-linked chain viewer with one-click cryptographic integrity verification and interactive tamper testing.
- **Accessibility & Polish:** Smooth cross-fade transitions, collapsible layout utilities, and system-wide reduced motion compliance.

---

## 🔌 Comprehensive REST API Reference

### Audit Operations
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/audit/upload` | Upload single config file or raw text with vendor auto-detection |
| `GET` | `/api/audit/{id}` | Get audit details, findings, attack paths, single key fix, and latency |

### Fleet Batch Auditing
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/fleet/batch` | Bulk upload multiple configs or a `.zip` archive for fleet-wide audit |
| `GET` | `/api/fleet/summary` | Get cross-device aggregated compliance statistics and common exploit chains |

### Devices & Configuration Drift
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/devices/{device_id}/history` | Retrieve chronological audit history and per-rule results for a device |
| `GET` | `/api/devices/{device_id}/drift` | Compare the two latest audits to detect rule-level configuration drift |

### Findings & Governance
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/findings/{audit_id}` | List findings filtered by framework, severity, status; enriched with CVEs |
| `POST` | `/api/findings/{finding_id}/waive` | Grant a formal compliance waiver with justification and audit trail record |
| `POST` | `/api/findings/{finding_id}/unwaive` | Revoke a previously granted compliance waiver |

### AI Mappings & Dialect Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/mappings/pending` | List pending AI normalization proposals for unknown NOS dialects |
| `POST` | `/api/mappings/{id}/approve` | Approve proposal, cache SHA-256 fingerprint, and trigger deterministic audit |
| `POST` | `/api/mappings/{id}/reject` | Reject proposed unknown vendor schema |

### Cryptographic Audit Trail
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/audit-trail/verify` | Recompute SHA-256 hash chain and report ledger integrity or first broken link |
| `POST` | `/api/audit-trail/demo-tamper` | *Demo only* (`AUDIT_TRAIL_DEMO_ENABLED=true`): Tamper with row to test verification |

### Reports, Overview & Health
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/reports/{id}/html` | Generate self-contained, defense-ready printable HTML executive report |
| `GET` | `/api/dashboard/overview` | Get network fleet posture, average score, and active exploit chains |
| `GET` | `/api/health` | Service health, database backend status (Postgres/SQLite), Ollama status |

---

## 📁 Repository Architecture

```
SIh26/
├── backend/
│   ├── ai/                     # Ollama client, prompt templates & dialect cache
│   │   ├── fingerprint_cache.py# Persistent SHA-256 dialect fingerprint storage
│   │   ├── ollama_client.py    # Local Ollama client with fallback handling
│   │   └── prompts.py          # Strict AST extraction prompt templates
│   ├── correlation/            # Threat chain correlation & single key fix engine
│   │   ├── attack_paths.py     # Graph-based exploit path correlator
│   │   └── remediation.py      # Strategic single key fix optimization algorithm
│   ├── enrichment/             # Air-gapped CVE intelligence
│   │   ├── cve.py              # Additive-only CVE reference enrichment
│   │   └── schemas.py          # CVE data transfer objects
│   ├── models/                 # SQLAlchemy ORM models & cryptographic engine
│   │   ├── audit_trail.py      # AuditTrailEntry model
│   │   ├── audit_trail_chain.py# Canonical forward-linked SHA-256 hash chain
│   │   ├── device.py           # Device, Audit, Finding, and AttackPath models
│   │   └── mapping.py          # AIMapping schema proposals & cache models
│   ├── parsers/                # Deterministic parsers & vendor detection
│   │   ├── base.py             # Parser interfaces and structural fallbacks
│   │   ├── cisco_ios.py        # Line-state machine parser for Cisco IOS / IOS-XE
│   │   ├── fortios.py          # Hierarchical block-state parser for Fortinet FortiOS
│   │   └── vendor_detect.py    # Multi-vendor heuristic syntax detector
│   ├── reporting/              # Defense-ready HTML compliance report generator
│   │   └── generator.py        # Print-ready executive report template engine
│   ├── routes/                 # FastAPI REST API endpoints
│   │   ├── audit.py            # Single-device audit upload and detail endpoints
│   │   ├── audit_trail.py      # Cryptographic chain verification & demo-tamper
│   │   ├── dashboard.py        # Executive posture overview endpoints
│   │   ├── devices.py          # Device history and configuration drift endpoints
│   │   ├── findings.py         # Finding listings, CVE enrichment, and waivers
│   │   ├── fleet.py            # Multi-config / ZIP batch audit & fleet analytics
│   │   ├── mappings.py         # Human-in-the-loop schema approval endpoints
│   │   └── reports.py          # HTML report generation endpoints
│   ├── rules/                  # Compliance rules engines
│   │   ├── base.py             # Rule interface and finding factories
│   │   ├── cis_cisco.py        # CIS Cisco IOS Benchmark v4.0.0 rules
│   │   ├── cis_fortios.py      # CIS Fortinet FortiOS Benchmark rules
│   │   ├── disa_stig.py        # DoD DISA STIG network SRG rules
│   │   ├── nist_800_53.py      # NIST SP 800-53 Rev 5 rules
│   │   └── engine.py           # Unified compliance evaluation engine
│   ├── sample_configs/         # Labelled test configs (Cisco, FortiOS, White-Box)
│   ├── schemas/                # Pydantic validation models & neutral DTOs
│   ├── tests/                  # Pytest test suite, latency benchmarks, held-out corpus
│   ├── auth.py                 # API authentication helpers
│   ├── config.py               # Application settings & environment loader
│   ├── cve_cache.json          # Committed air-gapped CVE cache
│   ├── database.py             # Database session manager (PostgreSQL + SQLite)
│   ├── Dockerfile              # Backend container definition
│   ├── main.py                 # FastAPI application root
│   └── requirements.txt        # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                # Fully-typed API client
│   │   ├── components/         # Modular React UI views
│   │   │   ├── AttackPathGraph.tsx   # Interactive visual attack path canvas
│   │   │   ├── AuditDetailView.tsx   # Detailed audit findings & line evidence
│   │   │   ├── AuditTrailView.tsx    # Tamper-evident hash chain verification UI
│   │   │   ├── DashboardView.tsx     # Executive security posture dashboard
│   │   │   ├── DeviceHistoryView.tsx # Longitudinal drift tracking view
│   │   │   ├── DevicesView.tsx       # Fleet hardware inventory table
│   │   │   ├── FindingsView.tsx      # Multi-dimensional findings browser
│   │   │   ├── FleetView.tsx         # Fleet batch upload and cross-device metrics
│   │   │   ├── LandingView.tsx       # Defense terminal landing showcase
│   │   │   ├── MappingsView.tsx      # Human-in-the-loop AI schema studio
│   │   │   ├── Navbar.tsx            # Navigation bar with live counters
│   │   │   ├── Reveal.tsx            # Smooth transition wrapper
│   │   │   └── UploadView.tsx        # Single config upload & preset loader
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx             # Application router and state coordinator
│   │   └── main.tsx            # React root entrypoint
│   ├── package.json            # Frontend dependencies
│   ├── tailwind.config.js      # Styling design system
│   └── vite.config.ts          # Vite build configuration
├── docker-compose.yml          # Container orchestration (API, Web UI, Ollama)
├── .env.example                # Sample environment variables
└── README.md                   # Project documentation
```

---

## 🚀 Quick Start & Setup Guide

### Prerequisites
- **Python:** 3.10 or higher
- **Node.js:** 18 or higher with npm
- **(Optional) Ollama:** For local AI normalization (`ollama run llama3.2:3b`)
- **(Optional) Docker:** For containerized deployment

### 1. Backend Setup (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run automated tests and corpus benchmarks
PYTHONPATH=.. pytest tests/ -v -s

# Start the development server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Health & DB Check:** `http://localhost:8000/api/health`

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- **Web Interface:** `http://localhost:3000` (or `http://localhost:5173`)

### 3. Containerized Deployment (Docker Compose)
```bash
docker-compose up --build
```
---

## 👥 Authors & Acknowledgements
Developed with pride for the **Smart India Hackathon 2026**  
- **Problem Statement:** SIH26155 — AI-Driven Multi-Vendor Network Security Compliance Auditor  
- **Sponsoring Agency:** National Technical Research Organisation (NTRO)  
- **Discipline:** High-Assurance, Deterministic, Air-Gapped Network Defense
