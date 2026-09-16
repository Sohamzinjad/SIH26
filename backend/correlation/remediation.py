from typing import List, Optional, Dict
from backend.schemas.finding import FindingDTO, AttackPathDTO, SingleFixRecommendation

SEV_SCORES = {"critical": 30, "high": 15, "medium": 5, "low": 2}

def compute_single_key_fix(
    findings: List[FindingDTO],
    attack_paths: List[AttackPathDTO]
) -> Optional[SingleFixRecommendation]:
    """
    Identifies the single highest-impact remediation command that invalidates
    the largest number of active attack chains.
    """
    if not attack_paths:
        return None

    finding_map = {f.rule_id: f for f in findings}
    
    # Map each candidate break rule to the paths it would dismantle
    rule_to_broken_paths: Dict[str, List[AttackPathDTO]] = {}

    for path in attack_paths:
        target_fix = path.break_rule_id
        if target_fix not in rule_to_broken_paths:
            rule_to_broken_paths[target_fix] = []
        rule_to_broken_paths[target_fix].append(path)

    if not rule_to_broken_paths:
        return None

    # Score each candidate fix by number and severity of paths broken
    best_rule_id = None
    best_score = -1.0
    best_paths: List[AttackPathDTO] = []

    for rule_id, paths in rule_to_broken_paths.items():
        score = sum(SEV_SCORES.get(p.severity, 5) for p in paths) + len(paths) * 10
        if score > best_score:
            best_score = score
            best_rule_id = rule_id
            best_paths = paths

    if not best_rule_id:
        return None

    target_finding = finding_map.get(best_rule_id)
    remediation_cmd = target_finding.remediation if target_finding else "Apply hardening control"
    rule_title = target_finding.title if target_finding else best_rule_id
    
    # Pick the 'why' rationale from the most severe broken path
    primary_why = best_paths[0].break_why if best_paths else "Breaks primary prerequisite step."

    broken_names = [p.name for p in best_paths]
    remaining_count = max(0, len(attack_paths) - len(best_paths))

    return SingleFixRecommendation(
        rule_id=best_rule_id,
        rule_title=rule_title,
        remediation=remediation_cmd or "",
        paths_broken_count=len(best_paths),
        paths_broken_names=broken_names,
        remaining_paths_count=remaining_count,
        impact_score=round(best_score, 1),
        why=primary_why
    )
