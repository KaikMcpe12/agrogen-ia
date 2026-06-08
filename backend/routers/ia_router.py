from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from services.predicao_service import PredicaoService
from services.padroes_service import PadroesService
from services.ia_client import IAClient
from schemas.predicao_schema import PredicaoRequest
from models.enums import EspecieAnimal


class SelecaoGeneticaRequest(BaseModel):
    fazenda_id:        UUID
    objetivos:         List[str]
    matrizes_ids:      List[UUID]
    reprodutores_ids:  List[UUID]


router = APIRouter(prefix="/ia", tags=["Inteligência Artificial"])


def _svc(session: AsyncSession = Depends(get_db)) -> PredicaoService:
    return PredicaoService(session)


@router.post("/predicao-prenhez")
async def predicao_prenhez(
    data: PredicaoRequest,
    current_user: User = Depends(get_current_user),
    svc: PredicaoService = Depends(_svc),
):
    result = await svc.predizer(data)
    return {"success": True, "data": result}


@router.get("/predicoes/{animal_id}")
async def historico_predicoes(
    animal_id: UUID,
    limit:     int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    svc: PredicaoService = Depends(_svc),
):
    items = await svc.historico(animal_id, limit=limit)
    return {"success": True, "data": items}


@router.get("/padroes-fertilidade")
async def padroes_fertilidade(
    fazenda_id:  Optional[UUID]         = None,
    data_inicio: Optional[date]         = None,
    data_fim:    Optional[date]         = None,
    especie:     Optional[EspecieAnimal] = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    hoje = date.today()
    fim   = data_fim    or hoje
    inicio = data_inicio or (fim - timedelta(days=180))
    svc = PadroesService(session)
    return await svc.padroes_fertilidade(inicio, fim, especie, fazenda_id)


@router.post("/selecao-genetica")
async def selecao_genetica(
    data: SelecaoGeneticaRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    from repositories.dados_geneticos_repository import DadosGeneticosRepository
    from repositories.reprodutor_repository import ReproductorRepository
    from repositories.animal_repository import AnimalRepository

    gen_repo  = DadosGeneticosRepository(session)
    rep_repo  = ReproductorRepository(session)
    ani_repo  = AnimalRepository(session)

    # Mapeamento objetivo → campo DEP
    dep_map = {
        "GANHO_PESO":   "dep_peso_desmame",
        "FERTILIDADE":  "dep_fertilidade",
        "RUSTICIDADE":  None,
        "PROLIFICIDADE": None,
    }

    recomendacoes = []
    for matriz_id in data.matrizes_ids:
        animal = await ani_repo.get_by_id(matriz_id)
        if not animal:
            continue
        gen_matriz = await gen_repo.get_by_animal_id(matriz_id)

        for rep_id in data.reprodutores_ids:
            rep = await rep_repo.get_by_id(rep_id)
            if not rep:
                continue

            # Score genético: média ponderada de DEPs pelos objetivos
            scores = []
            for obj in data.objetivos:
                campo = dep_map.get(obj)
                if campo:
                    val_matriz = float(getattr(gen_matriz, campo, 0) or 0) if gen_matriz else 0
                    val_rep    = float(getattr(rep, campo, 0) or 0)
                    scores.append((val_matriz + val_rep) / 2)
            score_genetico = round(sum(scores) / len(scores), 4) if scores else 0.5

            # Heterose esperada
            heterose_pct = float(gen_matriz.heterose_esperada or 0) if gen_matriz else 0.0

            # Coeficiente de endogamia projetado
            f_matriz = float(gen_matriz.coeficiente_endogamia or 0) if gen_matriz else 0.0
            f_projetado = f_matriz * 0.5  # estimativa simplificada

            alerta = f_projetado > 0.0625

            justificativa = (
                f"Cruzamento {animal.raca_principal or animal.especie.value} × {rep.raca} "
                f"com score genético {score_genetico:.2f} e heterose estimada {heterose_pct:.1f}%."
            )

            recomendacoes.append({
                "matriz":                {"id": str(animal.animal_id), "codigo": animal.codigo, "nome": animal.nome},
                "reprodutor":            {"id": str(rep.reprodutor_id), "nome": rep.nome},
                "score_genetico":        score_genetico,
                "heterose_esperada_pct": heterose_pct,
                "risco_endogamia_f":     round(f_projetado, 4),
                "alerta_consanguinidade": alerta,
                "justificativa":         justificativa,
            })

    recomendacoes.sort(key=lambda r: r["score_genetico"], reverse=True)
    return {"success": True, "data": {"recomendacoes": recomendacoes}}


@router.get("/modelo-info")
async def modelo_info(
    current_user: User = Depends(get_current_user),
):
    from core.ia_rules import PROB_BASE
    client = IAClient()
    info = await client.modelo_info()
    if info:
        return {"success": True, "data": info}
    # Fallback: metadados do motor de regras local
    return {
        "success": True,
        "data": {
            "modelo_versao": "rules_v1.0",
            "tipo": "Motor de Regras Determinístico",
            "status": "microsservico_ml_indisponivel",
            "features_ativas": list(PROB_BASE.keys()),
            "prob_base": PROB_BASE,
        }
    }
