from datetime import date
from uuid import UUID
from typing import Optional

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.inseminacao_model import InseminacaoModel
from models.animal_model import AnimalModel
from models.reprodutor_model import ReproductorModel
from models.user_model import User
from models.protocolo_hormonal_model import ProtocoloHormonalModel
from models.diagnostico_model import DiagnosticoModel
from models.enums import ResultadoInseminacao
from repositories.base_repository import BaseRepository


def _row_to_dict(row, today: date) -> dict:
    ins = row.InseminacaoModel
    dias = (today - ins.data_inseminacao.date()).days if ins.data_inseminacao else None
    return {
        "id": str(ins.inseminacao_id),
        "animal": {
            "id":      str(ins.animal_id),
            "codigo":  row.animal_codigo,
            "nome":    row.animal_nome,
            "especie": row.animal_especie.value,
        },
        "reprodutor": {
            "id":   str(ins.reprodutor_id),
            "nome": row.reprodutor_nome,
            "raca": row.reprodutor_raca,
            "tipo": row.reprodutor_tipo.value,
        },
        "tecnico": {
            "id":   str(ins.tecnico_id),
            "nome": row.tecnico_nome,
        },
        "data_inseminacao":          ins.data_inseminacao.isoformat() if ins.data_inseminacao else None,
        "tipo":                      ins.tipo.value,
        "protocolo_descricao":       row.protocolo_nome,
        "condicao_corporal_momento": ins.condicao_corporal_momento,
        "temperatura_ambiente_c":    float(ins.temperatura_ambiente_c) if ins.temperatura_ambiente_c else None,
        "dias_pos_parto":            ins.dias_pos_parto,
        "dias_desde_ultima_ins":     ins.dias_desde_ultima_ins,
        "ciclos_sem_concepcao":      ins.ciclos_sem_concepcao,
        "historico_prenhez":         ins.historico_prenhez,
        "resultado":                 ins.resultado.value,
        "diagnostico": {
            "resultado":        row.diag_resultado.value,
            "data_diagnostico": row.diag_data.isoformat(),
        } if row.diag_resultado else None,
        "dias_decorridos": dias,
    }


