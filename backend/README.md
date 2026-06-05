# AgroGen IA — Backend

API REST para gestão genético-reprodutiva de rebanhos bovinos, ovinos e caprinos com predição de prenhez por inteligência artificial.

---

## Stack

| Componente | Tecnologia |
|---|---|
| Framework | FastAPI 0.136 |
| ORM | SQLAlchemy 2.0 (async) |
| Banco de dados | PostgreSQL 15+ |
| Driver async | asyncpg |
| Autenticação | JWT (python-jose) + bcrypt (passlib) |
| Validação | Pydantic v2 |
| Migrations | Alembic |
| Relatórios PDF | reportlab |
| Cliente HTTP | httpx (microsserviço IA) |
| Deploy | Vercel (serverless) / Docker |

---

## Pré-requisitos

- Python 3.11+
- PostgreSQL 15+
- (Opcional) Docker + Docker Compose

---

## Execução Local

### 1. Clonar e instalar dependências

```bash
git clone <repo-url>
cd backend
pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com suas configurações
```

Variáveis obrigatórias:

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://user:pass@localhost:5432/agrogen` |
| `SECRET_KEY` | Chave JWT (mín. 32 chars) | `openssl rand -hex 32` |
| `ENVIRONMENT` | `development` ou `production` | `development` |
| `ALLOWED_ORIGINS` | Origens CORS (JSON array) | `["http://localhost:3000"]` |
| `IA_SERVICE_URL` | URL do microsserviço ML (opcional) | `http://localhost:8001` |

### 3. Criar o banco de dados

```bash
# Criar banco
psql -U postgres -c "CREATE DATABASE agrogen;"

# Aplicar schema (tabelas, triggers, enums)
psql -U postgres -d agrogen -f endpoint/agroGen_schema.sql

# Criar tabelas adicionais via Alembic
alembic upgrade head

# (Opcional) Povoar com dados de exemplo
psql -U postgres -d agrogen -f endpoint/seed.sql
```

### 4. Rodar o servidor

```bash
uvicorn api.index:app --reload
```

API disponível em: **http://localhost:8000**

Documentação Swagger: **http://localhost:8000/docs**

---

## Docker (recomendado para desenvolvimento)

```bash
# Subir API + PostgreSQL
docker-compose up --build

# Em background
docker-compose up -d --build

# Aplicar schema e seed
docker-compose exec api sh -c "psql $DATABASE_URL -f endpoint/agroGen_schema.sql"
docker-compose exec api sh -c "alembic upgrade head"
docker-compose exec api sh -c "psql $DATABASE_URL -f endpoint/seed.sql"

# Parar
docker-compose down
```

Serviços:
- **API**: http://localhost:8000
- **PostgreSQL**: localhost:5432 (user: `agrogen`, pass: `agrogen`, db: `agrogen`)

---

## Migrations (Alembic)

```bash
# Aplicar todas as migrations pendentes
alembic upgrade head

# Ver versão atual
alembic current

# Ver histórico
alembic history

# Reverter última migration
alembic downgrade -1

# Criar nova migration (após alterar um model)
alembic revision --autogenerate -m "descricao da alteracao"
```

Migrations disponíveis:
- `0001` — Cria `tb_refresh_tokens` (necessário para logout/refresh de token)
- `0002` — Cria `tb_predicao_log` (auditoria de predições de IA)

---

## Usuário Padrão (seed)

| Campo | Valor |
|---|---|
| Email | `agrogen@gmail.com` |
| Senha | `agrogen123` |
| Perfil | ADMIN |

---

## Endpoints Principais

| Grupo | Prefixo | Descrição |
|---|---|---|
| Autenticação | `/api/v1/auth` | Login, registro, refresh, logout, recuperação de senha |
| Usuário | `/api/v1/usuarios` | CRUD + `/me` (perfil, exportação LGPD) |
| Fazendas | `/api/v1/fazendas` | CRUD com guards (animais ativos, última fazenda) |
| Animais | `/api/v1/animals` | CRUD + filtros avançados, importação CSV, raças, histórico |
| Reprodutores | `/api/v1/reprodutores` | CRUD com validação de tipo (SEMEN_EXTERNO/ANIMAL_PROPRIO) |
| Inseminações | `/api/v1/inseminacoes` | Fluxo reprodutivo + diagnóstico via `POST /{id}/diagnostico` |
| Diário de Bordo | `/api/v1/diario/{animal_id}` | Pesagens, partos, sanitário, ocorrências |
| Alertas | `/api/v1/alertas` | Listagem, badge (sino), marcar lido/resolvido |
| IA | `/api/v1/ia` | Predição de prenhez, padrões de fertilidade |
| Dashboard | `/api/v1/dashboard` | KPIs, gráfico reprodutivo, timeline |
| Relatórios | `/api/v1/relatorios` | JSON preview + exportação CSV/PDF |
| Health | `/health` | Status da API |

---

## Deploy na Vercel

### Configuração do projeto na Vercel

| Campo | Valor |
|---|---|
| **Framework Preset** | Other |
| **Root Directory** | `backend` |
| **Build Command** | _(deixar vazio — Vercel detecta Python automaticamente)_ |
| **Install Command** | `pip install -r requirements.txt` |
| **Output Directory** | _(deixar vazio)_ |
| **Development Command** | `uvicorn api.index:app --reload --port $PORT` |

### Variáveis de ambiente na Vercel

Acesse **Settings → Environment Variables** e configure:

