# PHASE1_DECISIONS.md — Fundação do Backend AgroGen IA

## Resumo das Correções e Adições

### 1. Conflito de Base Class (CRÍTICO)
**Problema:** `core/database.py` declarava `Base = declarative_base()` enquanto `models/base.py` usava `DeclarativeBase`. Os models existentes herdavam de `models/base.py` — a Base em `database.py` nunca era usada, mas criava confusão e risco de uso acidental.

**Decisão:** Removido `Base = declarative_base()` de `core/database.py`. Base única e autoritativa: `models/base.py` (`DeclarativeBase` moderno do SQLAlchemy 2.x).

---

### 2. Hashing de Senha SHA256 → bcrypt (CRÍTICO)
**Problema:** `services/user_service.py` usava `hashlib.sha256` sem salt — vulnerável a rainbow tables.

**Decisão:** Substituído por `passlib.CryptContext(schemes=["bcrypt"], bcrypt__rounds=12)` em `core/security.py`. Custo 12 conforme especificado nos docs. Interface interna `_hash_senha()` mantida como wrapper para não quebrar chamadas existentes.

---

### 3. Padrão de Repositório Consolidado
**Decisão:** Nova `BaseRepository(Generic[ModelT])` em `repositories/base_repository.py` fornece `get_by_id` e `delete` genéricos. **Repositórios existentes (user, animal, fazenda, diagnostico, analise_ia) não foram alterados** — têm lógica específica (soft delete, constraint FK handling) que não se beneficia da abstração. Apenas os 11 repositórios novos herdam BaseRepository.

---

### 4. Autenticação JWT
- **Algoritmo:** HS256 (HMAC-SHA256)
- **Access token:** 24h de validade (configurável via `ACCESS_TOKEN_EXPIRE_HOURS`)
- **Refresh token:** UUID v4 opaco, 7 dias, armazenado em `tb_refresh_tokens`, rotacionado a cada uso
- **Bloqueio:** 5 tentativas falhas → `bloqueado_ate = now + 15 min`; contador resetado no login bem-sucedido
- **Dependência de auth:** `core/deps.py::get_current_user` — injetada nos endpoints protegidos

---

### 5. Prefixo de API
**Decisão:** Todos os routers migrados para `/api/v1/` (conforme `AgroGen-IA-API-RESTful.pdf`). Prefixo centralizado no `api/index.py` via `include_router(router, prefix="/api/v1")`. Os arquivos de router mantêm apenas o sub-path (ex: `/auth`, `/users`, `/animals`).

---

### 6. Middleware e Envelopes
- **X-Request-ID:** `middleware/request_id.py` — gera UUID v4 se ausente; disponível via `ContextVar` para logging; retornado em toda response
- **Exception handler global:** `HTTPException` → `ErrorEnvelope` (campo `codigo_interno`, `mensagem`, `request_id`); erros não mapeados → 500 genérico
- **SuccessEnvelope / ErrorEnvelope:** definidos em `schemas/common.py`; uso opcional por endpoint (implementação progressiva nas fases seguintes)

---

## Divergências Identificadas vs. Especificação

| Item | Spec | Realidade | Tratamento |
|------|------|-----------|------------|
| `docs/AgroGen-IA-Adendo-UX.pdf` | Referenciado no prompt | **Não existe** na pasta `docs/` | Regras LGPD extraídas de `AgroGen-IA-API-RESTful.pdf` (seção USR-03) e `AgroGen-IA-Entidades.pdf` (ENT-15) |
| Entidade Ocorrência (OCO) | Presente no PDF (ENT-13) | **Ausente** no `endpoint/agroGen_schema.sql` | Criada como nova tabela `ocorrencias` via `models/ocorrencia_model.py`; migration gerada pelo Alembic |
| Entidade Alimentação (ALI) | Presente no SQL | Doc recomenda adiar para v1.1 | Mantida no SQL/ORM; endpoints adiados para Fase 2 |
| Protocolo Hormonal | Entidade separada no doc | Simplificação doc: campo VARCHAR em INS | Mantido como entidade (já existe no SQL); simplificação fica para decisão de produto |

---

## O que Fica Fora da Fase 1

| Item | Justificativa |
|------|--------------|
| Testes (pytest) | Fase 2 — necessita banco de teste e fixtures |
| CI/CD (GitHub Actions) | Fase 2 |
| RBAC completo (decorators por perfil) | Fase 2 — `get_current_user` está pronto; falta `require_perfil()` |
| Job assíncrono de exportação LGPD | USR-03 retorna dados síncronos no MVP; Fase 2 integra fila/email |
| Alertas automáticos (triggers Python) | Triggers no banco (SQL) já existem para `proxima_dose`; lógica Python em Fase 3 |
| Routers/services para 8 entidades novas | Models e repositories criados; endpoints em Fase 2 |
| Integração e-mail (SendGrid/SMTP) | `auth_service.solicitar_recuperacao` tem TODO comentado |

---

## Estrutura Final da Fase 1

```
backend/
├── api/index.py              — FastAPI app, middlewares, /api/v1 prefix, exception handler
├── core/
│   ├── config.py             — Settings (+ ACCESS_TOKEN_EXPIRE_HOURS, REFRESH_TOKEN_EXPIRE_DAYS)
│   ├── database.py           — AsyncEngine, NullPool, get_db (Base removida)
│   ├── security.py           — bcrypt, JWT HS256, create_refresh_token (NOVO)
│   └── deps.py               — get_current_user Depends (NOVO)
├── middleware/
│   └── request_id.py         — X-Request-ID middleware (NOVO)
├── models/                   — 18 models (16 domínio + 2 tokens auth)
├── repositories/             — 16 repositories (5 existentes + 11 novos + BaseRepository)
├── schemas/
│   ├── common.py             — SuccessEnvelope, ErrorEnvelope (NOVO)
│   └── auth_schema.py        — Schemas de autenticação (NOVO)
├── services/
│   ├── auth_service.py       — Login/register/refresh/logout/recuperação (NOVO)
│   └── user_service.py       — SHA256 → bcrypt (CORRIGIDO)
├── routers/
│   ├── auth_router.py        — /api/v1/auth/* AUTH-01 a AUTH-05 (NOVO)
│   └── user_me_router.py     — /api/v1/usuarios/me USR-01 a USR-03 (NOVO)
├── alembic/                  — Migrations async (NOVO)
├── Dockerfile                — Multi-stage Python 3.11-slim (NOVO)
├── docker-compose.yml        — api + postgres:15-alpine (NOVO)
└── .env.example              — Template de variáveis (NOVO)
```
