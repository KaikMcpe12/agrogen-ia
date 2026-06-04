from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import String, Numeric, Boolean, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from models.base import Base
from models.enums import EspecieAnimal, TipoReprodutor


class ReproductorModel(Base):
    __tablename__ = "reprodutores"

    reprodutor_id:    Mapped[UUID]            = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    nome:             Mapped[str]             = mapped_column(String(120), nullable=False)
    registro:         Mapped[str | None]      = mapped_column(String(60), nullable=True)
    especie:          Mapped[EspecieAnimal]   = mapped_column(PG_ENUM(EspecieAnimal, name="especie_animal", create_type=False), nullable=False)
    raca:             Mapped[str]             = mapped_column(String(80), nullable=False)
    tipo:             Mapped[TipoReprodutor]  = mapped_column(PG_ENUM(TipoReprodutor, name="tipo_reprodutor", create_type=False), nullable=False)
    animal_id:        Mapped[UUID | None]     = mapped_column(PG_UUID(as_uuid=True), ForeignKey("animais.animal_id", ondelete="RESTRICT"), nullable=True)
    empresa_semen:    Mapped[str | None]      = mapped_column(String(120), nullable=True)
    dep_peso_desmame: Mapped[Decimal | None]  = mapped_column(Numeric(6, 2), nullable=True)
    dep_fertilidade:  Mapped[Decimal | None]  = mapped_column(Numeric(5, 2), nullable=True)
    dep_acuracia:     Mapped[Decimal | None]  = mapped_column(Numeric(4, 3), nullable=True)
    ativo:            Mapped[bool]            = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    created_at:       Mapped[datetime]        = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at:       Mapped[datetime]        = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=func.now())
