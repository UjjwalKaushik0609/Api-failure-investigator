from uuid import UUID

from sqlalchemy import desc
from sqlalchemy.orm import Session

from db.database import Incident, User


def create_incident(db: Session, user: User, logs: str, log_format: str, result: dict) -> Incident:
    issue = result["root_cause_analysis"][0]
    incident = Incident(
        user_id=user.id,
        title=f"{issue['severity']} - {issue['root_cause']}",
        logs=logs,
        format=log_format,
        root_cause=issue["root_cause"],
        severity=issue["severity"],
        confidence_score=issue["confidence_score"],
        result=result,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


def list_incidents(db: Session, user: User, search: str | None = None) -> list[Incident]:
    query = db.query(Incident).filter(Incident.user_id == user.id)
    if search:
        pattern = f"%{search}%"
        query = query.filter((Incident.root_cause.ilike(pattern)) | (Incident.severity.ilike(pattern)) | (Incident.title.ilike(pattern)))
    return query.order_by(desc(Incident.created_at)).all()


def get_incident(db: Session, user: User, incident_id: UUID) -> Incident | None:
    return db.query(Incident).filter(Incident.id == incident_id, Incident.user_id == user.id).first()


def dashboard_stats(db: Session, user: User) -> dict:
    incidents = db.query(Incident).filter(Incident.user_id == user.id).all()
    total = len(incidents)
    error_distribution = {}
    severity_breakdown = {}
    service_counts = {}
    for incident in incidents:
        error_distribution[incident.root_cause] = error_distribution.get(incident.root_cause, 0) + 1
        severity_breakdown[incident.severity] = severity_breakdown.get(incident.severity, 0) + 1
        for service in incident.result.get("parsed_errors", {}).get("services", []):
            service_counts[service] = service_counts.get(service, 0) + 1
    critical_or_high = severity_breakdown.get("CRITICAL", 0) + severity_breakdown.get("HIGH", 0)
    health_score = max(0, 100 - (critical_or_high * 12) - (severity_breakdown.get("MEDIUM", 0) * 5))
    avg_confidence = round(sum(incident.confidence_score for incident in incidents) / total) if total else 0
    mttd_minutes = max(2, 18 - min(total, 12)) if total else 0
    mttr_minutes = max(12, 55 - (avg_confidence // 3)) if total else 0
    recent = db.query(Incident).filter(Incident.user_id == user.id).order_by(desc(Incident.created_at)).limit(8).all()
    return {
        "total_incidents": total,
        "average_confidence": avg_confidence,
        "mttd_minutes": mttd_minutes,
        "mttr_minutes": mttr_minutes,
        "error_type_distribution": [{"name": k, "value": v} for k, v in error_distribution.items()],
        "severity_breakdown": [{"severity": k, "count": v} for k, v in severity_breakdown.items()],
        "top_failing_services": [{"service": k, "count": v} for k, v in sorted(service_counts.items(), key=lambda item: item[1], reverse=True)[:5]],
        "recent_incidents": [
            {
                "id": incident.id,
                "title": incident.title,
                "root_cause": incident.root_cause,
                "severity": incident.severity,
                "confidence_score": incident.confidence_score,
                "created_at": incident.created_at,
            }
            for incident in recent
        ],
        "api_health_score": health_score,
    }
