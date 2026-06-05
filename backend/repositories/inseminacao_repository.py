from datetime import date
from uuid import UUID
from typing import Optional

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.inseminacao_model import InseminacaoModel
from models.enums import ResultadoInseminacao
from repositories.base_repository import BaseRepository


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
