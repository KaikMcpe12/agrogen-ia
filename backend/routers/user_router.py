from fastapi import APIRouter, Depends, Query, status
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.user_service import UserService
from schemas.user_schema import UserCreate, UserUpdate, UserResponse
from models.enums import Perfil

router = APIRouter(prefix="/users", tags=["Usuários"])


async def get_service(session: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(session)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    service: UserService = Depends(get_service)
):
    return await service.create(data)


@router.get("", response_model=list[UserResponse])
async def list_users(
    perfil: Optional[Perfil] = None,
    incluir_inativos: bool = Query(False),
    limit:  int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: UserService = Depends(get_service)
):
    return await service.list_all(
        perfil=perfil,
        limit=limit,
        offset=offset,
        incluir_inativos=incluir_inativos,
    )


@router.get("/{usuario_id}", response_model=UserResponse)
async def get_user(
    usuario_id: UUID,
    service: UserService = Depends(get_service)
):
    return await service.get_by_id(usuario_id)


@router.put("/{usuario_id}", response_model=UserResponse)
async def update_user(
    usuario_id: UUID,
    data: UserUpdate,
    service: UserService = Depends(get_service)
):
    return await service.update(usuario_id, data)


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    usuario_id: UUID,
    service: UserService = Depends(get_service)
):
    await service.soft_delete(usuario_id)