from uuid import UUID
from typing import Optional

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.alerta_model import AlertaModel
from models.animal_model import AnimalModel
from models.enums import TipoAlerta, PrioridadeAlerta
from repositories.base_repository import BaseRepository


class AlertaRepository(BaseRepository[AlertaModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, AlertaModel)

    @staticmethod
    def _to_dict(alerta: AlertaModel, animal_codigo: str | None, animal_nome: str | None) -> dict:
        return {
            "id":           str(alerta.alerta_id),
            "tipo":         alerta.tipo.value,
            "prioridade":   alerta.prioridade.value,
            "lido":         alerta.lido,
            "resolvido":    alerta.resolvido,
            "mensagem":     alerta.mensagem,
            "data_disparo": alerta.data_disparo.isoformat() if alerta.data_disparo else None,
            "created_at":   alerta.created_at.isoformat() if alerta.created_at else None,
            "animal": {
                "id":     str(alerta.animal_id) if alerta.animal_id else None,
                "codigo": animal_codigo,
                "nome":   animal_nome,
            },
        }

    async def create(self, data: dict) -> AlertaModel:
        obj = AlertaModel(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def list_pendentes(
        self,
        animal_id:  Optional[UUID]            = None,
        fazenda_id: Optional[UUID]            = None,
        tipo:       Optional[TipoAlerta]       = None,
        prioridade: Optional[PrioridadeAlerta] = None,
        lido:       Optional[bool]             = None,
        resolvido:  Optional[bool]             = None,
        limit:      int                        = 20,
        offset:     int                        = 0,
    ) -> list[dict]:
        filtros: list = []
        # resolvido default = False (pendentes), a não ser que explicitamente fornecido
        filtros.append(AlertaModel.resolvido == (resolvido if resolvido is not None else False))
        if lido is not None:
            filtros.append(AlertaModel.lido == lido)
        if animal_id:
            filtros.append(AlertaModel.animal_id == animal_id)
        if tipo:
            filtros.append(AlertaModel.tipo == tipo)
        if prioridade:
            filtros.append(AlertaModel.prioridade == prioridade)
        if fazenda_id:
            filtros.append(AnimalModel.fazenda_id == fazenda_id)
        stmt = (
            select(AlertaModel, AnimalModel.codigo.label("animal_codigo"), AnimalModel.nome.label("animal_nome"))
            .outerjoin(AnimalModel, AnimalModel.animal_id == AlertaModel.animal_id)
            .where(and_(*filtros))
            .order_by(AlertaModel.data_disparo.asc())
            .offset(offset)
            .limit(limit)
        )
        rows = (await self.session.execute(stmt)).all()
        return [self._to_dict(row.AlertaModel, row.animal_codigo, row.animal_nome) for row in rows]

    async def get_by_id_with_animal(self, alerta_id: UUID) -> dict | None:
        stmt = (
            select(AlertaModel, AnimalModel.codigo.label("animal_codigo"), AnimalModel.nome.label("animal_nome"))
            .outerjoin(AnimalModel, AnimalModel.animal_id == AlertaModel.animal_id)
            .where(AlertaModel.alerta_id == alerta_id)
        )
        row = (await self.session.execute(stmt)).first()
        if not row:
            return None
        return self._to_dict(row.AlertaModel, row.animal_codigo, row.animal_nome)

    async def marcar_lido(self, alerta_id: UUID) -> Optional[AlertaModel]:
        obj = await self.get_by_id(alerta_id)
        if not obj:
            return None
        obj.lido = True
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def count_badge(self) -> dict:
        base = and_(AlertaModel.resolvido == False, AlertaModel.lido == False)
        total = (await self.session.execute(select(func.count()).where(base))).scalar_one()
        criticos = (await self.session.execute(
            select(func.count()).where(base, AlertaModel.prioridade == PrioridadeAlerta.CRITICA)
        )).scalar_one()
        altas = (await self.session.execute(
            select(func.count()).where(base, AlertaModel.prioridade == PrioridadeAlerta.ALTA)
        )).scalar_one()
        return {"total_nao_lidos": total, "criticos": criticos, "altas": altas}

    async def marcar_resolvido(self, alerta_id: UUID) -> Optional[AlertaModel]:
        obj = await self.get_by_id(alerta_id)
        if not obj:
            return None
        obj.resolvido = True
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
