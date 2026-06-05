from fastapi import APIRouter, Depends, Query, status
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from services.fazenda_service import FazendaService
from schemas.fazenda_schema import FazendaCreate, FazendaUpdate, FazendaResponse

router = APIRouter(prefix="/fazendas", tags=["Fazendas"])


async def get_service(session: AsyncSession = Depends(get_db)) -> FazendaService:
    return FazendaService(session)


@router.post("", response_model=FazendaResponse, status_code=status.HTTP_201_CREATED)
async def create_fazenda(
    data: FazendaCreate,
    current_user: User = Depends(get_current_user),
    service: FazendaService = Depends(get_service),
):
    return await service.create(data, usuario_id=current_user.usuario_id)


@router.get("", response_model=list[FazendaResponse])
async def list_fazendas(
    estado:           Optional[str]  = None,
    incluir_inativos: bool = Query(False),
    limit:  int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    service: FazendaService = Depends(get_service),
):
    return await service.list_all(
        usuario_id=current_user.usuario_id,
        estado=estado,
        incluir_inativos=incluir_inativos,
        limit=limit,
        offset=offset,
    )


@router.get("/{fazenda_id}", response_model=FazendaResponse)
async def get_fazenda(
    fazenda_id: UUID,
    service: FazendaService = Depends(get_service),
):
    return await service.get_by_id(fazenda_id)


@router.put("/{fazenda_id}", response_model=FazendaResponse)
async def update_fazenda(
    fazenda_id: UUID,
    data: FazendaUpdate,
    service: FazendaService = Depends(get_service),
):
    return await service.update(fazenda_id, data)


@router.delete("/{fazenda_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fazenda(
    fazenda_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FazendaService = Depends(get_service),
):
    await service.soft_delete(fazenda_id, usuario_id=current_user.usuario_id)
