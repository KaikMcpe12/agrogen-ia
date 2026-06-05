import csv
import io
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, status
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from services.animal_service import AnimalService
from schemas import AnimalCreate, AnimalUpdate, AnimalResponse
from schemas.common import PaginatedEnvelope, PaginatedMeta
from models.enums import EspecieAnimal, SexoAnimal, StatusAnimal

router = APIRouter(prefix="/animais", tags=["Animais"])

_RACAS: dict[str, list[str]] = {
    "BOVINO":  ["Nelore", "Angus", "Gir", "Guzerá", "Tabapuã", "Brahman", "Simmental", "Caracu", "Canchim"],
    "OVINO":   ["Santa Inês", "Morada Nova", "Dorper", "Suffolk", "Somalis Brasileira", "Bergamácia"],
    "CAPRINO": ["Saanen", "Anglo-nubiano", "Boer", "Moxotó", "Canindé", "Azul"],
}


async def get_service(session: AsyncSession = Depends(get_db)) -> AnimalService:
    return AnimalService(session)


# ── ANI-07: deve vir ANTES de /{animal_id} para não ser capturado como UUID ──

@router.get("/counts")
async def counts(
    fazenda_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select, func, and_
    from models.animal_model import AnimalModel

    filtros = [AnimalModel.ativo == True]
    if fazenda_id:
        filtros.append(AnimalModel.fazenda_id == fazenda_id)

    rows_especie = (await session.execute(
        select(AnimalModel.especie, func.count().label("n"))
        .where(and_(*filtros))
        .group_by(AnimalModel.especie)
    )).all()

    rows_status = (await session.execute(
        select(AnimalModel.status, func.count().label("n"))
        .where(and_(*filtros))
        .group_by(AnimalModel.status)
    )).all()

    total = sum(r.n for r in rows_especie)
    return {"success": True, "data": {
        "total":       total,
        "por_especie": {r.especie.value: r.n for r in rows_especie},
        "por_status":  {r.status.value:  r.n for r in rows_status},
    }}


@router.get("/racas", tags=["Animais"])
async def list_racas(especie: Optional[EspecieAnimal] = None):
    if especie:
        return {"success": True, "data": {especie.value: _RACAS.get(especie.value, [])}}
    return {"success": True, "data": _RACAS}


# ── ANI-01: listagem com filtros avançados e paginação ────────────────────────

@router.get("", response_model=PaginatedEnvelope[AnimalResponse])
async def list_animals(
    fazenda_id:       Optional[UUID]         = None,
    especie:          Optional[EspecieAnimal] = None,
    sexo:             Optional[SexoAnimal]    = None,
    status_animal:    Optional[StatusAnimal]  = Query(None, alias="status"),
    q:                Optional[str]           = Query(None, min_length=2, description="Busca por nome ou código"),
    raca:             Optional[str]           = None,
    sort:             str                     = Query("nome", pattern="^(nome|codigo|data_nascimento|status)$"),
    order:            str                     = Query("asc", pattern="^(asc|desc)$"),
    page:             int                     = Query(1, ge=1),
    limit:            int                     = Query(20, ge=1, le=100),
    incluir_inativos: bool                    = Query(False),
    service: AnimalService = Depends(get_service),
):
    offset = (page - 1) * limit
    items, total = await service.list_all(
        fazenda_id=fazenda_id,
        especie=especie,
        sexo=sexo,
        status_animal=status_animal,
        q=q,
        raca=raca,
        sort=sort,
        order=order,
        limit=limit,
        offset=offset,
        incluir_inativos=incluir_inativos,
    )
    total_pages = max(1, (total + limit - 1) // limit)
    return PaginatedEnvelope(
        data=items,
        meta=PaginatedMeta(
            total=total, page=page, limit=limit, total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        ),
    )


# ── ANI-02: criação ───────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_animal(
    animal_in: AnimalCreate,
    service: AnimalService = Depends(get_service),
):
    return {"success": True, "data": await service.create(animal_in)}


# ── ANI-08: importação CSV ────────────────────────────────────────────────────

@router.post(
    "/importar-csv",
    tags=["Animais"],
    summary="Importa animais em lote via CSV",
    description=(
        "Colunas esperadas no CSV (separador vírgula):\n\n"
        "`nome,especie,sexo,data_nascimento,peso_inicial_kg,condicao_corporal,"
        "raca_principal,brinco,observacoes`\n\n"
        "Linhas válidas são persistidas mesmo que outras falhem."
    ),
)
async def importar_csv(
    fazenda_id: UUID = Form(...),
    arquivo: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    service: AnimalService = Depends(get_service),
):
    conteudo = await arquivo.read()
    return await service.import_csv(conteudo, fazenda_id)


# ── ANI-03: detalhe ───────────────────────────────────────────────────────────

@router.get("/{animal_id}")
async def get_animal(
    animal_id: UUID,
    service: AnimalService = Depends(get_service),
):
    return {"success": True, "data": await service.get_by_id(animal_id)}


# ── ANI-06: histórico ─────────────────────────────────────────────────────────

@router.get("/{animal_id}/historico", tags=["Animais"])
async def get_historico(
    animal_id: UUID,
    limit: int = Query(10, ge=1, le=50),
    service: AnimalService = Depends(get_service),
    session: AsyncSession = Depends(get_db),
):
    animal = await service.get_by_id(animal_id)

    from repositories.inseminacao_repository import InseminacaoRepository
    from repositories.pesagem_repository import PesagemRepository
    from repositories.parto_repository import PartoRepository

    inseminacoes = await InseminacaoRepository(session).list_all(animal_id=animal.animal_id, limit=limit)
    pesagens     = await PesagemRepository(session).list_by_animal(animal_id=animal.animal_id, limit=limit)
    partos       = await PartoRepository(session).list_by_animal(animal_id=animal.animal_id, limit=limit)

    def _serialize(obj):
        from sqlalchemy.orm import DeclarativeBase
        if hasattr(obj, "__table__"):
            return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
        return str(obj)

    return {
        "success": True,
        "data": {
            "animal_id": str(animal_id),
            "inseminacoes": [_serialize(i) for i in inseminacoes],
            "pesagens":     [_serialize(p) for p in pesagens],
            "partos":       [_serialize(p) for p in partos],
        },
    }


# ── ANI-04: update ────────────────────────────────────────────────────────────

@router.put("/{animal_id}")
async def update_animal(
    animal_id: UUID,
    animal_in: AnimalUpdate,
    service: AnimalService = Depends(get_service),
):
    return {"success": True, "data": await service.update(animal_id, animal_in)}


# ── ANI-05: soft delete ───────────────────────────────────────────────────────

@router.delete("/{animal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_animal(
    animal_id: UUID,
    service: AnimalService = Depends(get_service),
):
    await service.soft_delete(animal_id)
