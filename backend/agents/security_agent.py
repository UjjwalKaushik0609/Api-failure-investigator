import re


SECRET_PATTERNS = [
    (r"AKIA[0-9A-Z]{16}", "AWS access key exposed"),
    (r"sk-[A-Za-z0-9_-]{20,}", "OpenAI-style API key exposed"),
    (r"(?i)(password|secret|token|api[_-]?key)\s*[:=]\s*['\"]?[^'\"\s]{8,}", "Secret-like value found in logs"),
]


def security_agent(state: dict) -> dict:
    findings = []
    logs = state["logs"]
    for pattern, message in SECRET_PATTERNS:
        if re.search(pattern, logs):
            findings.append({"severity": "CRITICAL", "finding": message, "recommendation": "Rotate the exposed secret and redact logs."})
    if "authorization:" in logs.lower():
        findings.append({"severity": "HIGH", "finding": "Authorization header appears in logs", "recommendation": "Stop logging auth headers."})
    if not findings:
        findings.append({"severity": "LOW", "finding": "No obvious secret exposure detected", "recommendation": "Continue structured redaction."})
    return {**state, "security_findings": findings}
