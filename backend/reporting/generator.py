from datetime import datetime
from typing import List, Optional
from jinja2 import Template
from backend.schemas.finding import FindingDTO, AttackPathDTO, SingleFixRecommendation
from backend.models.device import Audit, Device

HTML_REPORT_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Compliance Audit Report - {{ hostname }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0d1117;
            color: #c9d1d9;
            margin: 0;
            padding: 40px;
            line-height: 1.6;
        }
        .container {
            max-width: 1100px;
            margin: 0 auto;
            background: #161b22;
            padding: 40px;
            border-radius: 12px;
            border: 1px solid #30363d;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #30363d;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            color: #58a6ff;
            font-size: 24px;
        }
        .badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
        }
        .score-box {
            font-size: 32px;
            font-weight: bold;
            padding: 10px 24px;
            border-radius: 8px;
            background: #21262d;
        }
        .score-good { color: #3fb950; border: 1px solid #238636; }
        .score-warn { color: #d29922; border: 1px solid #9e6a03; }
        .score-bad { color: #f85149; border: 1px solid #da3633; }
        
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #21262d;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #30363d;
            text-align: center;
        }
        .stat-card .val { font-size: 24px; font-weight: bold; margin-top: 5px; }
        
        .recommendation-card {
            background: #1f2a37;
            border: 1px solid #1f6feb;
            border-left: 6px solid #58a6ff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .recommendation-card h3 {
            margin-top: 0;
            color: #79c0ff;
        }
        pre {
            background: #0d1117;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #30363d;
            overflow-x: auto;
            color: #7ee787;
            font-family: monospace;
            font-size: 13px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #30363d;
        }
        th {
            background: #21262d;
            color: #8b949e;
            font-size: 13px;
            text-transform: uppercase;
        }
        .sev-critical { color: #f85149; font-weight: bold; }
        .sev-high { color: #ff7b72; }
        .sev-medium { color: #d29922; }
        .sev-low { color: #a5d6ff; }
        .status-pass { color: #3fb950; font-weight: 600; }
        .status-fail { color: #f85149; font-weight: 600; }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #8b949e;
            border-top: 1px solid #30363d;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1>NATIONAL SECURITY AUDIT &bull; COMPLIANCE REPORT</h1>
                <p style="margin: 5px 0 0 0; color: #8b949e;">Device: <strong>{{ hostname }}</strong> &bull; Vendor: <strong>{{ vendor }}</strong> &bull; File: <strong>{{ filename }}</strong></p>
                <p style="margin: 5px 0 0 0; color: #8b949e;">Audit Date: {{ audit_date }}</p>
            </div>
            <div class="score-box {% if score >= 85 %}score-good{% elif score >= 60 %}score-warn{% else %}score-bad{% endif %}">
                {{ score }}%
            </div>
        </div>

        <div class="stat-grid">
            <div class="stat-card">
                <div>Passing Checks</div>
                <div class="val" style="color: #3fb950;">{{ pass_count }}</div>
            </div>
            <div class="stat-card">
                <div>Failed Checks</div>
                <div class="val" style="color: #f85149;">{{ fail_count }}</div>
            </div>
            <div class="stat-card">
                <div>Total Rules Evaluated</div>
                <div class="val">{{ total_count }}</div>
            </div>
            <div class="stat-card">
                <div>Correlated Threat Chains</div>
                <div class="val" style="color: #ff7b72;">{{ attack_paths|length }}</div>
            </div>
        </div>

        {% if single_fix %}
        <div class="recommendation-card">
            <h3>&#9889; Key Strategic Remediation: Single Fix with Maximum Impact</h3>
            <p><strong>Fix Rule:</strong> {{ single_fix.rule_title }} (<code>{{ single_fix.rule_id }}</code>)</p>
            <p><strong>Threat Impact:</strong> Invalidates <strong>{{ single_fix.paths_broken_count }}</strong> attack chains at once (Leaves only {{ single_fix.remaining_paths_count }} remaining).</p>
            <p><strong>Rationale:</strong> {{ single_fix.why }}</p>
            <p><strong>Remediation Syntax:</strong></p>
            <pre>{{ single_fix.remediation }}</pre>
        </div>
        {% endif %}

        {% if attack_paths %}
        <h2>Identified Attack Paths & Exploit Chains</h2>
        {% for path in attack_paths %}
        <div style="background: #21262d; border: 1px solid #30363d; border-radius: 8px; padding: 16px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0; color: #f85149;">&#9888; {{ path.name }}</h4>
                <span class="badge" style="background: #b62324; color: #fff;">{{ path.severity|upper }}</span>
            </div>
            <p style="margin: 10px 0; font-size: 14px; color: #8b949e;">{{ path.narrative }}</p>
            <p style="margin: 0; font-size: 13px;"><strong>Prerequisite Breaches:</strong> <code>{{ path.finding_rule_ids|join(", ") }}</code></p>
        </div>
        {% endfor %}
        {% endif %}

        <h2>Detailed Compliance Control Findings</h2>
        <table>
            <thead>
                <tr>
                    <th>Rule ID</th>
                    <th>Framework</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Evidence Line</th>
                </tr>
            </thead>
            <tbody>
                {% for f in findings %}
                <tr>
                    <td><code>{{ f.rule_id }}</code></td>
                    <td>{{ f.framework }}</td>
                    <td>
                        {{ f.title }}
                        {% if f.status == 'fail' and f.remediation %}
                        <div style="margin-top: 6px; font-size: 12px; color: #8b949e;">
                            <em>Fix:</em> <code>{{ f.remediation|replace("\n", " ") }}</code>
                        </div>
                        {% endif %}
                    </td>
                    <td class="sev-{{ f.severity }}">{{ f.severity|upper }}</td>
                    <td class="status-{{ f.status }}">{{ f.status|upper }}</td>
                    <td>
                        {% if f.evidence and f.evidence.line_start %}
                        Line {{ f.evidence.line_start }}{% if f.evidence.line_end and f.evidence.line_end != f.evidence.line_start %}-{{ f.evidence.line_end }}{% endif %}
                        {% else %}
                        -
                        {% endif %}
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>

        <div class="footer">
            <p>Generated by SIH26155 AI-Driven Multi-Vendor Compliance Auditor &bull; Air-Gapped High Assurance Architecture</p>
        </div>
    </div>
</body>
</html>
"""

def generate_html_report(
    audit: Audit,
    device: Optional[Device],
    findings: List[FindingDTO],
    attack_paths: List[AttackPathDTO],
    single_fix: Optional[SingleFixRecommendation]
) -> str:
    template = Template(HTML_REPORT_TEMPLATE)
    return template.render(
        hostname=device.hostname if device else "Device",
        vendor=device.vendor if device else "Multi-Vendor",
        filename=audit.filename,
        audit_date=audit.started_at.strftime("%Y-%m-%d %H:%M:%S UTC") if audit.started_at else datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        score=audit.score,
        pass_count=audit.pass_count,
        fail_count=audit.fail_count,
        total_count=audit.total_count,
        findings=findings,
        attack_paths=attack_paths,
        single_fix=single_fix
    )
