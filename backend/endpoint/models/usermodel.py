import uuid

from sqlalchemy import Column, String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from endpoint.database import Base

class User(Base):
    __tablename__ = "usuarios"

    usuario_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    nome = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False)
    cpf = Column(String(11), nullable=False)
    telefone = Column(String(20))
    perfil = Column(String, nullable=False)
    senha_hash = Column(String(255))
    ativo = Column(Boolean, default=True)