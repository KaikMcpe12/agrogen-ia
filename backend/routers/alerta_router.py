from fastapi import APIRouter, Depends, Query
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from services.alerta_service import AlertaService
from schemas.alerta_schema import AlertaResponse, AlertaBadgeResponse
from models.enums import TipoAlerta, PrioridadeAlerta

router = APIRouter(prefix="/alertas", tags=["Alertas"])


async def get_service(session: AsyncSession = Depends(get_db)) -> AlertaService:
    return AlertaService(session)


# ALE-02 — badge leve para polling do sino (antes de /{id})
@router.get("/badge", response_model=AlertaBadgeResponse)
async def get_badge(
    current_user: User = Depends(get_current_user),
    service: AlertaService = Depends(get_service),
):
    return await service.get_badge()


# ALE-01 — listagem com filtros
@router.get("/", response_model=list[AlertaResponse])
async def list_alertas(
    animal_id:  Optional[UUID]           = None,
    tipo:       Optional[TipoAlerta]      = None,
    prioridade: Optional[PrioridadeAlerta] = None,
    limit:      int                       = Query(20, ge=1, le=100),
    offset:     int                       = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    service: AlertaService = Depends(get_service),
):
    return await service.list_pendentes(
        animal_id=animal_id, tipo=tipo, prioridade=prioridade,
        limit=limit, offset=offset,
    )


# ALE-05 — detalhe
@router.get("/{alerta_id}", response_model=AlertaResponse)
async def get_alerta(
    alerta_id: UUID,
    current_user: User = Depends(get_current_user),
    service: AlertaService = Depends(get_service),
):
    return await service.get_by_id(alerta_id)


# ALE-03 — marcar como lido
@router.patch("/{alerta_id}/lido", response_model=AlertaResponse)
async def marcar_lido(
    alerta_id: UUID,
    current_user: User = Depends(get_current_user),
    service: AlertaService = Depends(get_service),
):
    return await service.marcar_lido(alerta_id)


# ALE-04 — marcar como resolvido
@router.patch("/{alerta_id}/resolvido", response_model=AlertaResponse)
async def marcar_resolvido(
    alerta_id: UUID,
    current_user: User = Depends(get_current_user),
    service: AlertaService = Depends(get_service),
):
    return await service.marcar_resolvido(alerta_id)
