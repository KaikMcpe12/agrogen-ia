from sqlalchemy import Column, Integer, Date, String, ForeignKey
from core.database import Base

class Diagnostico(Base):
    __tablename__ = "diagnosticos"

    id = Column(Integer, primary_key=True, index=True)

    inseminacao_id = Column(String, nullable=False)
    animal_id = Column(String, nullable=False)

    data_diagnostico = Column(Date, nullable=False)
    metodo = Column(String, nullable=False)
    resultado = Column(String, nullable=False)

    dias_gestacao_est = Column(Integer, nullable=True)
    data_parto_prevista = Column(Date, nullable=True)

    veterinario_id = Column(String, nullable=True)
    observacoes = Column(String, nullable=True)