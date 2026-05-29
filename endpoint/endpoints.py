from fastapi import FastAPI
from app.routes import user_routes

app = FastAPI(title="Minha API")

app.include_router(user_routes.router, prefix="/users", tags=["Users"])

