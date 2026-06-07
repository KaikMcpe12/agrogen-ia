from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from services.predicao_service import PredicaoService
from services.padroes_service import PadroesService
from schemas.predicao_schema import PredicaoRequest
from models.enums import EspecieAnimal

router = APIRouter(prefix="/ia", tags=["Inteligência Artificial"])


def _svc(session: AsyncSession = Depends(get_db)) -> PredicaoService:
    return PredicaoService(session)


@router.post("/predicao-prenhez")
async def predicao_prenhez(
    data: PredicaoRequest,
    current_user: User = Depends(get_current_user),
    svc: PredicaoService = Depends(_svc),
):
    result = await svc.predizer(data)
    return {"success": True, "data": result}


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
    fazenda_id:  Optional[UUID]         = None,
    data_inicio: Optional[date]         = None,
    data_fim:    Optional[date]         = None,
    especie:     Optional[EspecieAnimal] = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    hoje = date.today()
    fim   = data_fim    or hoje
    inicio = data_inicio or (fim - timedelta(days=180))
    svc = PadroesService(session)
    return await svc.padroes_fertilidade(inicio, fim, especie, fazenda_id)
