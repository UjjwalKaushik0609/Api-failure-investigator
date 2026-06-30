from utils.log_preprocessor import detect_format, extract_lines, normalize_logs, top_services, HTTP_STATUS_RE, TIMESTAMP_RE


def log_parser_agent(state: dict) -> dict:
    logs = normalize_logs(state["logs"])
    requested_format = state.get("format", "auto")
    parsed = {
        "format": detect_format(logs) if requested_format == "auto" else requested_format,
        "timestamps": TIMESTAMP_RE.findall(logs)[:20],
        "http_status_codes": sorted(set(HTTP_STATUS_RE.findall(logs))),
        "services": top_services(logs),
        "error_lines": extract_lines(logs),
        "line_count": len(logs.splitlines()),
    }
    return {**state, "parsed_errors": parsed}
