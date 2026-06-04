from fastapi import APIRouter, Depends, Query, status
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.fazenda_service import FazendaService
from schemas.fazenda_schema import FazendaCreate, FazendaUpdate, FazendaResponse

router = APIRouter(prefix="/fazendas", tags=["Fazendas"])


async def get_service(session: AsyncSession = Depends(get_db)) -> FazendaService:
    return FazendaService(session)


@router.post("/", response_model=FazendaResponse, status_code=status.HTTP_201_CREATED)
async def create_fazenda(
    data: FazendaCreate,
    service: FazendaService = Depends(get_service)
):
    return await service.create(data)


@router.get("/", response_model=list[FazendaResponse])
async def list_fazendas(
    usuario_id:       Optional[UUID] = None,
    estado:           Optional[str]  = None,
    incluir_inativos: bool = Query(False),
    limit:  int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: FazendaService = Depends(get_service)
):
    return await service.list_all(
        usuario_id=usuario_id,
        estado=estado,
        incluir_inativos=incluir_inativos,
        limit=limit,
        offset=offset,
    )


@router.get("/{fazenda_id}", response_model=FazendaResponse)
async def get_fazenda(
    fazenda_id: UUID,
    service: FazendaService = Depends(get_service)
):
    return await service.get_by_id(fazenda_id)


@router.put("/{fazenda_id}", response_model=FazendaResponse)
async def update_fazenda(
    fazenda_id: UUID,
    data: FazendaUpdate,
    service: FazendaService = Depends(get_service)
):
    return await service.update(fazenda_id, data)


@router.delete("/{fazenda_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fazenda(
    fazenda_id: UUID,
    service: FazendaService = Depends(get_service)
):
    await service.soft_delete(fazenda_id)