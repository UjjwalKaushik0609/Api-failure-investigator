from datetime import datetime


def incident_report_agent(state: dict) -> dict:
    issue = state["root_cause_analysis"][0]
    fixes = state["fixes"]
    report = f"""# Incident Report

## Executive Summary
The investigation identified **{issue['root_cause']}** with **{issue['confidence_score']}% confidence** and **{issue['severity']}** severity.

## Timeline
- {datetime.utcnow().isoformat()}Z - Logs submitted for automated investigation.
- {datetime.utcnow().isoformat()}Z - Agents parsed logs, inferred root cause, generated fixes, and scanned security risks.

## Root Cause
{issue['why_it_happened']}

## Evidence
```text
{issue['evidence']}
```

## Affected Services
{', '.join(issue.get('components_affected', []))}

## Business Impact
{issue['impact']}

## Resolution Steps
{chr(10).join(f"- {step}" for step in fixes.get('immediate_fix', []))}

## Lessons Learned
- Preserve high-signal structured logs.
- Connect incidents to known similar failures.
- Validate auth, config, and dependency health before deploys.

## Action Items
{chr(10).join(f"- {step}" for step in fixes.get('preventive_actions', []))}
"""
    return {**state, "incident_report": report}
