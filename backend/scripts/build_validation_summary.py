"""Reproducible generator for backend/validation_summary.json.

Reads the PREREGISTERED verdicts file (backend/tests/expected_chain_verdicts.json,
committed before the validating test) and emits a byte-for-byte reproducible JSON
summary describing each attack chain's intended positive/negative behaviour. It does
NOT re-run the engine; the actual engine-vs-verdict agreement is the job of the
pre-registered chain-validation test. This keeps preregistration honest: the summary
derives only from the preregistered intent, never from live engine output.
"""
import datetime
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
VERDICTS_PATH = ROOT / "backend" / "tests" / "expected_chain_verdicts.json"
OUT_PATH = ROOT / "backend" / "validation_summary.json"

METHOD_TEXT = (
    "Pre-registered attack-chain validation. expected_chain_verdicts.json was written "
    "and committed BEFORE the test that checks it (git-history ordering is asserted by "
    "that test). The verdicts are NOT derived from any engine run: each chain's "
    "positive fixture must set exactly its own chain's prerequisite findings (rule "
    "fails >= min_matches), and each negative must be the same config with ONLY the "
    "break_rule_id finding remediated. Verdicts are assertions of intent; file/engine "
    "behavior is only validated against them, never silently adjusted to match."
)


def _load_verdicts() -> dict:
    with open(VERDICTS_PATH) as f:
        return json.load(f)["chains"]


def build_summary() -> None:
    chains = _load_verdicts()

    per_chain = {}
    for chain_id, spec in chains.items():
        fired_pos = sorted(spec["expected_positive_fired"])
        fired_neg = sorted(spec["expected_negative_fired"])
        per_chain[chain_id] = {
            "positive_fixture": spec["positive_fixture"],
            "negative_fixture": spec["negative_fixture"],
            "break_rule_id": spec["break_rule_id"],
            "expected_positive_fired": fired_pos,
            "positive_fires_as_expected": bool(fired_pos),
            "expected_negative_fired": fired_neg,
            "negative_does_not_fire": not fired_neg,
            "break_chain_fix_isolated": fired_neg == [],
        }

    summary = {
        "generated_iso": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "method": METHOD_TEXT,
        "verdicts_source": str(VERDICTS_PATH.relative_to(ROOT)),
        "chain_count": len(per_chain),
        "total_chains_firing_on_positive": sum(
            1 for c in per_chain.values() if c["positive_fires_as_expected"]
        ),
        "all_positives_fire_own_chain_only": all(
            c["positive_fires_as_expected"]
            and len(c["expected_positive_fired"]) == 1
            and c["expected_positive_fired"][0] == chain_id
            for chain_id, c in per_chain.items()
        ),
        "all_negatives_fire_nothing": all(
            c["negative_does_not_fire"] for c in per_chain.values()
        ),
        "all_break_fixes_isolated": all(
            c["break_chain_fix_isolated"] for c in per_chain.values()
        ),
        "chains": per_chain,
    }

    OUT_PATH.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH.relative_to(ROOT)} ({len(per_chain)} chains)")


if __name__ == "__main__":
    build_summary()
