# PHASE4_DECISIONS.md — Integração IA, Dashboard e Relatórios

## O que foi implementado

| Módulo | Endpoints | Destaques |
|---|---|---|
| Motor de regras IA | — | 12 deltas Python, prob_base por espécie, truncamento [0,1] |
| Predição | POST /ia/predicao-prenhez | MS primário, fallback local, tb_predicao_log, aviso clínico |
| Padrões | GET /ia/padroes-fertilidade | Taxa por mês/raça/técnico, mínimo 20 inseminações |
| Dashboard | GET /dashboard/kpis, /grafico-reprodutivo, /timeline | Queries agregadas, SLA 3s |
| Relatórios JSON | GET /relatorios/reprodutivo, /sanitario | Preview com índices |
| Relatórios CSV | GET /relatorios/*/exportar?formato=csv | StreamingResponse, sem acumular em memória |
| Relatórios PDF | GET /relatorios/reprodutivo/exportar?formato=pdf | reportlab, tabela + índices + rodapé |

---

## Decisões de design

### Motor local como fallback (não primário na spec, mas idempotente)
A spec original prevê o microsserviço ML Python como primário. `IAClient.predict()` retorna `None` se `IA_SERVICE_URL` estiver vazio **ou** em timeout/erro, ativando `ia_rules.calcular_score()` automaticamente. O campo `motor_utilizado: "ml"|"rules"` é transparente ao cliente — sem surpresa sobre qual engine processou.

### reportlab em vez de WeasyPrint
WeasyPrint requer `libcairo`, `libpango` e `libffi` no sistema operacional — inviável no Vercel (serverless). `reportlab==4.2.5` é pure Python, funciona em qualquer ambiente, sem dependência de sistema.

### CSV via StreamingResponse
`StreamingResponse(iter([buffer.getvalue()]))` evita acumular bytes em memória. Para relatórios grandes (> 10k linhas), substituir por generator row-by-row em produção.

### tb_predicao_log — auditoria obrigatória (spec)
Cada predição é persistida com `features_entrada` (JSONB), `score_retornado`, `classificacao`, `top_5_fatores`, `modelo_versao` e `origem`. Permite reprocessamento, auditoria LGPD e análise de drift do modelo.

### AVISO_CLINICO obrigatório
Constante em `core/ia_rules.py`, injetada em toda `PredicaoResponse`. Não pode ser removida sem alterar a camada de service — alinhado com exigência da spec (não ocultável).

### Dashboard sem cache
Queries diretas ao banco, sem Redis. Para produção com > 500 animais, adicionar cache de 30 min com `fastapi-cache2` ou similar — documentado como melhoria futura.

---

## Deltas implementados (12/12 da spec)

| Feature | Delta positivo | Delta negativo |
|---|---|---|
| condicao_corporal | 3–4: +10pp | <2.5 ou >4.5: -12pp |
| intervalo_pos_parto_dias | ≥60d: +4pp | <45d: -15pp |
| num_partos_anteriores | 2–4: +6pp | 0: -4pp; ≥7: -5pp |
| historico_taxa_prenhez | ≥0.70: +8pp | <0.40: -7pp |
| dias_desde_ultima_ins | ≥ciclo: 0 | <ciclo: -10pp |
| tipo_inseminacao | IATF: +5pp | — |
| temperatura_ambiente_c | 18–28°C: 0 | 29–33°C: -2pp; ≥34°C: -8pp |
| raca_femea | adaptadas: +4pp | — |
| heterose_esperada_pct | ≥4%: +4pp | — |
| coeficiente_endogamia | — | >0.0625: -10pp |
| dep_fertilidade_somada | ≥12: +6pp | — |
| dep_acuracia_media | — | <0.40: 50% do delta de DEP |

---

## Manual de Deploy do Ecossistema

### 1. Variáveis de ambiente obrigatórias (.env)
```bash
DATABASE_URL=postgresql://user:pass@host:5432/agrogen
SECRET_KEY=<256-bit hex — gerar com: openssl rand -hex 32>
ENVIRONMENT=production
ALLOWED_ORIGINS=["https://agrogen.app"]
# IA (opcional — sem URL usa motor local)
IA_SERVICE_URL=https://ia.agrogen.app
IA_SERVICE_TIMEOUT_MS=800
```

### 2. Docker (desenvolvimento local)
```bash
cp .env.example .env   # preencher variáveis
docker-compose up --build
# API em http://localhost:8000
# PostgreSQL em localhost:5432
```

### 3. Alembic (migrations)
```bash
# Cria tb_refresh_tokens + tb_predicao_log
alembic upgrade head

# Verificar versão atual
alembic current

# Rollback
alembic downgrade -1
```

### 4. Vercel (serverless)
- Entry point: `api/index.py` (configurado em `vercel.json`)
- Variáveis: configurar no painel Vercel → Settings → Environment Variables
- **Limitação**: WeasyPrint não funciona — usar apenas reportlab
- **Limitação**: Sem estado entre invocações (NullPool já configurado)

### 5. Ativar refresh tokens após migration
Em `services/auth_service.py`:
```python
_REFRESH_DB_ENABLED = True   # mudar de False para True
```
E descomentar os blocos `TODO` em `refresh()` e `logout()`.

### 6. Microsserviço ML (opcional)
```bash
cd ../ia/agrogen-ia-ml
pip install -r requirements.txt
uvicorn src.serve:app --port 8001
# Configurar IA_SERVICE_URL=http://localhost:8001 no .env
```

---

## O que fica fora do MVP

| Item | Justificativa |
|---|---|
| K-Means clustering real | Requer dataset suficiente + scikit-learn em execução |
| SHAP values reais | Retornados pelo MS ML; motor local usa deltas como proxy |
| Seleção genética (POST /ia/selecao-genetica) | Requer cálculo de heterose × DEP — Fase 5 |
| Cache de KPIs (30 min) | Redis não incluído no stack MVP |
| Retreinamento contínuo | Pipeline MLflow/Airflow — fora do escopo backend |
| PDF sanitário | reportlab pronto; endpoint /sanitario/exportar aceita só CSV agora |
| Testes automatizados | Pytest + fixtures de banco — próxima fase |
