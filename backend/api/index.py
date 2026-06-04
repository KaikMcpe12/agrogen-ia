from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.config import settings
from core.database import engine

from routers import animal_router, user_router, diagnostico_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()

app = FastAPI(
    title="AgroGen API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(animal_router)
app.include_router(user_router, prefix="/users", tags=["Users"])

app.include_router(
    diagnostico_router,
    prefix="/diagnosticos",
    tags=["Diagnósticos"]
)

@app.get("/health")
async def health():
    return {"status": "ok"}