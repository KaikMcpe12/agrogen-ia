from fastapi import APIRouter, Depends, Query
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from services.predicao_service import PredicaoService
from schemas.predicao_schema import PredicaoRequest, PredicaoResponse
from models.enums import EspecieAnimal
from datetime import date

router = APIRouter(prefix="/ia", tags=["Inteligência Artificial"])


def _svc(session: AsyncSession = Depends(get_db)) -> PredicaoService:
    return PredicaoService(session)


@router.post("/predicao-prenhez", response_model=PredicaoResponse)
async def predicao_prenhez(
    data: PredicaoRequest,
    current_user: User = Depends(get_current_user),
    svc: PredicaoService = Depends(_svc),
):
    return await svc.predizer(data)


@router.get("/predicoes/{animal_id}")
async def historico_predicoes(
    animal_id: UUID,
    limit:     int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    svc: PredicaoService = Depends(_svc),
):
    items = await svc.historico(animal_id, limit=limit)
    return {"success": True, "data": items}


@router.get("/padroes-fertilidade")
async def padroes_fertilidade(
    data_inicio: date,
    data_fim:    date,
    especie:     Optional[EspecieAnimal] = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    from services.padroes_service import PadroesService
    svc = PadroesService(session)
    return await svc.padroes_fertilidade(data_inicio, data_fim, especie)
