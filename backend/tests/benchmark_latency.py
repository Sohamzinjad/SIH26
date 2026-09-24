"""
Audit latency benchmark: how long does one device take, and does it scale?

Measures three paths on the same real configs:
  1. deterministic_cisco  : known-vendor Cisco IOS parse + audit
  2. structural_fallback  : unknown-vendor structural mapping (Ollama down)
  3. ollama_ai            : unknown-vendor mapping via local Ollama (if reachable)

Prints per-path latency, then a batch/scaling check (N audits in a tight loop)
to answer the "hundreds/thousands of devices" question honestly.
"""
import os
import time
import statistics

from backend.parsers.cisco_ios import CiscoIOSParser
from backend.rules.engine import engine
from backend.ai.ollama_client import ollama_client, extract_structural_mapping
from backend.ai.fingerprint_cache import build_normalized_config_from_mapping

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
CISCO = os.path.join(ROOT, "backend", "sample_configs", "heldout", "as1border1.cfg")
UNKNOWN = os.path.join(ROOT, "backend", "sample_configs", "unknown_whitebox.cfg")
OLLAMA = ollama_client.is_available()


def bench(fn, repeat=5):
    lat = []
    for _ in range(repeat):
        t0 = time.perf_counter()
        fn()
        lat.append((time.perf_counter() - t0) * 1000)
    return round(statistics.median(lat), 2), round(min(lat), 2), round(max(lat), 2)


def main():
    cisco_text = open(CISCO).read()
    unknown_text = open(UNKNOWN).read()
    cisco_parser = CiscoIOSParser()

    def run_cisco():
        cfg = cisco_parser.parse(cisco_text, CISCO)
        engine.audit(cfg)

    def run_structural():
        prop = extract_structural_mapping(unknown_text)
        cfg = build_normalized_config_from_mapping(prop, unknown_text, UNKNOWN)
        engine.audit(cfg)

    def run_ollama():
        prop = ollama_client.propose_mapping(unknown_text)
        cfg = build_normalized_config_from_mapping(prop, unknown_text, UNKNOWN)
        engine.audit(cfg)

    print("\n========== AUDIT LATENCY BENCHMARK (per device) ==========")
    med, mn, mx = bench(run_cisco)
    print(f"deterministic cisco parse+audit : median {med:6.1f} ms  (min {mn:5.1f}, max {mx:6.1f})")
    med, mn, mx = bench(run_structural)
    print(f"structural fallback map+audit   : median {med:6.1f} ms  (min {mn:5.1f}, max {mx:6.1f})")
    if OLLAMA:
        med, mn, mx = bench(run_ollama, repeat=2)
        print(f"ollama ai map+audit             : median {med:6.1f} ms  (min {mn:5.1f}, max {mx:6.1f})  [Ollama ONLINE]")
    else:
        print("ollama ai path                    : SKIPPED (Ollama offline)")

    # Scaling check: repeated audits, same cache-free parse each time (worst case)
    print("\n------ scaling (sequential audits, no warm cache) ------")
    for n in (1, 10, 50):
        t0 = time.perf_counter()
        for _ in range(n):
            cfg = cisco_parser.parse(cisco_text, CISCO)
            engine.audit(cfg)
        el = time.perf_counter() - t0
        print(f"  {n:>3} devices  ->  {el*1000:8.1f} ms total  ({el/n*1000:6.2f} ms/device)")
    print("===========================================================\n")


if __name__ == "__main__":
    main()