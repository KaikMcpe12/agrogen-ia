from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import String, Numeric, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class PredicaoLogModel(Base):
    __tablename__ = "tb_predicao_log"

    predicao_id:    Mapped[UUID]          = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    animal_id:      Mapped[UUID]          = mapped_column(PG_UUID(as_uuid=True), ForeignKey("animais.animal_id", ondelete="RESTRICT"), nullable=False)
    tecnico_id:     Mapped[UUID | None]   = mapped_column(PG_UUID(as_uuid=True), ForeignKey("usuarios.usuario_id", ondelete="SET NULL"), nullable=True)
    features_entrada: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    score_retornado:  Mapped[Decimal]     = mapped_column(Numeric(5, 4), nullable=False)
    classificacao:    Mapped[str]         = mapped_column(String(20), nullable=False)
    top_5_fatores:    Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    modelo_versao:    Mapped[str | None]  = mapped_column(String(30), nullable=True)
    origem:           Mapped[str]         = mapped_column(String(10), nullable=False, server_default="rules")
    created_at:       Mapped[datetime]    = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
