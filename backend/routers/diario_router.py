from fastapi import APIRouter, Depends, Query, status
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from models.enums import EstagioPesagem, TipoSanitario, CategoriaOcorrencia
from schemas.pesagem_schema import PesagemCreate, PesagemResponse
from schemas.parto_schema import PartoCreate, PartoResponse

router = APIRouter(prefix="/diario", tags=["Diário de Bordo"])


def _pesagem_service(session: AsyncSession = Depends(get_db)):
    from services.pesagem_service import PesagemService
    return PesagemService(session)


def _parto_service(session: AsyncSession = Depends(get_db)):
    from services.parto_service import PartoService
    return PartoService(session)


def _sanitario_service(session: AsyncSession = Depends(get_db)):
    from services.evento_sanitario_service import EventoSanitarioService
    return EventoSanitarioService(session)


def _ocorrencia_service(session: AsyncSession = Depends(get_db)):
    from services.ocorrencia_service import OcorrenciaService
    return OcorrenciaService(session)


# ── DIA-01: Listar pesagens ───────────────────────────────────────────────────

@router.get("/{animal_id}/pesagens", response_model=None)
async def list_pesagens(
    animal_id: UUID,
    estagio:   Optional[EstagioPesagem] = None,
    limit:     int = Query(20, ge=1, le=100),
    offset:    int = Query(0, ge=0),
    svc = Depends(_pesagem_service),
):
    resultado = await svc.list_by_animal(animal_id, estagio=estagio, limit=limit, offset=offset)
    return {"success": True, "data": resultado["items"], "resumo": resultado["resumo"]}


# ── DIA-02: Registrar pesagem ─────────────────────────────────────────────────

@router.post("/{animal_id}/pesagens", response_model=PesagemResponse, status_code=status.HTTP_201_CREATED)
async def create_pesagem(
    animal_id: UUID,
    data: PesagemCreate,
    current_user: User = Depends(get_current_user),
    svc = Depends(_pesagem_service),
):
    return await svc.create(animal_id, data)


# ── DIA-03: Listar partos ─────────────────────────────────────────────────────

@router.get("/{animal_id}/partos")
async def list_partos(
    animal_id: UUID,
    limit:     int = Query(10, ge=1, le=50),
    offset:    int = Query(0, ge=0),
    svc = Depends(_parto_service),
):
    resultado = await svc.list_by_animal(animal_id, limit=limit, offset=offset)
    return {"success": True, "data": resultado}


# ── DIA-04: Registrar parto ───────────────────────────────────────────────────

@router.post("/{animal_id}/partos", status_code=status.HTTP_201_CREATED)
async def create_parto(
    animal_id: UUID,
    data: PartoCreate,
    current_user: User = Depends(get_current_user),
    svc = Depends(_parto_service),
):
    resultado = await svc.create(animal_id, data)
    return {"success": True, "data": resultado}


# ── DIA-05: Listar eventos sanitários ────────────────────────────────────────

@router.get("/{animal_id}/sanitario")
async def list_sanitario(
    animal_id: UUID,
    tipo:      Optional[TipoSanitario] = None,
    limit:     int = Query(20, ge=1, le=100),
    offset:    int = Query(0, ge=0),
    svc = Depends(_sanitario_service),
):
    items = await svc.list_by_animal(animal_id, tipo=tipo, limit=limit, offset=offset)
    return {"success": True, "data": items}


# ── DIA-06: Registrar evento sanitário ───────────────────────────────────────

@router.post("/{animal_id}/sanitario", status_code=status.HTTP_201_CREATED)
async def create_sanitario(
    animal_id: UUID,
    data,
    current_user: User = Depends(get_current_user),
    svc = Depends(_sanitario_service),
):
    resultado = await svc.create(animal_id, data, current_user.usuario_id)
    return {"success": True, "data": resultado}


# ── DIA-07: Listar ocorrências ────────────────────────────────────────────────

@router.get("/{animal_id}/ocorrencias")
async def list_ocorrencias(
    animal_id:            UUID,
    categoria:            Optional[CategoriaOcorrencia] = None,
    apenas_nao_resolvidas: bool = Query(False),
    limit:                int  = Query(20, ge=1, le=100),
    offset:               int  = Query(0, ge=0),
    svc = Depends(_ocorrencia_service),
):
    items = await svc.list_by_animal(
        animal_id, categoria=categoria,
        apenas_nao_resolvidas=apenas_nao_resolvidas,
        limit=limit, offset=offset,
    )
    return {"success": True, "data": items}


# ── DIA-08: Registrar ocorrência ──────────────────────────────────────────────

@router.post("/{animal_id}/ocorrencias", status_code=status.HTTP_201_CREATED)
async def create_ocorrencia(
    animal_id: UUID,
    data,
    current_user: User = Depends(get_current_user),
    svc = Depends(_ocorrencia_service),
):
    resultado = await svc.create(animal_id, data)
    return {"success": True, "data": resultado}


# ── Resolver ocorrência ───────────────────────────────────────────────────────

@router.patch("/{animal_id}/ocorrencias/{ocorrencia_id}/resolver")
async def resolver_ocorrencia(
    animal_id:     UUID,
    ocorrencia_id: UUID,
    current_user:  User = Depends(get_current_user),
    svc = Depends(_ocorrencia_service),
):
    resultado = await svc.marcar_resolvida(ocorrencia_id)
    return {"success": True, "data": resultado}
