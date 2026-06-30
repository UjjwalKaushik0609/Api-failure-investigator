import json
import re

from anthropic import Anthropic

from config import get_settings


settings = get_settings()

ROOT_CAUSES = [
    "JWT Expired", "API Key Missing", "OAuth Failure", "Network Timeout", "DNS Failure", "SSL Error",
    "DB Connection Error", "SQL Exception", "Redis Failure", "Rate Limit", "Memory Leak", "CORS Issue",
    "Kubernetes Pod Crash", "Docker Issue", "Config Error", "Null Pointer", "Missing Package",
]

SYSTEM_PROMPT = (
    "You are a Senior Site Reliability Engineer and Backend Expert with 15 years of experience. "
    "You analyze API failures, logs, and stack traces with extreme precision. You always provide "
    "confidence scores, cite exact evidence from logs, and explain your reasoning step by step like "
    "a detective solving a case. Never guess - only conclude from evidence."
)


def _heuristic_analysis(logs: str, parsed: dict) -> list[dict]:
    lower = logs.lower()
    rules = [
        ("JWT Expired", ["tokenexpired", "jwt expired", "expired token"], 94, "HIGH"),
        ("API Key Missing", ["api key missing", "missing api key", "x-api-key"], 90, "HIGH"),
        ("DB Connection Error", ["connection refused", "could not connect", "database", "postgres"], 88, "HIGH"),
        ("Redis Failure", ["redis", "cache unavailable"], 85, "MEDIUM"),
        ("Rate Limit", ["429", "rate limit", "too many requests"], 92, "MEDIUM"),
        ("CORS Issue", ["cors", "access-control-allow-origin"], 89, "MEDIUM"),
        ("Network Timeout", ["timeout", "timed out", "etimedout"], 86, "HIGH"),
        ("DNS Failure", ["enotfound", "dns", "name resolution"], 86, "HIGH"),
        ("SSL Error", ["ssl", "certificate", "tls"], 84, "HIGH"),
        ("Null Pointer", ["nullpointer", "noneType", "undefined is not"], 82, "MEDIUM"),
        ("Missing Package", ["modulenotfound", "cannot find module", "no module named"], 91, "MEDIUM"),
        ("Kubernetes Pod Crash", ["crashloopbackoff", "pod", "oomkilled"], 90, "HIGH"),
    ]
    for cause, needles, confidence, severity in rules:
        if any(needle in lower for needle in needles):
            evidence = parsed.get("error_lines", [{}])[0].get("content", logs[:180])
            return [{
                "root_cause": cause,
                "confidence_score": confidence,
                "why_it_happened": f"The logs contain indicators matching {cause}. The strongest evidence is preserved below.",
                "evidence": evidence,
                "severity": severity,
                "impact": "Requests touching the affected component are likely failing or degraded.",
                "components_affected": parsed.get("services") or ["api"],
            }]
    evidence = parsed.get("error_lines", [{}])[0].get("content", logs[:180])
    return [{
        "root_cause": "Config Error" if parsed.get("http_status_codes") else "Network Timeout",
        "confidence_score": 68,
        "why_it_happened": "The log has failure markers but does not expose a single definitive signature.",
        "evidence": evidence,
        "severity": "MEDIUM",
        "impact": "The impacted request path needs deeper inspection with correlated traces.",
        "components_affected": parsed.get("services") or ["unknown-service"],
    }]


def _extract_json(text: str) -> list[dict]:
    match = re.search(r"\[[\s\S]*\]", text)
    if not match:
        raise ValueError("Claude response did not include a JSON array")
    return json.loads(match.group(0))


def root_cause_agent(state: dict) -> dict:
    logs = state["logs"]
    parsed = state["parsed_errors"]
    if settings.anthropic_api_key:
        try:
            client = Anthropic(api_key=settings.anthropic_api_key)
            response = client.messages.create(
                model=settings.anthropic_model,
                max_tokens=1600,
                system=SYSTEM_PROMPT,
                messages=[{
                    "role": "user",
                    "content": (
                        "Return only a JSON array. Allowed root causes: "
                        f"{ROOT_CAUSES}. Analyze these parsed errors and logs:\n"
                        f"PARSED={json.dumps(parsed)}\nLOGS={logs[:12000]}"
                    ),
                }],
            )
            analysis = _extract_json(response.content[0].text)
            return {**state, "root_cause_analysis": analysis}
        except Exception as exc:
            state["llm_warning"] = f"Claude unavailable, used deterministic analyzer: {exc}"
    return {**state, "root_cause_analysis": _heuristic_analysis(logs, parsed)}
