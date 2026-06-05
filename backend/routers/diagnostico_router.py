from fastapi import APIRouter, Depends, Query, status
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.diagnostico_service import DiagnosticoService
from schemas.diagnostico_schema import DiagnosticoCreate, DiagnosticoUpdate, DiagnosticoResponse
from models.enums import ResultadoDiagnostico

router = APIRouter(prefix="/diagnosticos", tags=["Diagnósticos"])


async def get_service(session: AsyncSession = Depends(get_db)) -> DiagnosticoService:
    return DiagnosticoService(session)


@router.post("", response_model=DiagnosticoResponse, status_code=status.HTTP_201_CREATED)
async def create_diagnostico(
    data: DiagnosticoCreate,
    service: DiagnosticoService = Depends(get_service)
):
    return await service.create(data)


@router.get("", response_model=list[DiagnosticoResponse])
async def list_diagnosticos(
    animal_id:  Optional[UUID]               = None,
    resultado:  Optional[ResultadoDiagnostico] = None,
    limit:  int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: DiagnosticoService = Depends(get_service)
):
    return await service.list_by_animal(
        animal_id=animal_id,
        resultado=resultado,
        limit=limit,
        offset=offset,
    )


@router.get("/{diagnostico_id}", response_model=DiagnosticoResponse)
async def get_diagnostico(
    diagnostico_id: UUID,
    service: DiagnosticoService = Depends(get_service)
):
    return await service.get_by_id(diagnostico_id)


@router.put("/{diagnostico_id}", response_model=DiagnosticoResponse)
async def update_diagnostico(
    diagnostico_id: UUID,
    data: DiagnosticoUpdate,
    service: DiagnosticoService = Depends(get_service)
):
    return await service.update(diagnostico_id, data)


@router.delete("/{diagnostico_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_diagnostico(
    diagnostico_id: UUID,
    service: DiagnosticoService = Depends(get_service)
):
    await service.delete(diagnostico_id)