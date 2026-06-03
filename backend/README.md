<div align="center">

# AgroGen IA — Backend

**Python 3.11 · FastAPI · PostgreSQL 15 · SQLAlchemy · JWT**

</div>

---

## 📦 Tecnologias

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| [Python](https://python.org) | 3.11 | Linguagem principal |
| [FastAPI](https://fastapi.tiangolo.com) | 0.110+ | Framework web (REST API + Swagger automático) |
| [SQLAlchemy](https://sqlalchemy.org) | 2.x (async) | ORM com suporte assíncrono |
| [Alembic](https://alembic.sqlalchemy.org) | — | Migrations de banco de dados |
| [asyncpg](https://github.com/MagicStack/asyncpg) | — | Driver PostgreSQL assíncrono |
| [Pydantic](https://docs.pydantic.dev) | v2 | Validação de dados e schemas |
| [python-jose](https://github.com/mpdavis/python-jose) | — | JWT (access + refresh token) |
| [passlib + bcrypt](https://passlib.readthedocs.io) | — | Hash de senhas (custo 12) |
| [WeasyPrint](https://weasyprint.org) | — | Geração de relatórios em PDF |
| [Uvicorn](https://uvicorn.org) | — | Servidor ASGI de produção |
| [httpx](https://www.python-httpx.org) | — | Cliente HTTP para comunicar com microsserviço IA |

---

## 🏗️ Arquitetura

```
backend/
├── Dockerfile
├── requirements.txt
├── alembic.ini
├── alembic/
│   └── versions/            # Migrations geradas automaticamente
└── app/
    ├── main.py              # Instância FastAPI + routers + CORS + middleware
    ├── config.py            # Configurações via variáveis de ambiente (pydantic-settings)
    ├── database.py          # Engine, SessionLocal, Base
    ├── dependencies.py      # get_db, get_current_user, get_fazenda_ativa
    │
    ├── models/              # Modelos SQLAlchemy (entidades do banco)
    │   ├── usuario.py
    │   ├── fazenda.py
    │   ├── animal.py
    │   ├── dados_geneticos.py
    │   ├── reprodutor.py
    │   ├── inseminacao.py
    │   ├── diagnostico_gestacao.py
    │   ├── pesagem.py
    │   ├── parto.py
    │   ├── evento_sanitario.py
    │   ├── ocorrencia.py
    │   └── alerta.py
    │
    ├── schemas/             # Schemas Pydantic (request/response)
    │   ├── animal.py
    │   ├── inseminacao.py
    │   └── ...
    │
    ├── routers/             # Endpoints agrupados por domínio
    │   ├── auth.py          # /api/v1/auth/*
    │   ├── usuarios.py      # /api/v1/usuarios/*
    │   ├── fazendas.py      # /api/v1/fazendas/*
    │   ├── animais.py       # /api/v1/animais/*
    │   ├── reprodutores.py  # /api/v1/reprodutores/*
    │   ├── inseminacoes.py  # /api/v1/inseminacoes/*
    │   ├── diario.py        # /api/v1/diario/*
    │   ├── ia.py            # /api/v1/ia/*
    │   ├── alertas.py       # /api/v1/alertas/*
    │   ├── dashboard.py     # /api/v1/dashboard/*
    │   └── relatorios.py    # /api/v1/relatorios/*
    │
    ├── services/            # Lógica de negócio (desacoplada dos routers)
    │   ├── auth_service.py
    │   ├── animal_service.py
    │   ├── inseminacao_service.py
    │   ├── ia_service.py    # Chama microsserviço IA + fallback de regras
    │   ├── pdf_service.py   # WeasyPrint
    │   └── ...
    │
    ├── core/
    │   ├── security.py      # JWT, bcrypt, refresh token
    │   ├── exceptions.py    # Handlers de erro padronizados
    │   └── middleware.py    # Logging, X-Fazenda-ID
    │
    └── seeds/
        └── demo.py          # Dados de demonstração para o hackathon
```

---

## 🔌 API

A API segue padrão REST com versionamento em URL (`/api/v1/`).

**Documentação interativa (Swagger):**
```
http://localhost:8000/docs
```

**ReDoc:**
```
http://localhost:8000/redoc
```

### Envelope padrão de resposta

```json
// Sucesso
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 142 }
}

// Erro
{
  "success": false,
  "error": {
    "status": 422,
    "codigo": "INTERVALO_CURTO",
    "mensagem": "Este animal teve inseminação há apenas 15 dias.",
    "timestamp": "2026-06-05T10:30:00Z"
  }
}
```

### Autenticação

Todas as rotas (exceto `/auth/*`) exigem o header:
```
Authorization: Bearer <access_token>
```

O contexto de fazenda é passado via header:
```
X-Fazenda-ID: <uuid-da-fazenda-ativa>
```

---

## ⚡ Rodando Localmente

### Pré-requisitos

- Python 3.11+
- PostgreSQL 15 rodando localmente (ou via Docker)
- `pip` ou `uv`

### Instalação

```bash
cd backend

# Criar ambiente virtual
python -m venv .venv
source .venv/bin/activate      # Linux/macOS
# .venv\Scripts\activate       # Windows

# Instalar dependências
pip install -r requirements.txt
```

### Variáveis de ambiente

```bash
cp .env.example .env
```

```env
# .env
DATABASE_URL=postgresql+asyncpg://agrogen:agrogen123@localhost:5432/agrogen
JWT_SECRET_KEY=gere_com_python_secrets_token_hex_32
APP_ENV=development
LOG_LEVEL=debug
IA_SERVICE_URL=http://localhost:8001
```

### Criar o banco e rodar migrations

```bash
# Criar banco no PostgreSQL (se não existir)
createdb agrogen

# Rodar migrations
alembic upgrade head
```

### Iniciar o servidor

```bash
uvicorn app.main:app --reload --port 8000
# API disponível em http://localhost:8000
# Swagger em http://localhost:8000/docs
```

### Popular com dados de demonstração

```bash
python -m app.seeds.demo
# Cria usuários de teste, fazenda de exemplo e alguns animais
```

**Credenciais de demonstração:**
| Perfil | E-mail | Senha |
|--------|--------|-------|
| Produtor | produtor@demo.com | Demo@123 |
| Técnico | tecnico@demo.com | Demo@123 |
| Veterinário | vet@demo.com | Demo@123 |

---

## 🐳 Rodando com Docker

### Somente o backend + banco

```bash
docker compose up postgres backend -d
# API disponível em http://localhost:8000
```

### Com toda a stack

Na raiz do projeto:

```bash
# Sem Nginx
docker compose up -d

# Com Nginx
docker compose -f docker-compose.nginx.yml up -d
```

As migrations são executadas **automaticamente** pelo entrypoint antes do servidor subir.

---

## 🗄️ Banco de Dados

**PostgreSQL 15** com as extensões:
- `uuid-ossp` — geração de UUIDs v4
- `pg_trgm` — busca textual eficiente (ILIKE com índice GIN)
- `unaccent` — busca sem acentos

### Criar nova migration

```bash
# Após alterar um model SQLAlchemy:
alembic revision --autogenerate -m "descricao_da_mudanca"
alembic upgrade head
```

### Rollback de migration

```bash
alembic downgrade -1
```

---

## 🤖 Integração com o Microsserviço de IA

O backend se comunica com o microsserviço de ML via HTTP interno:

```
POST http://ia:8001/predicao
```

Em caso de timeout (> 800ms) ou indisponibilidade, o backend ativa automaticamente o **Motor de Regras** (fallback determinístico em Python puro) e retorna a predição com o campo `motor_utilizado: "rules"` em vez de `"ml"`.

---

## 🔐 Segurança

- Senhas com **bcrypt** (custo 12)
- **JWT** com access token (24h) + refresh token (7d, com rotação)
- Bloqueio de conta após **5 tentativas falhas** (15 minutos)
- **HTTPS obrigatório** em produção (configurado via Nginx)
- **Rate limiting** configurado no Nginx (10 req/min no login)
- Todos os dados filtrados por `fazenda_id` do usuário autenticado
- Trilha de **auditoria** em todas as operações de criação, edição e exclusão

---

## 📋 Principais Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/v1/auth/login` | Autenticação |
| `POST` | `/api/v1/auth/registro` | Cadastro de conta |
| `POST` | `/api/v1/auth/refresh` | Renovar access token |
| `GET` | `/api/v1/animais` | Listar rebanho (com filtros e paginação) |
| `POST` | `/api/v1/animais` | Cadastrar animal |
| `GET` | `/api/v1/animais/{id}` | Detalhes do animal |
| `POST` | `/api/v1/inseminacoes` | Registrar inseminação |
| `POST` | `/api/v1/inseminacoes/{id}/diagnostico` | Registrar diagnóstico |
| `POST` | `/api/v1/ia/predicao-prenhez` | Predição IA de prenhez |
| `GET` | `/api/v1/dashboard/kpis` | KPIs do dashboard |
| `GET` | `/api/v1/relatorios/reprodutivo/exportar?formato=pdf` | Exportar relatório |

Documentação completa em `/docs` (Swagger) após subir o servidor.

---

## 🔧 Scripts úteis

```bash
# Rodar com hot reload
uvicorn app.main:app --reload

# Verificar tipos com mypy
mypy app/

# Formatar código
ruff format app/
ruff check app/

# Gerar nova migration
alembic revision --autogenerate -m "nome"

# Aplicar migrations
alembic upgrade head

# Popular dados de demo
python -m app.seeds.demo
```

---

## 📄 Licença

GNU GPL v3.0 — veja [`../LICENSE`](../LICENSE)
