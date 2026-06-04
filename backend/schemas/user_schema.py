from pydantic import BaseModel

class UserCreate(BaseModel):
    nome: str
    email: str
    cpf: str
    telefone: str | None = None
    perfil: str
    senha: str
    

class UserResponse(BaseModel):
    id: int
    nome: str
    telefone: str

    class Config:
        from_attributes = True