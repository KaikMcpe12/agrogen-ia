from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import Numeric, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from models.base import Base


class AnaliseIAModel(Base):
    __tablename__ = "analises_ia"

    analise_id:         Mapped[UUID]            = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    animal_id:          Mapped[UUID]            = mapped_column(PG_UUID(as_uuid=True), ForeignKey("animais.animal_id", ondelete="RESTRICT"), nullable=False)
    tecnico_id:         Mapped[UUID | None]     = mapped_column(PG_UUID(as_uuid=True), ForeignKey("usuarios.usuario_id", ondelete="SET NULL"), nullable=True)
    score_prenhez:      Mapped[Decimal | None]  = mapped_column(Numeric(5, 4), nullable=True)
    fatores_influentes: Mapped[dict | None]     = mapped_column(JSONB, nullable=True)
    parametros_entrada: Mapped[dict | None]     = mapped_column(JSONB, nullable=True)
    created_at:         Mapped[datetime]        = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at:         Mapped[datetime]        = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=func.now())