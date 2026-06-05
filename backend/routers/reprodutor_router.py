from fastapi import APIRouter, Depends, Query, status
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.reprodutor_service import ReproductorService
from schemas.reprodutor_schema import ReproductorCreate, ReproductorUpdate
from models.reprodutor_model import ReproductorModel
from models.enums import EspecieAnimal, TipoReprodutor

router = APIRouter(prefix="/reprodutores", tags=["Reprodutores"])


async def get_service(session: AsyncSession = Depends(get_db)) -> ReproductorService:
    return ReproductorService(session)


def _serialize(r: ReproductorModel) -> dict:
    return {
        "id":             str(r.reprodutor_id),
        "nome":           r.nome,
        "registro":       r.registro,
        "especie":        r.especie.value,
        "raca":           r.raca,
        "tipo":           r.tipo.value,
        "empresa_semen":  r.empresa_semen,
        "dep_peso_desmame": float(r.dep_peso_desmame) if r.dep_peso_desmame is not None else None,
        "dep_fertilidade":  float(r.dep_fertilidade)  if r.dep_fertilidade  is not None else None,
        "dep_acuracia":     float(r.dep_acuracia)      if r.dep_acuracia     is not None else None,
        "ativo":          r.ativo,
    }


@router.get("")
async def list_reprodutores(
    especie:       Optional[EspecieAnimal]  = None,
    tipo:          Optional[TipoReprodutor] = None,
    q:             Optional[str]            = Query(None, min_length=2),
    apenas_ativos: bool                     = Query(True),
    limit:         int                      = Query(20, ge=1, le=100),
    offset:        int                      = Query(0, ge=0),
    service: ReproductorService = Depends(get_service),
):
    items = await service.list_all(especie=especie, tipo=tipo, q=q, apenas_ativos=apenas_ativos, limit=limit, offset=offset)
    return {"success": True, "data": [_serialize(r) for r in items]}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_reprodutor(
    data: ReproductorCreate,
    service: ReproductorService = Depends(get_service),
):
    r = await service.create(data)
    return {"success": True, "data": _serialize(r)}


@router.get("/{reprodutor_id}")
async def get_reprodutor(
    reprodutor_id: UUID,
    service: ReproductorService = Depends(get_service),
):
    r = await service.get_by_id(reprodutor_id)
    return {"success": True, "data": _serialize(r)}


@router.put("/{reprodutor_id}")
async def update_reprodutor(
    reprodutor_id: UUID,
    data: ReproductorUpdate,
    service: ReproductorService = Depends(get_service),
):
    r = await service.update(reprodutor_id, data)
    return {"success": True, "data": _serialize(r)}


@router.delete("/{reprodutor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reprodutor(
    reprodutor_id: UUID,
    service: ReproductorService = Depends(get_service),
):
    await service.soft_delete(reprodutor_id)
