from fastapi import HTTPException

@app.post("/auth/register")
def register_user(user: UserRegister):

    if user.tipo_usuario not in ["admin", "comum"]:
        raise HTTPException(
            status_code=400,
            detail="tipo_usuario deve ser 'admin' ou 'comum'"
        )

    return {
        "mensagem": "Usuário cadastrado com sucesso",
        "usuario": user
    }