from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, and_, or_, extract, text
from sqlalchemy.ext.asyncio import AsyncSession

from models.animal_model import AnimalModel
from models.inseminacao_model import InseminacaoModel
from models.diagnostico_model import DiagnosticoModel
from models.alerta_model import AlertaModel
from models.enums import EspecieAnimal, ResultadoDiagnostico, PrioridadeAlerta


class DashboardRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def kpis(self, usuario_id: Optional[UUID] = None) -> dict:
        now = datetime.now(timezone.utc)
        now_naive = now.replace(tzinfo=None)
        mes_ini = now_naive.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        mes_ant_ini = (mes_ini - timedelta(days=1)).replace(day=1)

        # Filtro de fazendas do usuário
        from models.fazenda_model import FazendaModel
        fazenda_sub = None
        if usuario_id:
            fazenda_sub = select(FazendaModel.fazenda_id).where(
                FazendaModel.usuario_id == usuario_id, FazendaModel.ativo == True
            )

        # 1. Total de animais por espécie
        animal_filtro = [AnimalModel.ativo == True]
        if fazenda_sub is not None:
            animal_filtro.append(AnimalModel.fazenda_id.in_(fazenda_sub))

        por_especie = (await self.session.execute(
            select(AnimalModel.especie, func.count().label("n"))
            .where(and_(*animal_filtro))
            .group_by(AnimalModel.especie)
        )).all()

        total_animais = sum(r.n for r in por_especie)
        animais_por_especie = {r.especie.value.lower(): r.n for r in por_especie}

        # 2. Inseminações do mês atual vs anterior
        def ins_filtro(ini, fim):
            f = [InseminacaoModel.data_inseminacao >= ini, InseminacaoModel.data_inseminacao < fim]
            if fazenda_sub is not None:
                f.append(InseminacaoModel.animal_id.in_(
                    select(AnimalModel.animal_id).where(AnimalModel.fazenda_id.in_(fazenda_sub))
                ))
            return f

        ins_mes_atual = (await self.session.execute(
            select(func.count()).where(and_(*ins_filtro(mes_ini, now_naive)))
        )).scalar_one()

        ins_mes_ant = (await self.session.execute(
            select(func.count()).where(and_(*ins_filtro(mes_ant_ini, mes_ini)))
        )).scalar_one()

        delta_pct = None
        sentido = "neutro"
        if ins_mes_ant and ins_mes_ant > 0:
            delta_pct = round((ins_mes_atual - ins_mes_ant) / ins_mes_ant * 100, 1)
            sentido = "positivo" if delta_pct >= 0 else "negativo"

        # 3. Taxa de prenhez últimos 12 meses
        doze_meses = now_naive - timedelta(days=365)
        diag_filtro = [InseminacaoModel.data_inseminacao >= doze_meses]
        if fazenda_sub is not None:
            diag_filtro.append(InseminacaoModel.animal_id.in_(
                select(AnimalModel.animal_id).where(AnimalModel.fazenda_id.in_(fazenda_sub))
            ))

        total_diag = (await self.session.execute(
            select(func.count())
            .select_from(InseminacaoModel)
            .join(DiagnosticoModel, DiagnosticoModel.inseminacao_id == InseminacaoModel.inseminacao_id)
            .where(and_(*diag_filtro), DiagnosticoModel.resultado.in_([ResultadoDiagnostico.PRENHA, ResultadoDiagnostico.VAZIA]))
        )).scalar_one()

        prenhezes_12m = (await self.session.execute(
            select(func.count())
            .select_from(InseminacaoModel)
            .join(DiagnosticoModel, DiagnosticoModel.inseminacao_id == InseminacaoModel.inseminacao_id)
            .where(and_(*diag_filtro), DiagnosticoModel.resultado == ResultadoDiagnostico.PRENHA)
        )).scalar_one()

        taxa_prenhez = round(prenhezes_12m / total_diag, 3) if total_diag else None

        # 4. Alertas ativos
        alertas = (await self.session.execute(
            select(AlertaModel.prioridade, func.count().label("n"))
            .where(AlertaModel.resolvido == False)
            .group_by(AlertaModel.prioridade)
        )).all()

        total_alertas = sum(r.n for r in alertas)
        criticos = next((r.n for r in alertas if r.prioridade == PrioridadeAlerta.CRITICA), 0)
        altas    = next((r.n for r in alertas if r.prioridade == PrioridadeAlerta.ALTA), 0)

        return {
            "total_animais":    {"total": total_animais, "por_especie": animais_por_especie},
            "inseminacoes_mes": {"total": ins_mes_atual, "delta_pct": delta_pct, "sentido": sentido},
            "taxa_prenhez":     {"valor": taxa_prenhez, "percentual": int(taxa_prenhez * 100) if taxa_prenhez else None, "periodo": "ultimos_12_meses"},
            "alertas_ativos":   {"total": total_alertas, "criticos": criticos, "altas": altas},
            "calculado_em":     now.isoformat(),
        }

    async def grafico_reprodutivo(self, usuario_id: Optional[UUID] = None, meses: int = 6) -> dict:
        from models.fazenda_model import FazendaModel
        now = datetime.now(timezone.utc)
        inicio = now.replace(tzinfo=None) - timedelta(days=meses * 30)

        fazenda_sub = None
        if usuario_id:
            fazenda_sub = select(FazendaModel.fazenda_id).where(
                FazendaModel.usuario_id == usuario_id, FazendaModel.ativo == True
            )

        filtros = [InseminacaoModel.data_inseminacao >= inicio]
        if fazenda_sub is not None:
            filtros.append(InseminacaoModel.animal_id.in_(
                select(AnimalModel.animal_id).where(AnimalModel.fazenda_id.in_(fazenda_sub))
            ))

        rows = (await self.session.execute(
            select(
                extract("year",  InseminacaoModel.data_inseminacao).label("ano"),
                extract("month", InseminacaoModel.data_inseminacao).label("mes"),
                func.count().label("ins"),
                func.sum(func.cast(DiagnosticoModel.resultado == ResultadoDiagnostico.PRENHA, type_=None)).label("pre"),
                func.count(DiagnosticoModel.diagnostico_id).label("diag"),
            )
            .select_from(InseminacaoModel)
            .outerjoin(DiagnosticoModel, DiagnosticoModel.inseminacao_id == InseminacaoModel.inseminacao_id)
            .where(and_(*filtros))
            .group_by("ano", "mes")
            .order_by("ano", "mes")
        )).all()

        labels, inseminacoes, taxas = [], [], []
        for r in rows:
            labels.append(f"{int(r.mes):02d}/{str(int(r.ano))[2:]}")
            inseminacoes.append(r.ins)
            taxa = round((r.pre or 0) / r.diag, 3) if r.diag else None
            taxas.append(taxa)

        return {"labels": labels, "inseminacoes": inseminacoes, "taxa_prenhez": taxas, "periodo": {"inicio": inicio.date().isoformat(), "fim": now.date().isoformat()}}

    async def timeline(self, usuario_id: Optional[UUID] = None, limit: int = 8) -> list[dict]:
        from models.fazenda_model import FazendaModel
        from models.pesagem_model import PesagemModel
        from models.parto_model import PartoModel
        from models.ocorrencia_model import OcorrenciaModel
        from models.user_model import User

        # Simplificado: retorna últimas inseminações e diagnósticos
        ins_rows = (await self.session.execute(
            select(
                InseminacaoModel.inseminacao_id,
                InseminacaoModel.animal_id,
                InseminacaoModel.created_at,
                InseminacaoModel.tipo,
                User.nome.label("usuario_nome"),
                AnimalModel.codigo.label("animal_codigo"),
                AnimalModel.nome.label("animal_nome"),
            )
            .join(User,        User.usuario_id == InseminacaoModel.tecnico_id)
            .join(AnimalModel, AnimalModel.animal_id == InseminacaoModel.animal_id)
            .order_by(InseminacaoModel.created_at.desc())
            .limit(limit)
        )).all()

        result = []
        for r in ins_rows:
            result.append({
                "id":       str(r.inseminacao_id),
                "tipo":     "INSEMINACAO",
                "animal": {
                    "id":     str(r.animal_id),
                    "codigo": r.animal_codigo,
                    "nome":   r.animal_nome,
                },
                "usuario":  r.usuario_nome,
                "descricao": f"Inseminação {r.tipo.value} registrada",
                "data":     r.created_at.isoformat() if r.created_at else None,
            })

        return sorted(result, key=lambda x: x["data"] or "", reverse=True)[:limit]
