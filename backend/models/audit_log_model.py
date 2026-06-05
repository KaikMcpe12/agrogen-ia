from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base
from models.enums import AcaoLog


class AuditLogModel(Base):
    __tablename__ = "audit_log"

    log_id:      Mapped[UUID]          = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    usuario_id:  Mapped[UUID | None]   = mapped_column(PG_UUID(as_uuid=True), ForeignKey("usuarios.usuario_id", ondelete="SET NULL"), nullable=True)
    acao:        Mapped[AcaoLog]       = mapped_column(PG_ENUM(AcaoLog, name="acao_log", create_type=False), nullable=False)
    entidade:    Mapped[str | None]    = mapped_column(String(60), nullable=True)
    entidade_id: Mapped[UUID | None]   = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    dados_antes: Mapped[dict | None]   = mapped_column(JSONB, nullable=True)
    dados_depois: Mapped[dict | None]  = mapped_column(JSONB, nullable=True)
    ip_origem:   Mapped[str | None]    = mapped_column(String(45), nullable=True)
    user_agent:  Mapped[str | None]    = mapped_column(String(255), nullable=True)
    created_at:  Mapped[datetime]      = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