class InseminacaoRepository(BaseRepository[InseminacaoModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, InseminacaoModel)

    async def create(self, data: dict) -> InseminacaoModel:
        obj = InseminacaoModel(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def get_ultima_inseminacao(self, animal_id: UUID) -> Optional[InseminacaoModel]:
        stmt = (
            select(InseminacaoModel)
            .where(InseminacaoModel.animal_id == animal_id)
            .order_by(InseminacaoModel.data_inseminacao.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self,
        animal_id:   Optional[UUID]               = None,
        tecnico_id:  Optional[UUID]               = None,
        resultado:   Optional[ResultadoInseminacao] = None,
        data_inicio: Optional[date]               = None,
        data_fim:    Optional[date]               = None,
        limit:       int                          = 20,
        offset:      int                          = 0,
    ) -> tuple[list[InseminacaoModel], int]:
        filtros = []
        if animal_id:
            filtros.append(InseminacaoModel.animal_id == animal_id)
        if tecnico_id:
            filtros.append(InseminacaoModel.tecnico_id == tecnico_id)
        if resultado:
            filtros.append(InseminacaoModel.resultado == resultado)
        if data_inicio:
            filtros.append(InseminacaoModel.data_inseminacao >= data_inicio)
        if data_fim:
            filtros.append(InseminacaoModel.data_inseminacao <= data_fim)

        where_clause = and_(*filtros) if filtros else True

        total = (await self.session.execute(select(func.count()).where(where_clause))).scalar_one()
        items = list(
            (await self.session.execute(
                select(InseminacaoModel)
                .where(where_clause)
                .order_by(InseminacaoModel.data_inseminacao.desc())
                .offset(offset)
                .limit(limit)
            )).scalars().all()
        )
        return items, total

    async def list_all_enriched(
        self,
        animal_id:   Optional[UUID]                = None,
        tecnico_id:  Optional[UUID]                = None,
        resultado:   Optional[ResultadoInseminacao] = None,
        data_inicio: Optional[date]                = None,
        data_fim:    Optional[date]                = None,
        limit:       int                           = 20,
        offset:      int                           = 0,
    ) -> tuple[list[dict], int]:
        filtros = []
        if animal_id:
            filtros.append(InseminacaoModel.animal_id == animal_id)
        if tecnico_id:
            filtros.append(InseminacaoModel.tecnico_id == tecnico_id)
        if resultado:
            filtros.append(InseminacaoModel.resultado == resultado)
        if data_inicio:
            filtros.append(InseminacaoModel.data_inseminacao >= data_inicio)
        if data_fim:
            filtros.append(InseminacaoModel.data_inseminacao <= data_fim)

        where_clause = and_(*filtros) if filtros else True

        total = (await self.session.execute(
            select(func.count(InseminacaoModel.inseminacao_id)).where(where_clause)
        )).scalar_one()

        stmt = (
            select(
                InseminacaoModel,
                AnimalModel.codigo.label("animal_codigo"),
                AnimalModel.nome.label("animal_nome"),
                AnimalModel.especie.label("animal_especie"),
                ReproductorModel.nome.label("reprodutor_nome"),
                ReproductorModel.raca.label("reprodutor_raca"),
                ReproductorModel.tipo.label("reprodutor_tipo"),
                User.nome.label("tecnico_nome"),
                ProtocoloHormonalModel.nome.label("protocolo_nome"),
                DiagnosticoModel.resultado.label("diag_resultado"),
                DiagnosticoModel.data_diagnostico.label("diag_data"),
            )
            .join(AnimalModel,          AnimalModel.animal_id       == InseminacaoModel.animal_id)
            .join(ReproductorModel,     ReproductorModel.reprodutor_id == InseminacaoModel.reprodutor_id)
            .join(User,                 User.usuario_id             == InseminacaoModel.tecnico_id)
            .outerjoin(ProtocoloHormonalModel, ProtocoloHormonalModel.protocolo_id == InseminacaoModel.protocolo_id)
            .outerjoin(DiagnosticoModel, DiagnosticoModel.inseminacao_id == InseminacaoModel.inseminacao_id)
            .where(where_clause)
            .order_by(InseminacaoModel.data_inseminacao.desc())
            .offset(offset)
            .limit(limit)
        )
        rows = (await self.session.execute(stmt)).all()
        today = date.today()
        return [_row_to_dict(row, today) for row in rows], total

    async def get_by_id_enriched(self, inseminacao_id: UUID) -> dict | None:
        stmt = (
            select(
                InseminacaoModel,
                AnimalModel.codigo.label("animal_codigo"),
                AnimalModel.nome.label("animal_nome"),
                AnimalModel.especie.label("animal_especie"),
                ReproductorModel.nome.label("reprodutor_nome"),
                ReproductorModel.raca.label("reprodutor_raca"),
                ReproductorModel.tipo.label("reprodutor_tipo"),
                User.nome.label("tecnico_nome"),
                ProtocoloHormonalModel.nome.label("protocolo_nome"),
                DiagnosticoModel.resultado.label("diag_resultado"),
                DiagnosticoModel.data_diagnostico.label("diag_data"),
            )
            .join(AnimalModel,          AnimalModel.animal_id          == InseminacaoModel.animal_id)
            .join(ReproductorModel,     ReproductorModel.reprodutor_id == InseminacaoModel.reprodutor_id)
            .join(User,                 User.usuario_id                == InseminacaoModel.tecnico_id)
            .outerjoin(ProtocoloHormonalModel, ProtocoloHormonalModel.protocolo_id == InseminacaoModel.protocolo_id)
            .outerjoin(DiagnosticoModel, DiagnosticoModel.inseminacao_id == InseminacaoModel.inseminacao_id)
            .where(InseminacaoModel.inseminacao_id == inseminacao_id)
        )
        row = (await self.session.execute(stmt)).first()
        if not row:
            return None
        return _row_to_dict(row, date.today())

    async def list_pendentes_diagnostico(
        self,
        animal_id: Optional[UUID] = None,
        dias_minimos: int = 0,
    ) -> list[InseminacaoModel]:
        from models.diagnostico_model import DiagnosticoModel
        from datetime import datetime, timedelta, timezone

        corte = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=dias_minimos)
        sub = select(DiagnosticoModel.inseminacao_id)

        filtros = [
            InseminacaoModel.resultado == ResultadoInseminacao.PENDENTE,
            InseminacaoModel.inseminacao_id.not_in(sub),
            InseminacaoModel.data_inseminacao <= corte,
        ]
        if animal_id:
            filtros.append(InseminacaoModel.animal_id == animal_id)

        stmt = (
            select(InseminacaoModel)
            .where(and_(*filtros))
            .order_by(InseminacaoModel.data_inseminacao.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, inseminacao_id: UUID, data: dict) -> Optional[InseminacaoModel]:
        obj = await self.get_by_id(inseminacao_id)
        if not obj:
            return None
        for key, value in data.items():
            setattr(obj, key, value)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
