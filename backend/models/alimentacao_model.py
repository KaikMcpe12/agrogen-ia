from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import String, Numeric, Date, DateTime, Text, text, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base
from models.enums import TipoAlimentacao


class AlimentacaoModel(Base):
    __tablename__ = "alimentacoes"

    alimentacao_id: Mapped[UUID]              = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    animal_id:      Mapped[UUID]              = mapped_column(PG_UUID(as_uuid=True), ForeignKey("animais.animal_id", ondelete="RESTRICT"), nullable=False)
    data_inicio:    Mapped[date]              = mapped_column(Date, nullable=False)
    data_fim:       Mapped[date | None]       = mapped_column(Date, nullable=True)
    tipo:           Mapped[TipoAlimentacao]   = mapped_column(PG_ENUM(TipoAlimentacao, name="tipo_alimentacao", create_type=False), nullable=False)
    descricao:      Mapped[str | None]        = mapped_column(String(255), nullable=True)
    custo_diario:   Mapped[Decimal | None]    = mapped_column(Numeric(8, 2), nullable=True)
    observacao:     Mapped[str | None]        = mapped_column(Text, nullable=True)
    created_at:     Mapped[datetime]          = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint("data_fim IS NULL OR data_fim > data_inicio", name="chk_ali_data_fim"),
        CheckConstraint("custo_diario IS NULL OR custo_diario >= 0", name="chk_ali_custo"),
    )
