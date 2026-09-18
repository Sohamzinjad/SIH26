# Governance & Corpus Notes (additive, honest)

## Identity / attribution

- The four mutating governance endpoints — `waive`, `unwaive`, mapping
  `approve`, mapping `reject` — require the configured `SIH26_API_KEY`
  (read once at import from the environment). When a key **is** configured,
  a missing or mismatched key is rejected with **401** before the handler
  body runs, so no mutating effect or audit-trail entry is ever produced.
  When no key is configured (empty/unset `SIH26_API_KEY`) auth is disabled:
  the developer/demo default stays fully open, byte-identical to previous
  behavior. This is entirely opt-in by design.
- Every waiver/approval/rejection action lands a real `AuditTrailEntry`
  row with the attributable actor (`request.waived_by`, `rejected_by`,
  `req.approved_by`) — the trail is genuine persisted state, not a log
  string. So "who can waive/approve" answers: someone presenting the
  configured key (else 401), and the resulting trail is attributable.
- Read endpoints (findings list, pending mappings, fleet summary) stay
  open for the demo. The fleet batch **upload** endpoint is likewise part
  of the open demo surface — API-key protection is deliberately scoped to
  the governance actions listed above, not retrofitted onto every write.

## Zip hardening

- `_collect_files` (fleet batch zip ingestion) enforces two real guards:
  a cumulative **decompressed-size cap of 50 MB** (`ZIP_SIZE_CAP`) and a
  **member-count cap of 5000** (`ZIP_MAX_MEMBERS`). An archive that trips
  either is rejected with **400** before its oversized/many-member contents
  are materialized in memory — the guards live in the loop, so no partial
  giant string is ever held.
- Each member is read exactly **once** (`data = archive.read(member)`),
  accumulated into `cumulative_size`, and only appended after the cap
  check passes. The pre-existing additive filename-traversal sanitization
  (`fname = member.rsplit("/", 1)[-1]`) stays in place.

## Corpus honesty (known coverage gap — flagged, not hidden)

- The held-out REAL-WORLD batch corpus is **Cisco-only**, sourced from
  Batfish. Every real-world regression/held-out file in the repo is Cisco
  IOS config.
- FortiOS and unknown-vendor paths are exercised by **synthetic fixtures**,
  not real-world files. There is no real-world FortiOS (or third-vendor)
  held-out corpus yet, so vendor-agnostic evidence for those paths is
  weaker than for Cisco and should be read as such — this gap is real and
  is stated here openly rather than papered over.