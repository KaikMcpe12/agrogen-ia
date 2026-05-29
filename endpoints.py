<<<<<<< HEAD
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session

@app.post("/auth/register")
def register_user(user: UserRegister, db: Session = Depends(get_db)):

    # valida tipo
=======
from fastapi import HTTPException

@app.post("/auth/register")
def register_user(user: UserRegister):

>>>>>>> ca417ad98b40b7590ea22425cc5b32d8c9726726
    if user.tipo_usuario not in ["admin", "comum"]:
        raise HTTPException(
            status_code=400,
            detail="tipo_usuario deve ser 'admin' ou 'comum'"
        )

<<<<<<< HEAD
    # verifica email
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email já existe")

    # verifica cpf
    if db.query(User).filter(User.cpf == user.cpf).first():
        raise HTTPException(status_code=400, detail="CPF já existe")

    # cria usuário
    new_user = User(
        nome=user.nome,
        cpf=user.cpf,
        email=user.email,
        tipo_usuario=user.tipo_usuario
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "mensagem": "Usuário cadastrado com sucesso",
        "usuario": {
            "id": new_user.id,
            "nome": new_user.nome,
            "email": new_user.email,
            "tipo_usuario": new_user.tipo_usuario
        }
    }
=======
    return {
        "mensagem": "Usuário cadastrado com sucesso",
        "usuario": user
    }
>>>>>>> ca417ad98b40b7590ea22425cc5b32d8c9726726

print("teste")