import json
import re
from collections import Counter


HTTP_STATUS_RE = re.compile(r"\b([1-5][0-9]{2})\b")
TIMESTAMP_RE = re.compile(r"\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b")
SERVICE_RE = re.compile(r"(?:service|app|container|pod|component)[=:]\s*([a-zA-Z0-9_.-]+)", re.IGNORECASE)
ERROR_RE = re.compile(r"(error|exception|failed|timeout|denied|expired|refused|panic|traceback|fatal)", re.IGNORECASE)


def normalize_logs(logs: str) -> str:
    return logs.replace("\r\n", "\n").strip()


def detect_format(logs: str) -> str:
    sample = logs.strip()
    if not sample:
        return "empty"
    try:
        json.loads(sample)
        return "json"
    except json.JSONDecodeError:
        pass
    if "Traceback" in sample or "Exception" in sample:
        return "stack_trace"
    if sample.lower().startswith("curl") or "HTTP/" in sample:
        return "http"
    if "kubectl" in sample.lower() or "pod" in sample.lower():
        return "kubernetes"
    return "plain_text"


def extract_lines(logs: str) -> list[dict]:
    lines = []
    for idx, line in enumerate(normalize_logs(logs).splitlines(), start=1):
        if ERROR_RE.search(line) or HTTP_STATUS_RE.search(line):
            lines.append({"line": idx, "content": line[:500]})
    return lines[:50]


def top_services(logs: str) -> list[str]:
    services = SERVICE_RE.findall(logs)
    return [name for name, _ in Counter(services).most_common(5)]
