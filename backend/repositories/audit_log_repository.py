from uuid import UUID
from typing import Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.audit_log_model import AuditLogModel
from models.enums import AcaoLog
from repositories.base_repository import BaseRepository


class AuditLogRepository(BaseRepository[AuditLogModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, AuditLogModel)

    async def registrar(
        self,
        acao: AcaoLog,
        usuario_id: Optional[UUID] = None,
        entidade: Optional[str] = None,
        entidade_id: Optional[UUID] = None,
        dados_antes: Optional[dict] = None,
        dados_depois: Optional[dict] = None,
        ip_origem: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLogModel:
        obj = AuditLogModel(
            acao=acao,
            usuario_id=usuario_id,
            entidade=entidade,
            entidade_id=entidade_id,
            dados_antes=dados_antes,
            dados_depois=dados_depois,
            ip_origem=ip_origem,
            user_agent=user_agent,
        )
        self.session.add(obj)
        await self.session.commit()
        return obj

    async def list_by_usuario(
        self,
        usuario_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> list[AuditLogModel]:
        stmt = (
            select(AuditLogModel)
            .where(AuditLogModel.usuario_id == usuario_id)
            .order_by(AuditLogModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