```
DATABASE_URL        = postgresql://user:pass@host:5432/agrogen
SECRET_KEY          = <gerar com: openssl rand -hex 32>
ENVIRONMENT         = production
ALLOWED_ORIGINS     = ["https://seu-frontend.vercel.app"]
ACCESS_TOKEN_EXPIRE_HOURS = 24
REFRESH_TOKEN_EXPIRE_DAYS = 7
IA_SERVICE_URL      = https://ia.agrogen.app   (opcional)
IA_SERVICE_TIMEOUT_MS = 800
```

> **Banco de dados na Vercel:** Use [Neon](https://neon.tech), [Supabase](https://supabase.com) ou [Railway](https://railway.app) — todos fornecem PostgreSQL 15 com URL compatível.

### Limitações do ambiente Vercel (serverless)

- Funções têm timeout de 10s (plano Hobby) ou 60s (plano Pro)
- Sem estado entre invocações (NullPool já configurado no projeto)
- WeasyPrint **não funciona** (requer libs de sistema) — o projeto usa `reportlab` (pure Python)
- Para migrations, execute `alembic upgrade head` localmente apontando para o banco de produção

### Deploy manual via CLI

```bash
npm i -g vercel
vercel login
cd backend
vercel --prod
```

---

<<<<<<< HEAD
## 📄 Licença

GNU GPL v3.0 — veja [`../LICENSE`](../LICENSE)
=======
## Ativar Refresh Tokens (após migration)

Os endpoints `/auth/refresh` e `/auth/logout` retornam 503 até que a migration seja aplicada. Para ativar:

1. Execute `alembic upgrade head` apontando para o banco de produção
2. Em `services/auth_service.py`, mude:
   ```python
   _REFRESH_DB_ENABLED = True
   ```
3. Descomente os blocos `TODO` nos métodos `refresh()` e `logout()`

---

## Testes

### Executar

```bash
# Ativar virtualenv (se usar)
source .venv/bin/activate

# Rodar todos os testes
python -m pytest tests/ -v

# Apenas testes unitários (sem mock)
python -m pytest tests/unit/ -v

# Apenas testes de integração (com mock de serviços)
python -m pytest tests/integration/ -v

# Com relatório de cobertura (requer pytest-cov)
pip install pytest-cov
python -m pytest tests/ --cov=. --cov-report=term-missing
```

### Suíte atual (133 testes, 0 falhas)

| Arquivo | Testes | Cobertura |
|---|---|---|
| `tests/unit/test_ia_rules.py` | 45 | 12 deltas do motor de regras, truncamento, classificação, top_5_fatores |
| `tests/unit/test_schemas.py` | 40 | Validadores Pydantic: datas, pesos por espécie, sexo/partos, coordenadas, IATF |
| `tests/unit/test_security.py` | 13 | bcrypt hash/verify, JWT create/decode/expiração, refresh token |
| `tests/integration/test_animal_service.py` | 19 | Máquina de estados (DESCARTADA terminal), validações de peso e sexo, 404 |
| `tests/integration/test_inseminacao_service.py` | 16 | Bloqueios (PRENHA/DESCARTADA/MACHO), intervalo mínimo + `forcar_registro`, alertas |

> Os testes de integração usam `unittest.mock.AsyncMock` — **não precisam de banco de dados real**.

---

## Estrutura do Projeto

```
backend/
├── api/
│   └── index.py           # Entrypoint FastAPI + middlewares + routers
├── alembic/               # Migrations (async)
├── core/
│   ├── config.py          # Settings (pydantic-settings)
│   ├── database.py        # AsyncEngine + NullPool + get_db
│   ├── deps.py            # get_current_user (JWT)
│   ├── ia_rules.py        # Motor de regras local (fallback IA)
│   └── security.py        # bcrypt + JWT
├── docs/                  # Decisões arquiteturais por fase
├── endpoint/
│   ├── agroGen_schema.sql # Schema completo (tabelas, triggers, enums)
│   └── seed.sql           # Dados de exemplo (150 animais, 100 inseminações...)
├── middleware/
│   └── request_id.py      # X-Request-ID em todas as respostas
├── models/                # SQLAlchemy ORM (18 entidades)
├── repositories/          # Acesso a dados (Repository Pattern)
├── routers/               # Endpoints HTTP (16 routers)
├── schemas/               # Pydantic v2 (request/response)
├── services/              # Lógica de negócio
├── .env.example
├── alembic.ini
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── vercel.json
```

---

## Arquitetura

```
Router → Service → Repository → Model (SQLAlchemy)
           ↓
        Schema (Pydantic) — validação de entrada/saída
```

Padrões adotados:
- **Repository Pattern** — toda query de banco passa pelo repositório
- **NullPool** — sem conexões persistentes (obrigatório para serverless)
- **Soft delete** — entidades marcadas com `ativo=False` (histórico preservado)
- **SuccessEnvelope / ErrorEnvelope** — formato padronizado de resposta
- **X-Request-ID** — header de rastreabilidade em todas as respostas

---

## Documentação das Decisões por Fase

| Fase | Arquivo | Conteúdo |
|---|---|---|
| Fase 1 | `docs/PHASE1_DECISIONS.md` | Fundação: Base class, bcrypt, JWT, Alembic, Docker |
| Fase 2 | `docs/PHASE2_DECISIONS.md` | CRUDs: Fazendas, Animais, Reprodutores |
| Fase 3 | `docs/PHASE3_DECISIONS.md` | Reprodutivo: Inseminações, Diário, Alertas |
| Fase 4 | `docs/PHASE4_DECISIONS.md` | IA, Dashboard, Relatórios + manual de deploy |
>>>>>>> backend
