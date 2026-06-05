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
    current_user: User = Depends(get_current_user),
    svc: RelatorioService = Depends(_svc),
):
    dados = await svc.reprodutivo(data_inicio, data_fim, especie, tecnico_id, fazenda_id)
    return {"success": True, "data": dados["linhas"], "indices": dados["indices"]}


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
