from fastapi import FastAPI
from endpoint.routes.user_routes import router as user_router

app = FastAPI(title="Minha API")

app.include_router(
    user_router,
    prefix="/users",
    tags=["Users"]
)