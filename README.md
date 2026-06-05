<div align="center">

# 🐄 AgroGen IA

**Sistema de Coleta de Dados Genéticos e Monitoramento de Inseminação Artificial**  
**em Bovinos, Ovinos e Caprinos com uso de Inteligência Artificial**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Hackathon](https://img.shields.io/badge/Hackathon-Expoagro%20Crateús%202026-green)](https://www.crateus.ce.gov.br)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://postgresql.org)

</div>

---

## 📖 Sobre o Projeto

O **AgroGen IA** é uma plataforma web responsiva desenvolvida para apoiar produtores rurais, técnicos agropecuários e veterinários da região de Crateús – CE no gerenciamento genético e reprodutivo de rebanhos bovinos, ovinos e caprinos.

O sistema centraliza o registro de dados reprodutivos — historicamente feito em cadernos e planilhas dispersas — e aplica **Inteligência Artificial** para predição de taxa de prenhez, identificação de padrões de fertilidade e recomendação de cruzamentos genéticos.

Desenvolvido para o **Hackathon Expoagro Crateús 2026**, promovido pela Prefeitura Municipal de Crateús por meio da Secretaria de Planejamento e Tecnologia da Informação.

---

## ✨ Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| 🐮 **Gestão de Animais** | Cadastro completo de bovinos, ovinos e caprinos com dados genéticos (raça, DEPs, genealogia) |
| 💉 **Inseminação Artificial** | Registro de eventos de IA, diagnósticos de gestação e fila de pendentes |
| 🤖 **Análise com IA** | Predição de prenhez (Random Forest), padrões de fertilidade (K-Means) e seleção genética |
| 📓 **Diário de Bordo** | Controle de peso, parição, sanitário e ocorrências por animal |
| 📊 **Relatórios** | Desempenho reprodutivo e ponderal com exportação em PDF e CSV |
| 🔔 **Dashboard & Alertas** | KPIs do rebanho, gráficos e alertas automáticos de diagnósticos pendentes |
| 📱 **PWA** | Instalável como app, funciona offline com sincronização automática |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│         React 18 + Vite + TypeScript + PWA              │
│              Mobile-first · Tailwind CSS                │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API (JSON) / HTTPS
┌─────────────────────▼───────────────────────────────────┐
│                     BACKEND                             │
│           Python 3.11 + FastAPI + SQLAlchemy            │
│         JWT Auth · WeasyPrint · Alembic (migrations)    │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
┌──────────────▼──────┐  ┌────────────▼────────────────┐
│     BANCO DE DADOS  │  │     MICROSSERVIÇO DE IA      │
│    PostgreSQL 15    │  │  Python + FastAPI + sklearn  │
│  uuid-ossp · pg_trgm│  │  Random Forest · K-Means    │
└─────────────────────┘  └─────────────────────────────┘
```

---

## 📁 Estrutura do Repositório

```
agrogen-ia/
├── frontend/          # React 18 + Vite + TypeScript
├── backend/           # Python + FastAPI (API principal)
├── ia/                # Python + FastAPI (microsserviço ML)
├── docker-compose.yml          # Produção (sem Nginx)
├── docker-compose.nginx.yml    # Produção (com Nginx)
├── nginx.conf                  # Configuração do proxy reverso
├── .env.example                # Template de variáveis de ambiente
└── README.md
```

---

## 🚀 Início Rápido

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) >= 24.0
- [Docker Compose](https://docs.docker.com/compose/) >= 2.20
- [Git](https://git-scm.com/)

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/agrogen-ia.git
cd agrogen-ia
```

### 2. Configurar as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
POSTGRES_PASSWORD=sua_senha_forte_aqui
JWT_SECRET_KEY=gere_com_python_secrets_token_hex_32
```

Para gerar o `JWT_SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Subir com Docker

**Versão simples (cada serviço em sua porta):**
```bash
docker compose up -d
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:80 |
| Backend (API) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

**Versão com Nginx (tudo na porta 80, sem CORS):**
```bash
docker compose -f docker-compose.nginx.yml up -d
```

| Serviço | URL |
|---------|-----|
| Aplicação | http://localhost |
| API | http://localhost/api/v1 |
| API Docs | http://localhost:8000/docs |

### 4. Verificar se está rodando

```bash
docker compose ps
# Todos os serviços devem estar com status "healthy"
```

---

## 💻 Rodando Localmente (sem Docker)

Consulte os READMEs específicos de cada serviço:

- [`frontend/README.md`](./frontend/README.md) — React + Vite
- [`backend/README.md`](./backend/README.md) — Python + FastAPI

---

## 🤖 Inteligência Artificial

O AgroGen IA implementa **três abordagens de IA**:

| Abordagem | Técnica | Finalidade |
|-----------|---------|------------|
| Predição de Prenhez | Random Forest (scikit-learn) | Score 0–100% de probabilidade antes da inseminação |
| Padrões de Fertilidade | K-Means Clustering | Identificação de grupos e padrões no rebanho |
| Seleção Genética | Sistema de Scoring + Regras | Recomendação de cruzamentos com controle de endogamia |

O modelo foi treinado com **1.300 registros** históricos calibrados com base na literatura zootécnica (EMBRAPA GENECOC, Hafez 2004) e utiliza **14 features** incluindo condição corporal, intervalo pós-parto, histórico de prenhez, DEPs e temperatura ambiente.

> ⚠️ As predições da IA são estimativas probabilísticas e não substituem o julgamento clínico veterinário.

---

## 🔒 Conformidade com a LGPD

O sistema foi desenvolvido em conformidade com a Lei nº 13.709/2018 (LGPD):

- **Dados mínimos**: apenas os dados necessários para as finalidades declaradas
- **Consentimento**: aceite explícito dos termos no cadastro
- **Portabilidade**: exportação de dados em JSON sob demanda
- **Eliminação**: exclusão completa da conta em até 30 dias
- **Segurança**: senhas com bcrypt (custo 12), comunicação via HTTPS/TLS, logs de auditoria

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Hook Form + Zod |
| Backend | Python 3.11, FastAPI, SQLAlchemy (async), Alembic, WeasyPrint |
| IA / ML | scikit-learn, pandas, numpy, joblib |
| Banco de Dados | PostgreSQL 15 |
| Autenticação | JWT (access 24h + refresh 7d) |
| PWA | vite-plugin-pwa, Workbox |
| Infraestrutura | Docker, Docker Compose, Nginx |

---

## 📋 Perfis de Usuário

| Perfil | Descrição |
|--------|-----------|
| **Produtor Rural** | Cadastro de animais, visualização de relatórios |
| **Técnico Agropecuário** | Registro de inseminações, análise de IA |
| **Médico Veterinário** | Diagnósticos, análise genética avançada |
| **Administrador** | Gestão geral da plataforma |

---

## 👥 Equipe

Desenvolvido pela equipe **AgroGen IA** para o Hackathon Expoagro Crateús 2026.

| Nome | Papel | Perfil |
|------|-------|-------|
| Rick Farias | SEO / PO | [Github](https://github.com/Rickfarias)
| Kaik | Full Stack / IA | [Github](https://github.com/KaikMcpe12)
| Lucas Rodrigue | Backend | [Github](https://github.com/lucasrds401)
| João Pedro | Backend / Banco de Dados | [Github](https://github.com/pedroolivsz)
| Pablo Cosme | IA | [Github](https://github.com/pablocosme)

---

## 📄 Licença

Distribuído sob a licença **GNU General Public License v3.0**.  
Veja [`LICENSE`](./gpl-3.0.txt) para mais informações.

---

## 🏆 Hackathon Expoagro Crateús 2026

Desenvolvido para o **1º Hackathon Expoagro Crateús**, promovido pela Prefeitura Municipal de Crateús por meio da Secretaria de Planejamento e Tecnologia da Informação.

**Desafio:** Sistema de Coleta de Dados Genéticos para Monitoramento de Inseminação Artificial em Bovinos, Ovinos e Caprinos.

---

<div align="center">
  Feito com ❤️ no sertão do Ceará · Crateús – CE
</div>
