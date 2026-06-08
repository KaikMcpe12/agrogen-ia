from fastapi import APIRouter, Depends, Query, Response, status
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from models.enums import EstagioPesagem, TipoSanitario, CategoriaOcorrencia
from schemas.pesagem_schema import PesagemCreate, PesagemUpdate, PesagemResponse
from schemas.parto_schema import PartoCreate, PartoResponse
from schemas.evento_sanitario_schema import EventoSanitarioCreate
from schemas.ocorrencia_schema import OcorrenciaCreate
from schemas.common import PaginatedMeta

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
    page:      int = Query(1, ge=1),
    limit:     int = Query(20, ge=1, le=100),
    svc = Depends(_pesagem_service),
):
    offset    = (page - 1) * limit
    resultado = await svc.list_by_animal(animal_id, estagio=estagio, limit=limit, offset=offset)
    items     = resultado["items"]
    total     = resultado["resumo"].get("total_registros", len(items))
    total_pages = max(1, (total + limit - 1) // limit)
    return {
        "success": True,
        "data":    items,
        "resumo":  resultado["resumo"],
        "meta": PaginatedMeta(
            total=total, page=page, limit=limit, total_pages=total_pages,
            has_next=page < total_pages, has_prev=page > 1,
        ).model_dump(),
    }


# ── DIA-02: Registrar pesagem ─────────────────────────────────────────────────

@router.post("/{animal_id}/pesagens", response_model=PesagemResponse, status_code=status.HTTP_201_CREATED)
async def create_pesagem(
    animal_id: UUID,
    data: PesagemCreate,
    current_user: User = Depends(get_current_user),
    svc = Depends(_pesagem_service),
):
    return await svc.create(animal_id, data)


# ── DIA-10: Atualizar pesagem ─────────────────────────────────────────────────

@router.patch("/{animal_id}/pesagens/{pesagem_id}", response_model=PesagemResponse)
async def update_pesagem(
    animal_id:  UUID,
    pesagem_id: UUID,
    data: PesagemUpdate,
    current_user: User = Depends(get_current_user),
    svc = Depends(_pesagem_service),
):
    return await svc.update(pesagem_id, data)


# ── DIA-03: Listar partos ─────────────────────────────────────────────────────

@router.get("/{animal_id}/partos")
async def list_partos(
    animal_id: UUID,
    page:      int = Query(1, ge=1),
    limit:     int = Query(10, ge=1, le=50),
    svc = Depends(_parto_service),
):
    offset    = (page - 1) * limit
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
    session: AsyncSession = Depends(get_db),
):
    items = await svc.list_by_animal(animal_id, tipo=tipo, limit=limit, offset=offset)

    # Conta alertas PROXIMA_DOSE ativos para este animal
    from repositories.alerta_repository import AlertaRepository
    from models.enums import TipoAlerta
    alerta_repo = AlertaRepository(session)
    alertas_proxima_dose = len(await alerta_repo.list_pendentes(
        animal_id=animal_id, tipo=TipoAlerta.PROXIMA_DOSE, limit=100
    ))

    return {
        "success": True,
        "data":    items,
        "alertas_proxima_dose": alertas_proxima_dose,
    }


# ── DIA-06: Registrar evento sanitário ───────────────────────────────────────

@router.post("/{animal_id}/sanitario", status_code=status.HTTP_201_CREATED)
async def create_sanitario(
    animal_id: UUID,
    data: EventoSanitarioCreate,
    current_user: User = Depends(get_current_user),
    svc = Depends(_sanitario_service),
):
    resultado = await svc.create(animal_id, data, current_user.usuario_id)
    return {"success": True, "data": resultado}


# ── DIA-07: Listar ocorrências ────────────────────────────────────────────────

@router.get("/{animal_id}/ocorrencias")
async def list_ocorrencias(
    animal_id: UUID,
    categoria: Optional[CategoriaOcorrencia] = None,
    resolvida: Optional[bool]                = None,
    limit:     int  = Query(20, ge=1, le=100),
    offset:    int  = Query(0, ge=0),
    svc = Depends(_ocorrencia_service),
):
    # Converte resolvida → apenas_nao_resolvidas para o service existente
    apenas_nao_resolvidas = False if resolvida is None else (not resolvida)
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
    data: OcorrenciaCreate,
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


# ── DIA-09: Exportar PDF da ficha zootécnica ──────────────────────────────────

@router.get("/{animal_id}/exportar-pdf")
async def exportar_pdf_ficha(
    animal_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    from services.animal_service import AnimalService
    from services.pesagem_service import PesagemService
    from services.parto_service import PartoService

    animal_svc  = AnimalService(session)
    pesagem_svc = PesagemService(session)
    parto_svc   = PartoService(session)

    animal_dict = await animal_svc.get_by_id(animal_id)
    pesagens    = await pesagem_svc.list_by_animal(animal_id, limit=20, offset=0)
    partos      = await parto_svc.list_by_animal(animal_id, limit=10, offset=0)

    from services.pdf_service import gerar_pdf_ficha_animal
    pdf_bytes = gerar_pdf_ficha_animal(animal_dict, pesagens["items"], partos)

    codigo = animal_dict.get("codigo", "animal")
    nome   = animal_dict.get("nome", "")
    from datetime import date
    filename = f"ficha-{codigo}-{nome}-{date.today()}.pdf".replace(" ", "-")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
