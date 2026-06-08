from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from models.enums import EspecieAnimal, TipoSanitario
from services.relatorio_service import RelatorioService
from services.csv_service import gerar_csv_streaming, nome_arquivo

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])


def _svc(session: AsyncSession = Depends(get_db)) -> RelatorioService:
    return RelatorioService(session)


# ── Reprodutivo ───────────────────────────────────────────────────────────────

@router.get("/reprodutivo")
async def relatorio_reprodutivo(
    data_inicio: date,
    data_fim:    date,
    especie:     Optional[EspecieAnimal] = None,
    tecnico_id:  Optional[UUID]          = None,
    fazenda_id:  Optional[UUID]          = None,
    page:        int                     = Query(1, ge=1),
    limit:       int                     = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    svc: RelatorioService = Depends(_svc),
):
    dados = await svc.reprodutivo(data_inicio, data_fim, especie, tecnico_id, fazenda_id)
    linhas = dados["linhas"]
    total  = len(linhas)
    offset = (page - 1) * limit
    pagina = linhas[offset:offset + limit]
    total_pages = max(1, (total + limit - 1) // limit)
    return {
        "success": True,
        "data":    pagina,
        "indices": dados["indices"],
        "meta": {
            "page": page, "limit": limit, "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
    }


@router.get("/reprodutivo/exportar")
async def exportar_reprodutivo(
    data_inicio: date,
    data_fim:    date,
    formato:     str = Query("csv", pattern="^(csv|pdf)$"),
    especie:     Optional[EspecieAnimal] = None,
    tecnico_id:  Optional[UUID]          = None,
    fazenda_id:  Optional[UUID]          = None,
    current_user: User = Depends(get_current_user),
    svc: RelatorioService = Depends(_svc),
):
    dados = await svc.reprodutivo(data_inicio, data_fim, especie, tecnico_id, fazenda_id)

    if formato == "csv":
        colunas = ["animal_codigo", "animal_nome", "data_inseminacao", "tipo_ia", "reprodutor", "resultado", "tecnico"]
        return gerar_csv_streaming(colunas, dados["linhas"], nome_arquivo("reprodutivo", "csv"))

    from services.pdf_service import gerar_pdf_reprodutivo
    from fastapi.responses import Response
    pdf_bytes = gerar_pdf_reprodutivo(dados["linhas"], dados["indices"], data_inicio, data_fim)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{nome_arquivo("reprodutivo", "pdf")}"'},
    )


# ── Ponderal ─────────────────────────────────────────────────────────────────

@router.get("/ponderal")
async def relatorio_ponderal(
    data_inicio: Optional[date]          = None,
    data_fim:    Optional[date]          = None,
    especie:     Optional[EspecieAnimal] = None,
    fazenda_id:  Optional[UUID]          = None,
    page:        int                     = Query(1, ge=1),
    limit:       int                     = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    svc: RelatorioService = Depends(_svc),
):
    from datetime import timedelta
    hoje  = date.today()
    fim   = data_fim    or hoje
    inicio = data_inicio or (fim - timedelta(days=365))
    dados = await svc.ponderal(inicio, fim, especie, fazenda_id, page, limit)
    total = dados["total"]
    total_pages = max(1, (total + limit - 1) // limit)
    return {
        "success": True,
        "data":    dados["linhas"],
        "meta": {
            "page": page, "limit": limit, "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
    }


@router.get("/ponderal/exportar")
async def exportar_ponderal(
    data_inicio: Optional[date]          = None,
    data_fim:    Optional[date]          = None,
    especie:     Optional[EspecieAnimal] = None,
    fazenda_id:  Optional[UUID]          = None,
    current_user: User = Depends(get_current_user),
    svc: RelatorioService = Depends(_svc),
):
    from datetime import timedelta
    hoje   = date.today()
    fim    = data_fim    or hoje
    inicio = data_inicio or (fim - timedelta(days=365))
    dados  = await svc.ponderal(inicio, fim, especie, fazenda_id, page=1, limit=10000)
    colunas = ["animal_codigo", "nome", "ultima_pesagem_kg", "gmd_periodo", "num_pesagens"]
    return gerar_csv_streaming(colunas, dados["linhas"], nome_arquivo("ponderal", "csv"))


# ── Sanitário ─────────────────────────────────────────────────────────────────

@router.get("/sanitario")
async def relatorio_sanitario(
    data_inicio: date,
    data_fim:    date,
    tipo:        Optional[TipoSanitario] = None,
    fazenda_id:  Optional[UUID]          = None,
    current_user: User = Depends(get_current_user),
    svc: RelatorioService = Depends(_svc),
):
    dados = await svc.sanitario(data_inicio, data_fim, tipo, fazenda_id)
    return {"success": True, "data": dados["linhas"], "total": dados["total"]}


@router.get("/sanitario/exportar")
async def exportar_sanitario(
    data_inicio: date,
    data_fim:    date,
    formato:     str = Query("csv", pattern="^(csv)$"),
    tipo:        Optional[TipoSanitario] = None,
    fazenda_id:  Optional[UUID]          = None,
    current_user: User = Depends(get_current_user),
    svc: RelatorioService = Depends(_svc),
):
    dados = await svc.sanitario(data_inicio, data_fim, tipo, fazenda_id)
    colunas = ["animal_codigo", "animal_nome", "tipo", "produto", "principio_ativo", "data_aplicacao", "proxima_dose", "responsavel"]
    return gerar_csv_streaming(colunas, dados["linhas"], nome_arquivo("sanitario", "csv"))
