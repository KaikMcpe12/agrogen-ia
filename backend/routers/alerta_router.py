from fastapi import APIRouter, Depends, Query
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from services.alerta_service import AlertaService
from schemas.alerta_schema import AlertaBadgeResponse, AlertaResolverRequest
from models.enums import TipoAlerta, PrioridadeAlerta

router = APIRouter(prefix="/alertas", tags=["Alertas"])


async def get_service(session: AsyncSession = Depends(get_db)) -> AlertaService:
    return AlertaService(session)


# ALE-02 — badge leve para polling do sino (antes de /{id})
@router.get("/badge")
async def get_badge(
    current_user: User = Depends(get_current_user),
    service: AlertaService = Depends(get_service),
):
    data = await service.get_badge()
    return {"success": True, "data": data}


# ALE-01 — listagem com filtros
@router.get("")
async def list_alertas(
    animal_id:  Optional[UUID]            = None,
    fazenda_id: Optional[UUID]            = None,
    tipo:       Optional[TipoAlerta]       = None,
    prioridade: Optional[PrioridadeAlerta] = None,
    lido:       Optional[bool]             = None,
    resolvido:  Optional[bool]             = None,
    page:       int                        = Query(1, ge=1),
    limit:      int                        = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: AlertaService = Depends(get_service),
):
    offset = (page - 1) * limit
    items = await service.list_pendentes(
        animal_id=animal_id, fazenda_id=fazenda_id, tipo=tipo,
        prioridade=prioridade, lido=lido, resolvido=resolvido,
        limit=limit, offset=offset,
    )
    return {
        "success": True,
        "data": items,
        "meta": {
            "total":     len(items),
            "nao_lidos": sum(1 for a in items if not a.get("lido")),
            "criticos":  sum(1 for a in items if a.get("prioridade") == "CRITICA"),
        },
    }


# ALE-04 — alias /contagem
@router.get("/contagem")
async def contagem(
    current_user: User = Depends(get_current_user),
    service: AlertaService = Depends(get_service),
):
    data = await service.get_badge()
    return {"success": True, "data": data}


# ALE-05 — detalhe
@router.get("/{alerta_id}")
async def get_alerta(
    alerta_id: UUID,
    current_user: User = Depends(get_current_user),
    service: AlertaService = Depends(get_service),
):
    return {"success": True, "data": await service.get_by_id(alerta_id)}


# ALE-03 — marcar como lido
@router.patch("/{alerta_id}/lido")
async def marcar_lido(
    alerta_id: UUID,
    current_user: User = Depends(get_current_user),
    service: AlertaService = Depends(get_service),
):
    return {"success": True, "data": await service.marcar_lido(alerta_id)}


# ALE-03 — marcar como resolvido
@router.patch("/{alerta_id}/resolver")
async def marcar_resolvido(
    alerta_id: UUID,
    body: AlertaResolverRequest = AlertaResolverRequest(),
    current_user: User = Depends(get_current_user),
    service: AlertaService = Depends(get_service),
):
    result = await service.marcar_resolvido(alerta_id)
    if isinstance(result, dict):
        return {"success": True, "data": {**result, "lido": True}}
    return {"success": True, "data": {"id": str(alerta_id), "resolvido": True, "lido": True}}
