from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import String, Boolean, Integer, Numeric, DateTime, text, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from models.base import Base
from models.enums import TipoProducao

ESTADOS_VALIDOS = (
    'AC','AL','AP','AM','BA','CE','DF','ES','GO',
    'MA','MT','MS','MG','PA','PB','PR','PE','PI',
    'RJ','RN','RS','RO','RR','SC','SP','SE','TO'
)

class FazendaModel(Base):
    __tablename__ = "fazendas"

    fazenda_id:         Mapped[UUID]            = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    usuario_id:         Mapped[UUID]            = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    nome:               Mapped[str]             = mapped_column(String(120), nullable=False)
    municipio:          Mapped[str]             = mapped_column(String(100), nullable=False)
    estado:             Mapped[str]             = mapped_column(CHAR(2), nullable=False)
    latitude:           Mapped[Decimal | None]  = mapped_column(Numeric(9, 6), nullable=True)
    longitude:          Mapped[Decimal | None]  = mapped_column(Numeric(9, 6), nullable=True)
    area_hectares:      Mapped[Decimal | None]  = mapped_column(Numeric(10, 2), nullable=True)
    tipo_producao:      Mapped[TipoProducao | None] = mapped_column(PG_ENUM(TipoProducao, name="tipo_producao", create_type=False), nullable=True)
    capacidade_rebanho: Mapped[int | None]      = mapped_column(Integer, nullable=True)
    ativo:              Mapped[bool]            = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    created_at:         Mapped[datetime]        = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at:         Mapped[datetime]        = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=func.now())