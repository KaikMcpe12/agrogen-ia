from fastapi import APIRouter, Depends, Query, status
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.reprodutor_service import ReproductorService
from schemas.reprodutor_schema import ReproductorCreate, ReproductorUpdate, ReproductorResponse
from models.enums import EspecieAnimal, TipoReprodutor

router = APIRouter(prefix="/reprodutores", tags=["Reprodutores"])


async def get_service(session: AsyncSession = Depends(get_db)) -> ReproductorService:
    return ReproductorService(session)


@router.get("/", response_model=list[ReproductorResponse])
async def list_reprodutores(
    especie:       Optional[EspecieAnimal]  = None,
    tipo:          Optional[TipoReprodutor] = None,
    q:             Optional[str]            = Query(None, min_length=2, description="Busca por nome ou raça"),
    apenas_ativos: bool                     = Query(True),
    limit:         int                      = Query(20, ge=1, le=100),
    offset:        int                      = Query(0, ge=0),
    service: ReproductorService = Depends(get_service),
):
    return await service.list_all(
        especie=especie,
        tipo=tipo,
        q=q,
        apenas_ativos=apenas_ativos,
        limit=limit,
        offset=offset,
    )


@router.post("/", response_model=ReproductorResponse, status_code=status.HTTP_201_CREATED)
async def create_reprodutor(
    data: ReproductorCreate,
    service: ReproductorService = Depends(get_service),
):
    return await service.create(data)


@router.get("/{reprodutor_id}", response_model=ReproductorResponse)
async def get_reprodutor(
    reprodutor_id: UUID,
    service: ReproductorService = Depends(get_service),
):
    return await service.get_by_id(reprodutor_id)


@router.put("/{reprodutor_id}", response_model=ReproductorResponse)
async def update_reprodutor(
    reprodutor_id: UUID,
    data: ReproductorUpdate,
    service: ReproductorService = Depends(get_service),
):
    return await service.update(reprodutor_id, data)


@router.delete("/{reprodutor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reprodutor(
    reprodutor_id: UUID,
    service: ReproductorService = Depends(get_service),
):
    await service.soft_delete(reprodutor_id)
