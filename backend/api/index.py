from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.config import settings
from core.database import engine
from routers import animal_router, user_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    yield
    # shutdown — máx 500ms na Vercel
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

app.include_router(animal_router, prefix="/animals", tags=["animals"])
app.include_router(user_router, prefix="/users", tags=["Users"])

@app.get("/health")
async def health():
    return {"status": "ok"}