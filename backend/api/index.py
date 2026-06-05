from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core.database import engine
from middleware.request_id import RequestIDMiddleware, request_id_ctx

from routers import (
    animal_router, user_router, diagnostico_router, fazenda_router,
    analise_ia_router, reprodutor_router,
    inseminacao_router, diario_router, alerta_router,
    ia_router, dashboard_router, relatorio_router,
)
from routers.auth_router import router as auth_router
from routers.user_me_router import router as user_me_router

API_V1 = ""


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(
    title="AgroGen API",
    version="1.0.0",
    redirect_slashes=False,
    lifespan=lifespan,
)

# ── Middlewares ───────────────────────────────────────────────────────────────

app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Exception handler global ─────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    from fastapi import HTTPException
    req_id = request_id_ctx.get("")

    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "codigo_interno": f"HTTP_{exc.status_code}",
                    "mensagem": exc.detail if isinstance(exc.detail, str) else str(exc.detail),
                    "detalhes": None,
                },
                "request_id": req_id,
            },
        )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "codigo_interno": "INTERNAL_SERVER_ERROR",
                "mensagem": "Ocorreu um erro interno. Tente novamente.",
                "detalhes": None,
            },
            "request_id": req_id,
        },
    )

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth_router,       prefix=API_V1)
app.include_router(user_router,       prefix=API_V1)
app.include_router(user_me_router,    prefix=API_V1)
app.include_router(animal_router,     prefix=API_V1)
app.include_router(fazenda_router,    prefix=API_V1)
app.include_router(diagnostico_router, prefix=API_V1)
app.include_router(analise_ia_router,  prefix=API_V1)
app.include_router(reprodutor_router,  prefix=API_V1)
app.include_router(inseminacao_router, prefix=API_V1)
app.include_router(diario_router,      prefix=API_V1)
app.include_router(alerta_router,      prefix=API_V1)
app.include_router(ia_router,          prefix=API_V1)
app.include_router(dashboard_router,   prefix=API_V1)
app.include_router(relatorio_router,   prefix=API_V1)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
