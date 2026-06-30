from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfile(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: Literal["admin", "developer", "viewer"]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class InvestigateRequest(BaseModel):
    logs: str = Field(min_length=10, max_length=200_000)
    format: str = "auto"


class ExportPdfRequest(BaseModel):
    incident_id: UUID


class IncidentSummary(BaseModel):
    id: UUID
    title: str
    root_cause: str
    severity: str
    confidence_score: int
    created_at: datetime

    model_config = {"from_attributes": True}


class IncidentDetail(IncidentSummary):
    logs: str
    format: str
    result: dict[str, Any]

    model_config = {"from_attributes": True}
