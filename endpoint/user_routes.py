from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def listar_users():
    return {"msg": "Lista de usuários"}

@router.post("/")
def criar_user():
    return {"msg": "Usuário criado"}