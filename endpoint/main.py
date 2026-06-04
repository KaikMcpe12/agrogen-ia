from fastapi import FastAPI
from backend.routers.diagnostico_router import router as diagnostico_router


app = FastAPI()

app.include_router(diagnostico_router)


app.include_router(
    diagnostico_router,
    prefix="/diagnosticos",
    tags=["Diagnósticos"]
)