from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import String, Numeric, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from models.base import Base


class DadosGeneticosModel(Base):
    __tablename__ = "dados_geneticos"

    dados_gen_id:          Mapped[UUID]            = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    animal_id:             Mapped[UUID]            = mapped_column(PG_UUID(as_uuid=True), ForeignKey("animais.animal_id", ondelete="CASCADE"), nullable=False, unique=True)
    raca_pai:              Mapped[str | None]       = mapped_column(String(80), nullable=True)
    raca_mae:              Mapped[str | None]       = mapped_column(String(80), nullable=True)
    percentual_sangue:     Mapped[str | None]       = mapped_column(String(60), nullable=True)
    pai_id:                Mapped[UUID | None]      = mapped_column(PG_UUID(as_uuid=True), ForeignKey("animais.animal_id", ondelete="SET NULL"), nullable=True)
    mae_id:                Mapped[UUID | None]      = mapped_column(PG_UUID(as_uuid=True), ForeignKey("animais.animal_id", ondelete="SET NULL"), nullable=True)
    dep_peso_desmame:      Mapped[Decimal | None]   = mapped_column(Numeric(6, 2), nullable=True)
    dep_peso_sobrean:      Mapped[Decimal | None]   = mapped_column(Numeric(6, 2), nullable=True)
    dep_fertilidade:       Mapped[Decimal | None]   = mapped_column(Numeric(5, 2), nullable=True)
    dep_acuracia:          Mapped[Decimal | None]   = mapped_column(Numeric(4, 3), nullable=True)
    coeficiente_endogamia: Mapped[Decimal | None]   = mapped_column(Numeric(5, 4), nullable=True)
    heterose_esperada:     Mapped[Decimal | None]   = mapped_column(Numeric(5, 2), nullable=True)
    created_at:            Mapped[datetime]         = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at:            Mapped[datetime]         = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=func.now())
