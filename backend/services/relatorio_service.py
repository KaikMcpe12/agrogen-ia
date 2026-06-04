from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.inseminacao_model import InseminacaoModel
from models.diagnostico_model import DiagnosticoModel
from models.animal_model import AnimalModel
from models.reprodutor_model import ReproductorModel
from models.evento_sanitario_model import EventoSanitarioModel
from models.pesagem_model import PesagemModel
from models.enums import EspecieAnimal, TipoSanitario, ResultadoDiagnostico
from models.user_model import User


class RelatorioService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def reprodutivo(
        self,
        data_inicio: date,
        data_fim:    date,
        especie:     Optional[EspecieAnimal] = None,
        tecnico_id:  Optional[UUID]          = None,
        fazenda_id:  Optional[UUID]          = None,
    ) -> dict:
        filtros = [
            InseminacaoModel.data_inseminacao >= data_inicio,
            InseminacaoModel.data_inseminacao <= data_fim,
        ]
        if especie:
            filtros.append(AnimalModel.especie == especie)
        if tecnico_id:
            filtros.append(InseminacaoModel.tecnico_id == tecnico_id)
        if fazenda_id:
            filtros.append(AnimalModel.fazenda_id == fazenda_id)

        rows = (await self.session.execute(
            select(
                AnimalModel.codigo.label("animal_codigo"),
                AnimalModel.nome.label("animal_nome"),
                InseminacaoModel.data_inseminacao,
                InseminacaoModel.tipo.label("tipo_ia"),
                ReproductorModel.nome.label("reprodutor"),
                DiagnosticoModel.resultado,
                User.nome.label("tecnico"),
            )
            .select_from(InseminacaoModel)
            .join(AnimalModel,     AnimalModel.animal_id == InseminacaoModel.animal_id)
            .join(ReproductorModel, ReproductorModel.reprodutor_id == InseminacaoModel.reprodutor_id)
            .join(User,            User.usuario_id == InseminacaoModel.tecnico_id)
            .outerjoin(DiagnosticoModel, DiagnosticoModel.inseminacao_id == InseminacaoModel.inseminacao_id)
            .where(and_(*filtros))
            .order_by(InseminacaoModel.data_inseminacao.desc())
        )).all()

        linhas = [
            {
                "animal_codigo":    r.animal_codigo,
                "animal_nome":      r.animal_nome,
                "data_inseminacao": str(r.data_inseminacao.date() if hasattr(r.data_inseminacao, "date") else r.data_inseminacao),
                "tipo_ia":          r.tipo_ia.value,
                "reprodutor":       r.reprodutor,
                "resultado":        r.resultado.value if r.resultado else "PENDENTE",
                "tecnico":          r.tecnico,
            }
            for r in rows
        ]

        total = len(linhas)
        prenhezes = sum(1 for l in linhas if l["resultado"] == "PRENHA")
        taxa = round(prenhezes / total, 3) if total else None
        nsc  = round(total / prenhezes, 2) if prenhezes else None

        return {
            "linhas": linhas,
            "indices": {
                "taxa_prenhez": taxa,
                "num_servicos_concepcao": nsc,
                "total_inseminacoes": total,
                "total_prenhezes": prenhezes,
            },
        }

    async def sanitario(
        self,
        data_inicio: date,
        data_fim:    date,
        tipo:        Optional[TipoSanitario] = None,
        fazenda_id:  Optional[UUID]          = None,
    ) -> dict:
        filtros = [
            EventoSanitarioModel.data_aplicacao >= data_inicio,
            EventoSanitarioModel.data_aplicacao <= data_fim,
        ]
        if tipo:
            filtros.append(EventoSanitarioModel.tipo == tipo)
        if fazenda_id:
            filtros.append(AnimalModel.fazenda_id == fazenda_id)

        rows = (await self.session.execute(
            select(
                AnimalModel.codigo.label("animal_codigo"),
                AnimalModel.nome.label("animal_nome"),
                EventoSanitarioModel.tipo,
                EventoSanitarioModel.produto,
                EventoSanitarioModel.principio_ativo,
                EventoSanitarioModel.data_aplicacao,
                EventoSanitarioModel.proxima_dose,
                User.nome.label("responsavel"),
            )
            .select_from(EventoSanitarioModel)
            .join(AnimalModel, AnimalModel.animal_id == EventoSanitarioModel.animal_id)
            .join(User, User.usuario_id == EventoSanitarioModel.responsavel_id)
            .where(and_(*filtros))
            .order_by(EventoSanitarioModel.data_aplicacao.desc())
        )).all()

        linhas = [
            {
                "animal_codigo":    r.animal_codigo,
                "animal_nome":      r.animal_nome,
                "tipo":             r.tipo.value,
                "produto":          r.produto,
                "principio_ativo":  r.principio_ativo or "",
                "data_aplicacao":   str(r.data_aplicacao),
                "proxima_dose":     str(r.proxima_dose) if r.proxima_dose else "",
                "responsavel":      r.responsavel,
            }
            for r in rows
        ]
        return {"linhas": linhas, "total": len(linhas)}
