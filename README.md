# API Failure Investigator

Production-style full-stack portfolio project for AI/LLM-focused backend roles. Users paste API logs, HTTP failures, stack traces, Docker/Kubernetes output, or service errors. A LangGraph agent pipeline parses the evidence, identifies the likely root cause, generates a fix, scans for security issues, stores institutional memory in ChromaDB, and creates an incident report.

![Python](https://img.shields.io/badge/Python-3.11-3776AB)
![FastAPI](https://img.shields.io/badge/FastAPI-API-009688)
![React](https://img.shields.io/badge/React-Vite-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1)
![Redis](https://img.shields.io/badge/Redis-cache-DC382D)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED)

## Architecture

```mermaid
flowchart LR
  U[User] --> FE[React + Vite]
  FE -->|Bearer JWT| API[FastAPI]
  API --> AUTH[JWT Auth + Redis Blacklist]
  API --> PG[(PostgreSQL)]
  API --> LG[LangGraph Workflow]
  LG --> P[Log Parser]
  P --> R[Root Cause Agent]
  R --> F[Fix Generator]
  F --> S[Security Agent]
  S --> I[Incident Report Agent]
  API --> C[(ChromaDB Similar Incidents)]
  R -.-> Claude[Anthropic Claude Sonnet]
  F -.-> Claude
```

## Features

- JWT authentication with register, login, current-user, and Redis-backed logout blacklist.
- Protected API routes using `Authorization: Bearer <token>`.
- PostgreSQL users and incidents, with every incident query filtered by `user_id`.
- LangGraph workflow with five focused AI agents.
- Claude integration via `ANTHROPIC_API_KEY`, plus deterministic fallback analysis for demos without a key.
- ChromaDB institutional-memory search for top similar incidents.
- React auth pages, protected routes, Axios token interceptor, navbar user display, and logout.
- Dashboard with Recharts metrics, history search, incident detail re-open, Markdown export, and PDF export.
- Docker Compose for backend, frontend, Postgres, Redis, and ChromaDB.

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- Backend docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

Create an account at `/register`, log in, then paste a sample failure:

```text
2026-06-29T10:15:21Z service=auth-service ERROR TokenExpiredError: jwt expired
GET /api/incidents HTTP/1.1 401
Authorization: Bearer eyJhbGciOi...
```

## Environment

```env
ANTHROPIC_API_KEY=
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/api_failure_investigator
REDIS_URL=redis://localhost:6379/0
CHROMA_HOST=localhost
CHROMA_PORT=8001
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## API

Auth:

- `POST /auth/register` `{ email, password, full_name }`
- `POST /auth/login` `{ email, password }`
- `GET /auth/me`
- `POST /auth/logout`

Protected app endpoints:

- `POST /api/investigate` `{ logs, format }`
- `GET /api/incidents`
- `GET /api/incidents/{id}`
- `GET /api/dashboard/stats`
- `POST /api/export/pdf` `{ incident_id }`

## Agent Workflow

1. **Log Parser Agent** extracts timestamps, HTTP codes, services, and high-signal error lines.
2. **Root Cause Agent** classifies the incident into known failure categories and returns confidence, evidence, severity, impact, and affected components.
3. **Fix Generator Agent** returns immediate steps, production code patch, long-term fixes, and preventive actions.
4. **Security Agent** checks logs for exposed secrets and unsafe auth leakage.
5. **Incident Report Agent** produces an executive-ready Markdown report.

## Deploy Notes

For a live deployment, set a strong `SECRET_KEY`, a production Postgres URL, Redis URL, Chroma host, frontend `VITE_API_URL`, and `ANTHROPIC_API_KEY`. The Docker setup is suitable for Render, Railway, Fly.io, or a VM with Docker Compose.

## Screenshots

Add screenshots here after first deployment:

- Login page
- Investigation page
- Dashboard
- Incident report
