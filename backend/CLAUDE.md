# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn api.index:app --reload

# Run with explicit host/port
uvicorn api.index:app --host 0.0.0.0 --port 8000 --reload
```

## Environment

Create a `.env` file in the project root with:

```
DATABASE_URL=postgresql://user:password@host/dbname
SECRET_KEY=your-secret-key
ENVIRONMENT=development          # enables SQLAlchemy echo
ALLOWED_ORIGINS=["http://localhost:3000"]
```

The database URL is automatically rewritten to use `postgresql+asyncpg://`. SSL `sslmode=` params are stripped (Vercel/serverless constraint).

## Architecture

4-layer stack per domain: **router → service → repository → model**

| Layer | Responsibility |
|---|---|
| `routers/` | FastAPI `APIRouter`, path params, query params, HTTP status codes |
| `services/` | Business logic, raises `HTTPException` on not-found/invalid |
| `repositories/` | SQLAlchemy async queries; catches `DBAPIError` for FK violations |
| `models/` | SQLAlchemy ORM models; enums in `models/enums.py` |
| `schemas/` | Pydantic v2 request/response models; `model_config = ConfigDict(from_attributes=True)` on response schemas |

Entry point: `api/index.py` (consumed by Vercel via `vercel.json`).

Database session: `get_db()` in `core/database.py` — commits on success, rolls back on exception, injected via `Depends`. The engine uses `NullPool` (required for serverless).

## Database

PostgreSQL. Schema source of truth: `endpoint/agroGen_schema.sql`. All enum types are defined in the DB — models use `create_type=False` to avoid conflicts.

Key domain entities: `usuarios`, `fazendas`, `animais`, `inseminacoes`, `diagnosticos`, `analises_ia`, `eventos_sanitarios`, `pesagens`, `partos`, `alimentacoes`, `alertas`.

The `fn_set_updated_at()` trigger handles `updated_at` at the DB level for most tables; the ORM `onupdate=func.now()` is a fallback.

## Patterns

**Adding a new domain**: create files in each of the 4 layers, then export the router from `routers/__init__.py` and register it in `api/index.py`.

**FK error handling**: repositories catch `exc.DBAPIError` and inspect `str(e.orig)` for constraint names to return meaningful 422 errors.

**Partial updates**: repositories use `schema.model_dump(exclude_unset=True)` so only sent fields are updated.
