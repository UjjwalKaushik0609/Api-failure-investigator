from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from agents.fix_generator_agent import fix_generator_agent
from agents.incident_report_agent import incident_report_agent
from agents.log_parser_agent import log_parser_agent
from agents.root_cause_agent import root_cause_agent
from agents.security_agent import security_agent


class InvestigationState(TypedDict, total=False):
    logs: str
    format: str
    parsed_errors: dict[str, Any]
    root_cause_analysis: list[dict[str, Any]]
    fixes: dict[str, Any]
    security_findings: list[dict[str, Any]]
    incident_report: str
    similar_incidents: list[dict[str, Any]]
    llm_warning: str


def build_workflow():
    workflow = StateGraph(InvestigationState)
    workflow.add_node("log_parser_agent", log_parser_agent)
    workflow.add_node("root_cause_agent", root_cause_agent)
    workflow.add_node("fix_generator_agent", fix_generator_agent)
    workflow.add_node("security_agent", security_agent)
    workflow.add_node("incident_report_agent", incident_report_agent)
    workflow.add_edge(START, "log_parser_agent")
    workflow.add_edge("log_parser_agent", "root_cause_agent")
    workflow.add_edge("root_cause_agent", "fix_generator_agent")
    workflow.add_edge("fix_generator_agent", "security_agent")
    workflow.add_edge("security_agent", "incident_report_agent")
    workflow.add_edge("incident_report_agent", END)
    return workflow.compile()


investigation_app = build_workflow()
