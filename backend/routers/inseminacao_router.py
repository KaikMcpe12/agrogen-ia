from datetime import date
from fastapi import APIRouter, Depends, Query, status
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from services.inseminacao_service import InseminacaoService
from schemas.inseminacao_schema import InseminacaoCreate, InseminacaoUpdate, InseminacaoResponse, DiagnosticoViaInseminacaoCreate
from schemas.common import PaginatedMeta
from models.enums import ResultadoInseminacao

router = APIRouter(prefix="/inseminacoes", tags=["Inseminações"])


async def get_service(session: AsyncSession = Depends(get_db)) -> InseminacaoService:
    return InseminacaoService(session)


# INS-03 — deve vir antes de /{id}
@router.get("/pendentes-diagnostico")
async def list_pendentes_diagnostico(
    animal_id:    Optional[UUID] = None,
    dias_minimos: int            = Query(0, ge=0),
    service: InseminacaoService = Depends(get_service),
):
    items = await service.list_pendentes_diagnostico(animal_id=animal_id, dias_minimos=dias_minimos)
    return {"success": True, "data": items}


# INS-01
@router.get("")
async def list_inseminacoes(
    animal_id:   Optional[UUID]                = None,
    tecnico_id:  Optional[UUID]                = None,
    resultado:   Optional[ResultadoInseminacao] = None,
    data_inicio: Optional[date]                = None,
    data_fim:    Optional[date]                = None,
    page:        int                           = Query(1, ge=1),
    limit:       int                           = Query(20, ge=1, le=100),
    service: InseminacaoService = Depends(get_service),
):
    offset = (page - 1) * limit
    items, total = await service.list_all_enriched(
        animal_id=animal_id, tecnico_id=tecnico_id, resultado=resultado,
        data_inicio=data_inicio, data_fim=data_fim, limit=limit, offset=offset,
    )
    total_pages = max(1, (total + limit - 1) // limit)
    return {
        "success": True,
        "data": items,
        "meta": PaginatedMeta(
            total=total, page=page, limit=limit, total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        ),
    }


# INS-02
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_inseminacao(
    data: InseminacaoCreate,
    current_user: User = Depends(get_current_user),
    service: InseminacaoService = Depends(get_service),
):
    ins, warnings, alerta_dict, aviso_intervalo = await service.create(data, tecnico_id=current_user.usuario_id)
    response = InseminacaoResponse.model_validate(ins)
    response.warnings = warnings
    return {
        "success": True,
        "data": {
            **response.model_dump(mode="json"),
            "alerta_criado":   alerta_dict,
            "aviso_intervalo": aviso_intervalo,
        }
    }


# INS-04a
@router.get("/{inseminacao_id}")
async def get_inseminacao(
    inseminacao_id: UUID,
    service: InseminacaoService = Depends(get_service),
):
    return {"success": True, "data": await service.get_by_id_enriched(inseminacao_id)}


# INS-04b
@router.post("/{inseminacao_id}/diagnostico", status_code=status.HTTP_201_CREATED)
async def registrar_diagnostico(
    inseminacao_id: UUID,
    data: DiagnosticoViaInseminacaoCreate,
    current_user: User = Depends(get_current_user),
    service: InseminacaoService = Depends(get_service),
):
    result = await service.registrar_diagnostico(inseminacao_id, data)
    return {"success": True, "data": result}
