import json

from anthropic import Anthropic

from config import get_settings


settings = get_settings()
SYSTEM_PROMPT = (
    "You are a Senior Software Engineer. Generate production-ready code fixes with detailed explanations. "
    "Always include both immediate hotfixes and long-term architectural improvements."
)


PATCHES = {
    "JWT Expired": "from fastapi import HTTPException\n\nif token_is_expired(token):\n    raise HTTPException(status_code=401, detail='Token expired; refresh required')",
    "DB Connection Error": "engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=10, max_overflow=20)",
    "Rate Limit": "retry_after = int(response.headers.get('Retry-After', '5'))\ntime.sleep(retry_after)",
    "CORS Issue": "app.add_middleware(CORSMiddleware, allow_origins=trusted_origins, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])",
}


def _fallback(issue: dict) -> dict:
    cause = issue["root_cause"]
    return {
        "immediate_fix": [
            f"Confirm the failing path and reproduce the {cause} condition.",
            "Apply the smallest configuration or code change that removes the failing condition.",
            "Redeploy and verify with the exact request that failed.",
        ],
        "code_patch": PATCHES.get(cause, "# Add targeted validation, retries, or configuration checks at the failing boundary\nraise RuntimeError('validated failure path')"),
        "long_term_fix": [
            "Add typed configuration validation at startup.",
            "Add structured logs with request id, service, user id, and dependency latency.",
            "Create runbooks for the top recurring incident categories.",
        ],
        "preventive_actions": [
            "Alert on repeated 5xx responses and high latency.",
            "Track error budgets by service and endpoint.",
            "Store this incident for similarity search during future investigations.",
        ],
    }


def fix_generator_agent(state: dict) -> dict:
    issue = state["root_cause_analysis"][0]
    if settings.anthropic_api_key:
        try:
            client = Anthropic(api_key=settings.anthropic_api_key)
            response = client.messages.create(
                model=settings.anthropic_model,
                max_tokens=1400,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": f"Return JSON only for this issue: {json.dumps(issue)}"}],
            )
            fixes = json.loads(response.content[0].text)
            return {**state, "fixes": fixes}
        except Exception as exc:
            state["llm_warning"] = state.get("llm_warning", "") + f" Fix fallback used: {exc}"
    return {**state, "fixes": _fallback(issue)}
