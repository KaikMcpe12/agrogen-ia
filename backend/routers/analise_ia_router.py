from fastapi import APIRouter, Depends, Query, status
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.analise_ia_service import AnaliseIAService
from schemas.analise_ia_schema import AnaliseIACreate, AnaliseIAUpdate, AnaliseIAResponse

router = APIRouter(prefix="/analises-ia", tags=["Análises IA"])


async def get_service(session: AsyncSession = Depends(get_db)) -> AnaliseIAService:
    return AnaliseIAService(session)


@router.post("/", response_model=AnaliseIAResponse, status_code=status.HTTP_201_CREATED)
async def create_analise(
    data: AnaliseIACreate,
    service: AnaliseIAService = Depends(get_service)
):
    return await service.create(data)


@router.get("/", response_model=list[AnaliseIAResponse])
async def list_analises(
    animal_id:  Optional[UUID] = None,
    tecnico_id: Optional[UUID] = None,
    limit:  int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: AnaliseIAService = Depends(get_service)
):
    return await service.list_all(
        animal_id=animal_id,
        tecnico_id=tecnico_id,
        limit=limit,
        offset=offset,
    )


@router.get("/{analise_id}", response_model=AnaliseIAResponse)
async def get_analise(
    analise_id: UUID,
    service: AnaliseIAService = Depends(get_service)
):
    return await service.get_by_id(analise_id)


@router.put("/{analise_id}", response_model=AnaliseIAResponse)
async def update_analise(
    analise_id: UUID,
    data: AnaliseIAUpdate,
    service: AnaliseIAService = Depends(get_service)
):
    return await service.update(analise_id, data)


@router.delete("/{analise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analise(
    analise_id: UUID,
    service: AnaliseIAService = Depends(get_service)
):
    await service.delete(analise_id)