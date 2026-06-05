from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from repositories.dashboard_repository import DashboardRepository

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _repo(session: AsyncSession = Depends(get_db)) -> DashboardRepository:
    return DashboardRepository(session)


@router.get("/kpis")
async def kpis(
    current_user: User = Depends(get_current_user),
    repo: DashboardRepository = Depends(_repo),
):
    data = await repo.kpis(usuario_id=current_user.usuario_id)
    return {"success": True, "data": data}


@router.get("/grafico-reprodutivo")
async def grafico_reprodutivo(
    meses: int = Query(6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    repo: DashboardRepository = Depends(_repo),
):
    data = await repo.grafico_reprodutivo(usuario_id=current_user.usuario_id, meses=meses)
    return {"success": True, "data": data}


@router.get("/timeline")
async def timeline(
    limit: int = Query(8, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    repo: DashboardRepository = Depends(_repo),
):
    data = await repo.timeline(usuario_id=current_user.usuario_id, limit=limit)
    return {"success": True, "data": data}
