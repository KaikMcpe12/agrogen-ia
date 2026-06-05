from fastapi import APIRouter, Depends, Query, status
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from services.fazenda_service import FazendaService
from schemas.fazenda_schema import FazendaCreate, FazendaUpdate
from models.fazenda_model import FazendaModel

router = APIRouter(prefix="/fazendas", tags=["Fazendas"])


async def get_service(session: AsyncSession = Depends(get_db)) -> FazendaService:
    return FazendaService(session)


def _serialize(f: FazendaModel, total_animais: int = 0) -> dict:
    return {
        "id":                 str(f.fazenda_id),
        "nome":               f.nome,
        "municipio":          f.municipio,
        "estado":             f.estado,
        "area_hectares":      float(f.area_hectares) if f.area_hectares else None,
        "tipo_producao":      f.tipo_producao.value if f.tipo_producao else None,
        "capacidade_rebanho": f.capacidade_rebanho,
        "lat":                float(f.latitude)  if f.latitude  else None,
        "lng":                float(f.longitude) if f.longitude else None,
        "ativa":              f.ativo,
        "total_animais":      total_animais,
        "created_at":         f.created_at.isoformat(),
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_fazenda(
    data: FazendaCreate,
    current_user: User = Depends(get_current_user),
    service: FazendaService = Depends(get_service),
):
    f = await service.create(data, usuario_id=current_user.usuario_id)
    return {"success": True, "data": _serialize(f)}


@router.get("")
async def list_fazendas(
    estado:           Optional[str] = None,
    incluir_inativos: bool          = Query(False),
    limit:            int           = Query(10, ge=1, le=100),
    offset:           int           = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    service: FazendaService = Depends(get_service),
):
    items = await service.list_all(
        usuario_id=current_user.usuario_id,
        estado=estado,
        incluir_inativos=incluir_inativos,
        limit=limit,
        offset=offset,
    )
    return {"success": True, "data": [_serialize(f) for f in items]}


@router.get("/{fazenda_id}")
async def get_fazenda(
    fazenda_id: UUID,
    service: FazendaService = Depends(get_service),
):
    f = await service.get_by_id(fazenda_id)
    return {"success": True, "data": _serialize(f)}


@router.put("/{fazenda_id}")
async def update_fazenda(
    fazenda_id: UUID,
    data: FazendaUpdate,
    service: FazendaService = Depends(get_service),
):
    f = await service.update(fazenda_id, data)
    return {"success": True, "data": _serialize(f)}


@router.delete("/{fazenda_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fazenda(
    fazenda_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FazendaService = Depends(get_service),
):
    await service.soft_delete(fazenda_id, usuario_id=current_user.usuario_id)
