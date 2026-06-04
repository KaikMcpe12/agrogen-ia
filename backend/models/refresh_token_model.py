from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import Boolean, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class RefreshTokenModel(Base):
    __tablename__ = "tb_refresh_tokens"

    token_id:   Mapped[UUID]     = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    usuario_id: Mapped[UUID]     = mapped_column(PG_UUID(as_uuid=True), ForeignKey("usuarios.usuario_id", ondelete="CASCADE"), nullable=False)
    token:      Mapped[str]      = mapped_column(nullable=False, unique=True)
    revogado:   Mapped[bool]     = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
