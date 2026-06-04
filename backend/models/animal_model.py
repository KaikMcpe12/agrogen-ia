from datetime import date, datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Numeric, SmallInteger, Integer, Boolean, DateTime, text, Text, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from models.base import Base
from models.enums import EspecieAnimal, SexoAnimal, StatusAnimal


class AnimalModel(Base):
    __tablename__ = "animais"

    animal_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    fazenda_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)

    codigo: Mapped[str] = mapped_column(String(20), nullable=False)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)

    especie: Mapped[EspecieAnimal] = mapped_column(
        PG_ENUM(EspecieAnimal, name="especie_animal", create_type=False), nullable=False
    )
    sexo: Mapped[SexoAnimal] = mapped_column(
        PG_ENUM(SexoAnimal, name="sexo_animal", create_type=False), nullable=False
    )
    
    data_nascimento: Mapped[date] = mapped_column(nullable=False)
    raca_principal: Mapped[str | None] = mapped_column(String(80), nullable=True)
    peso_inicial_kg: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    condicao_corporal: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    brinco: Mapped[str | None] = mapped_column(String(50), nullable=True)

    status: Mapped[StatusAnimal] = mapped_column(
        PG_ENUM(StatusAnimal, name="status_animal", create_type=False), 
        nullable=False, 
        server_default="ATIVA"
    )

    num_partos: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    data_ultimo_parto: Mapped[date | None] = mapped_column(nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)

    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("fazenda_id", "codigo", name="uq_animal_codigo_fazenda"),
        CheckConstraint("condicao_corporal BETWEEN 1 AND 5", name="chk_animal_condicao_corporal"),
        CheckConstraint("(especie != 'BOVINO') OR (peso_inicial_kg BETWEEN 50 AND 900)", name="chk_animal_peso_bovino"),
        CheckConstraint("(especie != 'OVINO') OR (peso_inicial_kg BETWEEN 10 AND 120)", name="chk_animal_peso_ovino"),
        CheckConstraint("(especie != 'CAPRINO') OR (peso_inicial_kg BETWEEN 8 AND 100)", name="chk_animal_peso_caprino"),
        CheckConstraint("(sexo = 'FEMEA') OR (num_partos = 0)", name="chk_animal_partos_femea"),
    )