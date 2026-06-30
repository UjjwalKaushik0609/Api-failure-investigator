from io import BytesIO
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from auth.auth_router import router as auth_router
from auth.dependencies import get_current_user
from config import get_settings
from db.crud import create_incident, dashboard_stats, get_incident, list_incidents
from db.database import User, get_db, init_db
from models.schemas import ExportPdfRequest, IncidentDetail, IncidentSummary, InvestigateRequest
from vector.chroma_store import ChromaIncidentStore
from workflows.investigation_workflow import investigation_app


settings = get_settings()
print("CORS_ORIGINS ENV:", settings.cors_origins)
print("CORS LIST:", settings.cors_origin_list)
app = FastAPI(title=settings.app_name, version="1.0.0")
vector_store = ChromaIncidentStore()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://heroic-tenderness-production-bc6b.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/investigate")
def investigate(
    payload: InvestigateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    similar = vector_store.search(payload.logs[:2000], str(current_user.id))
    result = investigation_app.invoke({"logs": payload.logs, "format": payload.format, "similar_incidents": similar})
    result["similar_incidents"] = similar
    incident = create_incident(db, current_user, payload.logs, payload.format, result)
    issue = result["root_cause_analysis"][0]
    vector_store.add(
        str(incident.id),
        str(current_user.id),
        f"{issue['root_cause']} {issue['severity']} {issue['evidence']}",
        {"root_cause": issue["root_cause"], "severity": issue["severity"], "incident_id": str(incident.id)},
    )
    return {"incident_id": incident.id, **result}


@app.get("/api/incidents", response_model=list[IncidentSummary])
def incidents(
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list:
    return list_incidents(db, current_user, search)


@app.get("/api/incidents/{incident_id}", response_model=IncidentDetail)
def incident_detail(
    incident_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    incident = get_incident(db, current_user, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@app.get("/api/dashboard/stats")
def stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return dashboard_stats(db, current_user)


@app.post("/api/export/pdf")
def export_pdf(
    payload: ExportPdfRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    incident = get_incident(db, current_user, payload.incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 48
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(48, y, incident.title)
    y -= 32
    pdf.setFont("Helvetica", 10)
    for line in incident.result.get("incident_report", "").splitlines():
        if y < 48:
            pdf.showPage()
            pdf.setFont("Helvetica", 10)
            y = height - 48
        pdf.drawString(48, y, line[:105])
        y -= 14
    pdf.save()
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=incident-{incident.id}.pdf"},
    )
