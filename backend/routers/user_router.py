from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from models.user_model import User
from schemas.user import UserCreate

router = APIRouter()

@router.post("/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    new_user = User(
        nome=user.nome,
        email=user.email,
        cpf=user.cpf,
        telefone=user.telefone,
        perfil=user.perfil,
        senha_hash=user.senha
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.get("/")
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()