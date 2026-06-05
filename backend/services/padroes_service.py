from datetime import date
from typing import Optional

from sqlalchemy import select, func, extract, and_, Integer
from sqlalchemy.ext.asyncio import AsyncSession

from models.inseminacao_model import InseminacaoModel
from models.diagnostico_model import DiagnosticoModel
from models.animal_model import AnimalModel
from models.enums import EspecieAnimal, ResultadoDiagnostico

_MIN_INSEMINACOES = 20


class PadroesService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def padroes_fertilidade(
        self,
        data_inicio: date,
        data_fim:    date,
        especie:     Optional[EspecieAnimal] = None,
    ) -> dict:
        # Base: inseminações no período com diagnóstico conclusivo
        filtros_ins = [
            InseminacaoModel.data_inseminacao >= data_inicio,
            InseminacaoModel.data_inseminacao <= data_fim,
        ]
        filtros_diag = [DiagnosticoModel.resultado.in_([
            ResultadoDiagnostico.PRENHA, ResultadoDiagnostico.VAZIA
        ])]

        if especie:
            # JOIN para filtrar por espécie
            filtros_ins.append(
                InseminacaoModel.animal_id.in_(
                    select(AnimalModel.animal_id).where(AnimalModel.especie == especie)
                )
            )

        # COUNT total de inseminações com diagnóstico no período
        total_stmt = (
            select(func.count())
            .select_from(InseminacaoModel)
            .join(DiagnosticoModel, DiagnosticoModel.inseminacao_id == InseminacaoModel.inseminacao_id)
            .where(and_(*filtros_ins), *filtros_diag)
        )
        total = (await self.session.execute(total_stmt)).scalar_one()

        if total < _MIN_INSEMINACOES:
            return {
                "success": True,
                "data": {
                    "por_mes":    [],
                    "por_raca":   [],
                    "por_tecnico": [],
                    "insights":   [],
                    "total_registros": total,
                    "minimo_inseminacoes_atingido": False,
                    "mensagem": f"Dados insuficientes: {total} inseminação(ões) com diagnóstico registrado. Mínimo necessário: {_MIN_INSEMINACOES}.",
                }
            }

        # Por mês
        por_mes = await self._taxa_por_mes(filtros_ins, filtros_diag)
        # Por raça
        por_raca = await self._taxa_por_raca(filtros_ins, filtros_diag)
        # Por técnico
        por_tecnico = await self._taxa_por_tecnico(filtros_ins, filtros_diag)

        # Insight textual simples baseado em dados
        insights = self._gerar_insights(por_mes, por_raca, por_tecnico)

        return {
            "success": True,
            "data": {
                "por_mes":   por_mes,
                "por_raca":  por_raca,
                "por_tecnico": por_tecnico,
                "insights":  insights,
                "total_registros": total,
                "minimo_inseminacoes_atingido": True,
            }
        }

    async def _taxa_por_mes(self, filtros_ins, filtros_diag) -> list[dict]:
        stmt = (
            select(
                extract("year",  InseminacaoModel.data_inseminacao).label("ano"),
                extract("month", InseminacaoModel.data_inseminacao).label("mes_num"),
                func.count().label("inseminacoes"),
                func.sum(
                    func.cast(DiagnosticoModel.resultado == ResultadoDiagnostico.PRENHA, Integer)
                ).label("prenhezes"),
            )
            .select_from(InseminacaoModel)
            .join(DiagnosticoModel, DiagnosticoModel.inseminacao_id == InseminacaoModel.inseminacao_id)
            .where(and_(*filtros_ins), *filtros_diag)
            .group_by("ano", "mes_num")
            .order_by("ano", "mes_num")
        )
        rows = (await self.session.execute(stmt)).all()
        result = []
        for r in rows:
            ins = r.inseminacoes or 0
            pre = int(r.prenhezes or 0)
            result.append({
                "mes": f"{int(r.ano)}-{int(r.mes_num):02d}",
                "inseminacoes": ins,
                "prenhezes": pre,
                "taxa": round(pre / ins, 3) if ins > 0 else 0,
            })
        return result

    async def _taxa_por_raca(self, filtros_ins, filtros_diag) -> list[dict]:
        stmt = (
            select(
                AnimalModel.raca_principal.label("raca"),
                func.count().label("inseminacoes"),
                func.sum(
                    func.cast(DiagnosticoModel.resultado == ResultadoDiagnostico.PRENHA, Integer)
                ).label("prenhezes"),
            )
            .select_from(InseminacaoModel)
            .join(AnimalModel, AnimalModel.animal_id == InseminacaoModel.animal_id)
            .join(DiagnosticoModel, DiagnosticoModel.inseminacao_id == InseminacaoModel.inseminacao_id)
            .where(and_(*filtros_ins), *filtros_diag)
            .group_by(AnimalModel.raca_principal)
            .order_by(func.count().desc())
            .limit(10)
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            {"raca": r.raca or "Não informado", "inseminacoes": r.inseminacoes, "taxa": round((r.prenhezes or 0) / r.inseminacoes, 3)}
            for r in rows if r.inseminacoes
        ]

    async def _taxa_por_tecnico(self, filtros_ins, filtros_diag) -> list[dict]:
        from models.user_model import User
        stmt = (
            select(
                User.nome.label("tecnico_nome"),
                func.count().label("inseminacoes"),
                func.sum(
                    func.cast(DiagnosticoModel.resultado == ResultadoDiagnostico.PRENHA, Integer)
                ).label("prenhezes"),
            )
            .select_from(InseminacaoModel)
            .join(User, User.usuario_id == InseminacaoModel.tecnico_id)
            .join(DiagnosticoModel, DiagnosticoModel.inseminacao_id == InseminacaoModel.inseminacao_id)
            .where(and_(*filtros_ins), *filtros_diag)
            .group_by(User.nome)
            .order_by(func.count().desc())
            .limit(10)
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            {"tecnico_nome": r.tecnico_nome, "inseminacoes": r.inseminacoes, "taxa": round((r.prenhezes or 0) / r.inseminacoes, 3)}
            for r in rows if r.inseminacoes
        ]

    def _gerar_insights(self, por_mes, por_raca, por_tecnico) -> list[str]:
        insights = []
        if por_mes:
            melhor = max(por_mes, key=lambda m: m["taxa"])
            if melhor["taxa"] > 0:
                insights.append(f"Melhor taxa de prenhez em {melhor['mes']}: {melhor['taxa']*100:.1f}%.")
        if por_raca:
            melhor_raca = max(por_raca, key=lambda r: r["taxa"])
            if melhor_raca["taxa"] > 0:
                insights.append(f"Raça com maior taxa: {melhor_raca['raca']} ({melhor_raca['taxa']*100:.1f}%).")
        if por_tecnico:
            melhor_tec = max(por_tecnico, key=lambda t: t["taxa"])
            if melhor_tec["taxa"] > 0:
                insights.append(f"Técnico com maior taxa: {melhor_tec['tecnico_nome']} ({melhor_tec['taxa']*100:.1f}%).")
        return insights
