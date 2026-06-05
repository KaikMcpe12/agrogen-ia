import time
from uuid import UUID, uuid4
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.ia_rules import calcular_score, classificar, AVISO_CLINICO
from models.predicao_log_model import PredicaoLogModel
from repositories.animal_repository import AnimalRepository
from repositories.dados_geneticos_repository import DadosGeneticosRepository
from repositories.inseminacao_repository import InseminacaoRepository
from repositories.reprodutor_repository import ReproductorRepository
from schemas.predicao_schema import PredicaoRequest, PredicaoResponse
from services.ia_client import IAClient

_VERSAO_RULES = "rules_v1.0"


def _gerar_recomendacoes(fatores: list[dict], classificacao: str, features: dict) -> list[str]:
    recs = []
    if classificacao == "FAVORAVEL":
        recs.append("Momento favorável para inseminação. Condições alinhadas com boa probabilidade de prenhez.")
    elif classificacao == "MEDIO":
        recs.append("Há fatores de atenção. Revise os itens abaixo antes de prosseguir.")
    else:
        recs.append("Risco elevado. Considere adiar a inseminação ou ajustar o manejo.")

    for f in fatores[:3]:
        if f["sentido"] == "negativo":
            if f["feature"] == "condicao_corporal":
                recs.append(f"Condição corporal ({f['valor_atual']}) fora do ideal (3–4). Ajuste a nutrição antes da inseminação.")
            elif f["feature"] == "intervalo_pos_parto_dias":
                recs.append(f"Intervalo pós-parto ({f['valor_atual']} dias) abaixo do recomendado (≥ 60 dias).")
            elif f["feature"] == "temperatura_ambiente_c":
                recs.append(f"Temperatura ({f['valor_atual']}°C) elevada. Realize o procedimento nas horas mais frescas.")
            elif f["feature"] == "coeficiente_endogamia":
                recs.append("Risco de consanguinidade detectado. Considere um reprodutor de raça/linhagem diferente.")
        elif f["sentido"] == "positivo" and f["feature"] == "dep_fertilidade_somada":
            recs.append("DEP de fertilidade elevado do reprodutor — cruzamento geneticamente favorável.")
    return recs[:4]


class PredicaoService:
    def __init__(self, session: AsyncSession) -> None:
        self.session       = session
        self.animal_repo   = AnimalRepository(session)
        self.gen_repo      = DadosGeneticosRepository(session)
        self.ins_repo      = InseminacaoRepository(session)
        self.rep_repo      = ReproductorRepository(session)
        self.ia_client     = IAClient()

    async def predizer(self, schema: PredicaoRequest) -> PredicaoResponse:
        t0 = time.monotonic()

        animal = await self.animal_repo.get_by_id(schema.animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")

        cc_atual = schema.condicao_corporal_atual
        if cc_atual is None:
            cc_atual = int(animal.condicao_corporal) if animal.condicao_corporal else 3

        gen = await self.gen_repo.get_by_animal_id(animal.animal_id)
        ultima_ins, _ = await self.ins_repo.list_all(animal_id=animal.animal_id, limit=1)

        # Calcula histórico de taxa de prenhez
        todas_ins, total_ins = await self.ins_repo.list_all(animal_id=animal.animal_id, limit=500)
        prenhezes = sum(1 for i in todas_ins if i.resultado.value == "PRENHA")
        hist_taxa = (prenhezes / total_ins) if total_ins > 0 else None

        # Monta features
        dep_fert_animal = float(gen.dep_fertilidade) if gen and gen.dep_fertilidade else 0.0
        dep_fert_rep = 0.0
        dep_acc_rep = 1.0
        heterose = 0.0
        if schema.reprodutor_candidato_id:
            rep = await self.rep_repo.get_by_id(schema.reprodutor_candidato_id)
            if rep:
                dep_fert_rep = float(rep.dep_fertilidade or 0)
                dep_acc_rep  = float(rep.dep_acuracia or 1.0)

        dias_pos_parto = None
        if animal.data_ultimo_parto:
            from datetime import date
            dias_pos_parto = (date.today() - animal.data_ultimo_parto).days

        dias_ultima_ins = None
        if ultima_ins:
            from datetime import timezone as tz
            ins_dt = ultima_ins[0].data_inseminacao
            if ins_dt.tzinfo is None:
                ins_dt = ins_dt.replace(tzinfo=tz.utc)
            dias_ultima_ins = (datetime.now(tz.utc) - ins_dt).days

        features = {
            "especie":                      animal.especie.value,
            "condicao_corporal":            float(cc_atual),
            "intervalo_pos_parto_dias":     dias_pos_parto,
            "num_partos_anteriores":        animal.num_partos,
            "historico_taxa_prenhez":       hist_taxa,
            "dias_desde_ultima_inseminacao": dias_ultima_ins,
            "tipo_inseminacao":             ultima_ins[0].tipo.value if ultima_ins else None,
            "temperatura_ambiente_c":       float(schema.temperatura_ambiente_c) if schema.temperatura_ambiente_c else None,
            "raca_femea":                   animal.raca_principal,
            "heterose_esperada_pct":        heterose,
            "coeficiente_endogamia":        float(gen.coeficiente_endogamia) if gen and gen.coeficiente_endogamia else None,
            "dep_fertilidade_somada":       dep_fert_animal + dep_fert_rep,
            "dep_acuracia_media":           dep_acc_rep,
        }

        # Tenta microsserviço ML; fallback para motor local
        ml_result = await self.ia_client.predict(features)
        if ml_result:
            score        = float(ml_result.get("score", 0.5))
            fatores      = ml_result.get("top_5_fatores", [])
            versao       = ml_result.get("modelo_versao", "ml_unknown")
            origem       = "ml"
            elapsed_ms   = ml_result.get("processado_em_ms", 0)
        else:
            score, fatores = calcular_score(features)
            versao         = _VERSAO_RULES
            origem         = "rules"
            elapsed_ms     = int((time.monotonic() - t0) * 1000)

        classif = classificar(score)

        # Persiste log de auditoria
        log = PredicaoLogModel(
            animal_id        = animal.animal_id,
            tecnico_id       = schema.tecnico_id,
            features_entrada = features,
            score_retornado  = score,
            classificacao    = classif,
            top_5_fatores    = fatores,
            modelo_versao    = versao,
            origem           = origem,
        )
        self.session.add(log)
        await self.session.commit()
        await self.session.refresh(log)

        recs = _gerar_recomendacoes(fatores, classif, features)

        return PredicaoResponse(
            predicao_id           = log.predicao_id,
            animal_id             = animal.animal_id,
            score_prenhez         = score,
            score_percentual      = int(score * 100),
            classificacao         = classif,
            fatores_determinantes = fatores,
            recomendacoes         = recs,
            aviso_clinico         = AVISO_CLINICO,
            modelo_versao         = versao,
            motor_utilizado       = origem,
            processado_em_ms      = elapsed_ms,
            created_at            = log.created_at,
        )

    async def historico(self, animal_id: UUID, limit: int = 10) -> list[PredicaoLogModel]:
        from sqlalchemy import select
        stmt = (
            select(PredicaoLogModel)
            .where(PredicaoLogModel.animal_id == animal_id)
            .order_by(PredicaoLogModel.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
