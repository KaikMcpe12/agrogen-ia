from datetime import date, datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Boolean, Date, DateTime, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base
from models.enums import CategoriaOcorrencia, GravidadeOcorrencia


class OcorrenciaModel(Base):
    __tablename__ = "ocorrencias"

    ocorrencia_id: Mapped[UUID]                    = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    animal_id:     Mapped[UUID]                    = mapped_column(PG_UUID(as_uuid=True), ForeignKey("animais.animal_id", ondelete="RESTRICT"), nullable=False)
    data:          Mapped[date]                    = mapped_column(Date, nullable=False)
    categoria:     Mapped[CategoriaOcorrencia]     = mapped_column(PG_ENUM(CategoriaOcorrencia, name="categoria_ocorrencia", create_type=True), nullable=False)
    titulo:        Mapped[str]                     = mapped_column(String(150), nullable=False)
    descricao:     Mapped[str]                     = mapped_column(Text, nullable=False)
    gravidade:     Mapped[GravidadeOcorrencia | None] = mapped_column(PG_ENUM(GravidadeOcorrencia, name="gravidade_ocorrencia", create_type=True), nullable=True)
    resolvida:     Mapped[bool]                    = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_at:    Mapped[datetime]                = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
