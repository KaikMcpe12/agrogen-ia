"""
Testes das funções de segurança (core/security.py).
Nenhum banco de dados necessário.
"""
import pytest
from datetime import timedelta

from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    create_refresh_token,
)


# ── hash_password / verify_password ───────────────────────────────────────────

def test_hash_password_retorna_string_bcrypt():
    h = hash_password("minha_senha_123")
    assert isinstance(h, str)
    assert h.startswith("$2b$") or h.startswith("$2a$")

def test_hash_password_salts_diferentes_por_chamada():
    """Mesmo password → hashes diferentes (salt aleatório)."""
    h1 = hash_password("igual")
    h2 = hash_password("igual")
    assert h1 != h2

def test_verify_password_correta_retorna_true():
    h = hash_password("agrogen123")
    assert verify_password("agrogen123", h) is True

def test_verify_password_errada_retorna_false():
    h = hash_password("agrogen123")
    assert verify_password("senha_errada", h) is False

def test_verify_password_vazia_retorna_false():
    h = hash_password("agrogen123")
    assert verify_password("", h) is False

def test_verify_password_case_sensitive():
    h = hash_password("AgroGen123")
    assert verify_password("agrogen123", h) is False
    assert verify_password("AgroGen123", h) is True


# ── create_access_token / decode_access_token ─────────────────────────────────

def test_create_access_token_retorna_string():
    token = create_access_token({"sub": "uuid-1", "perfil": "ADMIN"})
    assert isinstance(token, str)
    assert len(token) > 50

def test_decode_access_token_payload_correto():
    payload_in = {"sub": "uuid-123", "email": "teste@test.com", "perfil": "TECNICO"}
    token = create_access_token(payload_in)
    decoded = decode_access_token(token)
    assert decoded["sub"] == "uuid-123"
    assert decoded["email"] == "teste@test.com"
    assert decoded["perfil"] == "TECNICO"

def test_decode_access_token_invalido_retorna_dict_vazio():
    assert decode_access_token("token.invalido.aqui") == {}

def test_decode_access_token_vazio_retorna_dict_vazio():
    assert decode_access_token("") == {}

def test_decode_access_token_expirado_retorna_dict_vazio():
    token = create_access_token({"sub": "x"}, expires_delta=timedelta(seconds=-1))
    assert decode_access_token(token) == {}

def test_access_token_contem_exp_e_iat():
    token = create_access_token({"sub": "uuid"})
    decoded = decode_access_token(token)
    assert "exp" in decoded
    assert "iat" in decoded

def test_access_token_exp_maior_que_iat():
    token = create_access_token({"sub": "uuid"})
    decoded = decode_access_token(token)
    assert decoded["exp"] > decoded["iat"]


# ── create_refresh_token ──────────────────────────────────────────────────────

def test_create_refresh_token_retorna_uuid_string():
    import re
    token = create_refresh_token()
    uuid_re = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    assert re.match(uuid_re, token), f"Não parece um UUID: {token}"

def test_create_refresh_token_unico_por_chamada():
    t1 = create_refresh_token()
    t2 = create_refresh_token()
    assert t1 != t2
