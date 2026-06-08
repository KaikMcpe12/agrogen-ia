# AUDITORIA DE INCONSISTÊNCIAS — AgroGen IA Backend

**Data:** 2026-06-07  
**Documentos auditados:**
- `docs/AgroGen-IA-API-RESTful.pdf` (v1.0, 46 p.)
- `docs/AgroGen-IA-Matriz-IA.pdf` (v1.0, 32 p.)
- `docs/IA-README.md`

**Código auditado:** `/home/kaik/Documentos/www/AgroGen/backend` (branch `backend`)  
**Premissa:** sem prefixo `api/v1` nas rotas; estrutura de pastas atual mantida.

---

## Sumário Executivo

| Severidade | Qtd | Descrição |
|------------|-----|-----------|
| 🔴 Crítico | 16 | Endpoints ausentes, bugs de contrato que causam falha imediata no frontend |
| 🟡 Médio | 14 | Campos faltando em request/response, paginação divergente, parâmetros errados |
| 🟢 Baixo | 6 | Nomenclatura interna, extras não documentados, inconsistências entre docs |

**Total: 36 pontos**

---

## ✅ STATUS DE RESOLUÇÃO (atualizado em 2026-06-08)

Todos os pontos acionáveis foram resolvidos em **12 commits** na branch `backend`.

| Commit | Pontos resolvidos |
|--------|-------------------|
| 1 `fix(ia): response envelope` | 2.1, 4.4 (parcial: `tipo_inseminacao`) |
| 2 `fix(ia): feature naming` | 2.7, 2.8, 5.1, 6.2 |
| 3 `fix(ia): padroes-fertilidade` | 2.2, 2.3 |
| 4 `fix(inseminacoes): protocolo/tecnico/alerta` | 2.4, 2.5 |
| 5 `fix(inseminacoes): sort/order + pendentes` | 3.1, 4.6 |
| 6 `fix(inseminacoes): INS-06/07/08` | 1.3, 1.4, 1.5 |
| 7 `fix(animais): dados_geneticos` | 4.1, 4.2, 4.3 |
| 8 `fix(diario): paginação/pdf/patch` | 1.6, 1.7, 3.2, 3.3, 4.7 |
| 9 `fix(alertas): paginação/animal/resolver` | 3.5, 4.8, 4.10, 6.3 |
| 10 `fix(relatorios): ponderal` | 1.8, 1.9, 3.4 |
| 11 `fix(ia): selecao-genetica/modelo-info` | 1.1, 1.2 |
| 12 `fix(varios): fazenda/dashboard/README` | 3.6, 4.9, 5.2 |

**Itens não acionados (decisão consciente):**
- **5.3 / 5.4 (parametrização via `tb_regras_scoring`)** — mantido hardcoded em `core/ia_rules.py`. A tabela de configuração no BD é evolução pós-MVP; os deltas atuais já produzem o score correto. Documentado, não bloqueia.
- **6.1 (`id` vs `inseminacao_id`)** — já está consistente (serializa como `id`); nenhuma ação necessária.
- **6.4 (`OUTRO` no enum sanitário)** — valor extra inofensivo; mantido.
- **Seção 7 (endpoints extras)** — `/ia/predicoes/{animal_id}`, `/animais/counts`, `/alertas/badge` mantidos por serem úteis ao frontend.
- **Seção 8** — inconsistências entre docs; a do README (fórmula) foi corrigida no commit 12.

---

## 1. Endpoints Completamente Ausentes

Endpoints documentados que **não existem** no código atual.

### 1.1 `POST /ia/selecao-genetica` — IA-03
**Arquivo esperado:** `routers/ia_router.py`  
**Doc (API RESTful p.29-30):**  
```json
Request: { "fazenda_id": "uuid", "objetivos": ["GANHO_PESO","FERTILIDADE"],
           "matrizes_ids": ["uuid-1"], "reprodutores_ids": ["uuid-2"] }
Response: { "success": true, "data": { "recomendacoes": [
  { "matriz": {...}, "reprodutor": {...}, "score_genetico": 0.89,
    "heterose_esperada_pct": 4.2, "risco_endogamia_f": 0.012,
    "alerta_consanguinidade": false, "justificativa": "..." }
]}}
```
**Situação atual:** Endpoint ausente. `ia_router.py` só tem `/predicao-prenhez`, `/predicoes/{animal_id}` e `/padroes-fertilidade`.

---

### 1.2 `GET /ia/modelo-info` — IA-04
**Arquivo esperado:** `routers/ia_router.py`  
**Doc (API RESTful p.46):** Retorna metadados do modelo ML (versão, métricas, features ativas).  
**Situação atual:** Ausente no router Python. Existe no microsserviço Python (`/model-info`) mas não é exposto pelo backend.

---

### 1.3 `PATCH /inseminacoes/{id}` — INS-06
**Arquivo esperado:** `routers/inseminacao_router.py`  
**Doc (API RESTful p.46):** Perfis mínimos: TECNICO, VET, ADMIN.  
**Situação atual:** Ausente. O router atual só tem GET (lista), GET (pendentes), POST (criar), GET (por id) e POST (diagnóstico).

---

### 1.4 `GET /inseminacoes/{id}/diagnostico` — INS-07
**Arquivo esperado:** `routers/inseminacao_router.py`  
**Doc (API RESTful p.46):** Retorna o diagnóstico de uma inseminação específica.  
**Situação atual:** Ausente.

---

### 1.5 `DELETE /inseminacoes/{id}` — INS-08
**Arquivo esperado:** `routers/inseminacao_router.py`  
**Doc (API RESTful p.46):** Perfil mínimo: ADMIN.  
**Situação atual:** Ausente.

---

### 1.6 `GET /diario/{animal_id}/exportar-pdf` — DIA-09
**Arquivo esperado:** `routers/diario_router.py`  
**Doc (API RESTful p.27):** Gera e retorna PDF da ficha zootécnica do animal.  
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="ficha-BOV-0012-Mimosa-2026-06-05.pdf"
```
**Situação atual:** Ausente em `diario_router.py`.

---

### 1.7 `PATCH /diario/{animal_id}/pesagens/{id}` — DIA-10
**Arquivo esperado:** `routers/diario_router.py`  
**Doc (API RESTful p.46):** Atualizar pesagem existente.  
**Situação atual:** Ausente.

---

### 1.8 `GET /relatorios/ponderal` — REL-02
**Arquivo esperado:** `routers/relatorio_router.py`  
**Doc (API RESTful p.36-37):** Relatório de desempenho ponderal — GMD, curvas de crescimento por animal. Query params: `fazenda_id`, `especie`, `data_inicio`, `data_fim`, `page`, `limit`.  
```json
Response: { "data": [{ "animal_codigo": "BOV-0012", "nome": "Mimosa",
  "ultima_pesagem_kg": 420.0, "gmd_periodo": 0.285, "num_pesagens": 6 }], "meta": {...} }
```
**Situação atual:** Ausente.

---

### 1.9 `GET /relatorios/ponderal/exportar` — REL-05
**Arquivo esperado:** `routers/relatorio_router.py`  
**Doc (API RESTful p.46):** Exportação do relatório ponderal.  
**Situação atual:** Ausente.

---

## 2. Bugs de Contrato — Falha Garantida no Frontend

### 2.1 🔴 `POST /ia/predicao-prenhez` — Response sem envelope
**Arquivo:** `routers/ia_router.py` linha 21-27  
**Problema:** O endpoint usa `response_model=PredicaoResponse` e retorna o objeto diretamente, **sem** o envelope padrão `{ "success": true, "data": {...} }`.

```python
# ATUAL (linha 21-27 — ERRADO)
@router.post("/predicao-prenhez", response_model=PredicaoResponse)
async def predicao_prenhez(...):
    return await svc.predizer(data)
```

**Esperado pela documentação (API RESTful p.28):**
```json
{
  "success": true,
  "data": {
    "predicao_id": "uuid",
    "animal_id": "uuid-animal",
    "score_prenhez": 0.78,
    ...
  }
}
```

**Todos os outros endpoints** da aplicação retornam `{"success": True, "data": ...}`. Este é o único que não segue o padrão — **vai quebrar o frontend**.

**Correção:** Remover `response_model=PredicaoResponse` e envolver com envelope:
```python
@router.post("/predicao-prenhez")
async def predicao_prenhez(...):
    result = await svc.predizer(data)
    return {"success": True, "data": result}
```

---

### 2.2 🔴 `GET /ia/padroes-fertilidade` — Query params completamente diferentes
**Arquivo:** `routers/ia_router.py` linhas 41-52  
**Documentação (API RESTful p.29):** `fazenda_id`, `data_inicio`, `data_fim`, `especie`  
**Código atual:** `especie`, `meses` (int 1-24) — converte meses para datas internamente

```python
# ATUAL (DIVERGE da doc)
@router.get("/padroes-fertilidade")
async def padroes_fertilidade(
    especie: Optional[EspecieAnimal] = None,
    meses:   int = Query(6, ge=1, le=24),  # ← doc não tem este param
    ...
):
```

**Parâmetros que faltam:** `fazenda_id`, `data_inicio` (YYYY-MM-DD), `data_fim` (YYYY-MM-DD)  
**Parâmetro extra não documentado:** `meses`

---

### 2.3 🔴 `GET /ia/padroes-fertilidade` — Response falta `por_protocolo` e `top_reprodutores`
**Arquivo:** `services/padroes_service.py`  
**Documentação (API RESTful p.29):**
```json
{
  "data": {
    "por_mes":       [...],
    "por_raca":      [...],
    "por_tecnico":   [...],
    "por_protocolo": [{ "protocolo": "P4+EB 7 dias", "inseminacoes": 20, "taxa": 0.75 }],
    "top_reprodutores": [{ "nome": "Touro Elite 7023", "inseminacoes": 18, "taxa_filhos": 0.78 }],
    "minimo_inseminacoes_atingido": true
  }
}
```
**Código atual retorna:** `por_mes`, `por_raca`, `por_tecnico`, `insights` (não documentado), `total_registros` (não documentado), `minimo_inseminacoes_atingido`.  
**Faltam:** `por_protocolo`, `top_reprodutores`. Campos extras não documentados: `insights`, `total_registros`.

---

### 2.4 🔴 `POST /inseminacoes` — Request body diverge da documentação
**Arquivo:** `schemas/inseminacao_schema.py` linhas 10-36  

| Campo | Documentação (p.20) | Código atual |
|-------|---------------------|--------------|
| Protocolo | `protocolo_descricao: "P4+EB 7 dias"` (string livre) | `protocolo_id: Optional[UUID]` (FK para tabela de protocolos) |
| Técnico | Inferido do JWT (não está no body) | `tecnico_id: UUID` **obrigatório** no body |
| Forçar registro | Não documentado | `forcar_registro: bool = False` (extra) |

O `model_validator` na linha 33-36 exige `protocolo_id` para IATF, mas a doc mostra que o usuário envia apenas a descrição em texto.

---

### 2.5 🔴 `POST /inseminacoes` — Response falta `alerta_criado` e `aviso_intervalo`
**Arquivo:** `routers/inseminacao_router.py` linhas 63-72  
**Documentação (API RESTful p.20):**
```json
{
  "data": {
    "id": "uuid-nova-ins",
    "animal_id": "uuid-animal",
    "resultado": "PENDENTE",
    "alerta_criado": { "id": "uuid-alerta", "data_disparo": "2026-07-03",
                       "mensagem": "Diagnóstico de gestação pendente para BOV-0012 (Mimosa)" },
    "aviso_intervalo": null
  }
}
```
**Código atual:** Retorna `InseminacaoResponse` com `warnings: []`. Campos `alerta_criado` e `aviso_intervalo` **ausentes**.

---

### 2.6 🔴 `POST /inseminacoes/{id}/diagnostico` — Response falta campos
**Arquivo:** `routers/inseminacao_router.py` linhas 85-93  
**Documentação (API RESTful p.22):**
```json
{
  "data": {
    "id": "uuid-dgs",
    "resultado": "PRENHA",
    "data_parto_prevista": "2026-10-22",
    "animal_status_atualizado": "PRENHA",
    "alerta_resolvido": true
  }
}
```
**Código atual:** Retorna o resultado cru do `service.registrar_diagnostico()` sem garantir `animal_status_atualizado` nem `alerta_resolvido` na resposta.

---

### 2.7 🔴 `services/predicao_service.py` — `ciclos_sem_concepcao` não incluído no vetor de features
**Arquivo:** `services/predicao_service.py` linhas 96-110  
**Problema:** A Matriz IA (p.8, Grupo C) define `ciclos_sem_concepcao` como feature do contexto histórico reprodutivo. A `InseminacaoModel` tem o campo `ciclos_sem_concepcao`. Porém o dict `features` montado no serviço **não inclui** `ciclos_sem_concepcao`.

O campo `ciclos_sem_concepcao` aparece na response de fatores determinantes na documentação (p.28, Matriz IA p.22):
```json
{ "feature": "ciclos_sem_concepcao", "impacto": -0.09, "sentido": "negativo", "valor_atual": 1 }
```

Mas `ia_rules.py` não processa essa feature — ela nunca aparecerá nos fatores quando o motor de regras for usado.

---

### 2.8 🔴 `core/ia_rules.py` — Feature nomeada diferente do microsserviço ML
**Arquivo:** `core/ia_rules.py` linha 85; `services/predicao_service.py` linha 106  
**Problema:** O motor de regras e o predicao_service usam a chave `dias_desde_ultima_inseminacao`, mas:
- A Matriz IA (p.11) chama a feature `dias_desde_ultima_ins`
- O modelo ML (README) usa `dias_desde_ultima_ins`

**Impacto:** Quando o ML retorna `top_5_fatores`, a feature virá como `dias_desde_ultima_ins`. Quando o motor de regras gera os fatores, a feature será `dias_desde_ultima_inseminacao`. O frontend receberá nomes diferentes dependendo do `motor_utilizado`, quebrando a renderização da UI.

---

## 3. Parâmetros e Paginação Divergentes

### 3.1 `GET /inseminacoes` — Faltam `sort` e `order`
**Arquivo:** `routers/inseminacao_router.py` linhas 34-59  
**Documentação (API RESTful p.19):**
- `sort`: `data_inseminacao | resultado` (default: `data_inseminacao`)
- `order`: `asc | desc` (default: **desc**)

**Código atual:** Sem parâmetros de ordenação. A query sempre retorna na ordem padrão do banco.

---

### 3.2 `GET /diario/{animal_id}/pesagens` — Paginação offset-based vs page-based
**Arquivo:** `routers/diario_router.py` linhas 40-49  
**Documentação (API RESTful p.23):**
- Params: `page` (default: 1), `limit` (default: 20)
- Response inclui `meta: { "page": 1, "limit": 20, "total": 8 }`

**Código atual:**
```python
limit:  int = Query(20, ge=1, le=100),
offset: int = Query(0, ge=0),          # ← deveria ser page
```
Response retorna `resumo` em vez de `meta` com paginação.

---

### 3.3 `GET /diario/{animal_id}/ocorrencias` — Nome e lógica do param divergem
**Arquivo:** `routers/diario_router.py` linhas 119-133  
**Documentação (API RESTful p.26):** `resolvida=true|false`  
**Código atual:** `apenas_nao_resolvidas: bool = Query(False)` — nome diferente e lógica **invertida**

| | Documentação | Código |
|--|--------------|--------|
| Param | `resolvida` | `apenas_nao_resolvidas` |
| `?resolvida=false` | retorna não resolvidas | `?apenas_nao_resolvidas=true` (inverted) |
| `?resolvida=true` | retorna resolvidas | sem equivalente |

---

### 3.4 `GET /relatorios/reprodutivo` — Sem paginação
**Arquivo:** `routers/relatorio_router.py` linhas 24-35  
**Documentação (API RESTful p.36):** Params `page` (default: 1), `limit` (default: 50); response inclui `meta`.  
**Código atual:** Retorna todos os registros sem paginação — pode retornar volumes ilimitados de dados.

---

### 3.5 `GET /alertas` — Paginação offset-based vs page-based
**Arquivo:** `routers/alerta_router.py` linhas 32-58  
**Documentação (API RESTful p.31):** `page` + `limit` (default: 1, 20)  
**Código atual:** `limit` + `offset` — sem parâmetro `page`.

---

### 3.6 `GET /dashboard/kpis` — Falta param `fazenda_id`
**Arquivo:** `routers/dashboard_router.py` linhas 16-22  
**Documentação (API RESTful p.33):** `fazenda_id` como query param (multi-tenancy leve).  
**Código atual:** Sem param `fazenda_id`; busca tudo do `usuario_id` sem filtro de fazenda.

---

## 4. Campos Faltando em Request/Response

### 4.1 `AnimalCreate` — `dados_geneticos` como objeto aninhado
**Arquivo:** `schemas/animal_schema.py` linhas 49-50  
**Documentação (API RESTful p.12):** O POST body inclui `dados_geneticos` como objeto aninhado que cria o registro em `tb_dados_geneticos` simultaneamente:
```json
{
  "dados_geneticos": {
    "raca_principal": "Nelore",
    "raca_pai": "Nelore",
    "raca_mae": "Angus",
    "dep_peso_desmame": 12.5,
    "dep_fertilidade": 8.2,
    "dep_acuracia": 0.72
  }
}
```
**Código atual:** `AnimalCreate` não tem o campo `dados_geneticos`. Os dados genéticos precisam ser criados separadamente (não há endpoint dedicado para isso).

---

### 4.2 `AnimalResponse` — Faltam `dados_geneticos`, `idade_meses` e `ultimo_evento`
**Arquivo:** `schemas/animal_schema.py` linhas 73-79  
**Documentação (API RESTful p.13, ANI-03):**
```json
{
  "id": "uuid", "codigo": "BOV-0012", "nome": "Mimosa",
  "idade_meses": 39,
  "dados_geneticos": {
    "raca_principal": "Nelore",
    "dep_peso_desmame": 12.5, "dep_fertilidade": 8.2,
    "dep_acuracia": 0.72, "coeficiente_endogamia": 0.0312
  },
  "ultimo_evento": { "tipo": "DIAGNOSTICO", "resultado": "PRENHA", "data": "2026-05-10" }
}
```
**Código atual:** `AnimalResponse` não inclui `dados_geneticos` (JOIN com `tb_dados_geneticos`), `idade_meses` (calculado), nem `ultimo_evento`.

---

### 4.3 `AnimalResponse` (listagem) — Falta `ultimo_evento`
**Arquivo:** `schemas/animal_schema.py` / `routers/animal_router.py`  
**Documentação (API RESTful p.11, ANI-01):** Cada item da lista inclui `"ultimo_evento": { "tipo": "INSEMINACAO", "data": "2026-04-12" }`.  
**Código atual:** O `AnimalResponse` da listagem não inclui `ultimo_evento`.

---

### 4.4 `PredicaoRequest` — Falta `tipo_inseminacao`
**Arquivo:** `schemas/predicao_schema.py` linhas 8-13  
**Matriz IA (p.9, Grupo E):** `tipo_inseminacao` é "input do usuário (IA_CONV | IATF | TE)".  
**Código atual:** `PredicaoRequest` não tem `tipo_inseminacao`. O serviço usa o tipo da **última** inseminação anterior — proxy incorreto para predição de uma inseminação futura/planejada.

---

### 4.5 `GET /inseminacoes` (lista) — Campos aninhados faltando
**Arquivo:** `schemas/inseminacao_schema.py`  
**Documentação (API RESTful p.19):** Cada item da lista retorna objetos aninhados:
```json
{
  "animal":    { "id": "...", "codigo": "BOV-0012", "nome": "Mimosa" },
  "reprodutor": { "id": "...", "nome": "Touro Elite 7023", "raca": "Nelore" },
  "tecnico":   { "id": "...", "nome": "Dr. Paulo Mendes" },
  "protocolo_descricao": "P4+EB 7 dias",
  "dias_decorridos": 32,
  "diagnostico": null
}
```
**Código atual:** `InseminacaoResponse` retorna apenas os IDs (`animal_id`, `reprodutor_id`, `tecnico_id`, `protocolo_id`) sem os objetos aninhados. Faltam `dias_decorridos` e `diagnostico`.

---

### 4.6 `GET /inseminacoes/pendentes-diagnostico` — Campos faltando na response
**Arquivo:** `routers/inseminacao_router.py` linhas 23-30  
**Documentação (API RESTful p.21):**
```json
{
  "data": [{
    "id": "uuid-ins",
    "animal": { "codigo": "BOV-0012", "nome": "Mimosa" },
    "data_inseminacao": "...", "dias_decorridos": 54,
    "urgencia": "CRITICA",
    "data_esperada_diagnostico": "2026-05-12"
  }],
  "meta": { "total": 7, "criticos": 2, "atencao": 5 }
}
```
**Código atual:** Retorna os dados crus sem `urgencia`, `data_esperada_diagnostico` nem o `meta` com contagens de urgência.

---

### 4.7 `GET /diario/{animal_id}/sanitario` — Falta `alertas_proxima_dose`
**Arquivo:** `routers/diario_router.py` linhas 92-101  
**Documentação (API RESTful p.25):** Response inclui campo raiz `"alertas_proxima_dose": 1` (contagem de alertas de próxima dose criados).  
**Código atual:** Retorna só `{ "success": true, "data": [...] }` sem `alertas_proxima_dose`.

---

### 4.8 `GET /alertas` — Falta campo `animal` aninhado em cada alerta
**Arquivo:** `routers/alerta_router.py` linhas 32-58  
**Documentação (API RESTful p.31):**
```json
{ "id": "uuid-alerta", "tipo": "DIAGNOSTICO_PENDENTE",
  "animal": { "id": "...", "codigo": "BOV-0012", "nome": "Mimosa" },
  ... }
```
**Código atual:** Precisaria verificar `schemas/alerta_schema.py`, mas o router não faz JOIN com animal para enriquecer a resposta.

---

### 4.9 `GET /fazendas` — Falta `total_animais` e `POST` falta `capacidade_rebanho`
**Arquivo:** `schemas/fazenda_schema.py`  
**Documentação (API RESTful p.9):**
- GET response inclui `"total_animais": 142`
- POST request aceita `"capacidade_rebanho": 60`

Precisaria verificar se `FazendaResponse` e `FazendaCreate` têm esses campos.

---

### 4.10 `PATCH /alertas/{id}/resolver` — Sem body request
**Arquivo:** `routers/alerta_router.py` linhas 90-98  
**Documentação (API RESTful p.32):**
```json
Request body: { "resolvido": true }
Response: { "success": true, "data": { "id": "uuid", "resolvido": true, "lido": true } }
```
**Código atual:** `marcar_resolvido(alerta_id)` não recebe body — apenas resolve diretamente. Não retorna `lido: true` garantido.

---

## 5. Bugs de Lógica / Runtime

### 5.1 `predicao_service.py` — Dupla consulta desnecessária (performance)
**Arquivo:** `services/predicao_service.py` linhas 65-70  
```python
ultima_ins, _ = await self.ins_repo.list_all(animal_id=animal.animal_id, limit=1)   # linha 65
todas_ins, total_ins = await self.ins_repo.list_all(animal_id=animal.animal_id, limit=500)  # linha 68
```
Duas queries separadas quando poderiam ser uma. Com rebanhos grandes (>500 inseminações), a segunda query trunca em 500 registros — `historico_taxa_prenhez` ficará incorreto.

---

### 5.2 `ia_rules.py` — Fórmula contradiz o README
**Arquivos:** `core/ia_rules.py` linha 127 vs `docs/IA-README.md`

**README** descreve: `score = sigmoid(Σ deltas / 40 + logit(prob_base_espécie))`  
**Matriz IA** (documento normativo) descreve: `Score = Probabilidade Base + Σ Deltas`  
**Código implementado:** `score = max(0.0, min(1.0, base + total_delta))` — segue a **Matriz IA** ✓

O README está **desatualizado/errado** em relação à fórmula. O código está correto segundo a Matriz IA, mas gera confusão ao ler a documentação.

---

### 5.3 `ia_rules.py` — Deltas em fração vs Matriz IA em pontos percentuais
**Arquivo:** `core/ia_rules.py`  
**Matriz IA (p.12):** Deltas definidos em "pontos percentuais" (ex: CC ideal = +10 pontos sobre base de 60%).  
**Código:** Deltas em frações decimais (CC ideal = `+0.10`).

Matematicamente equivalente (0.10 = 10pp quando base=0.60), mas a tabela de parametrização externa (`tb_regras_scoring`) mencionada na Matriz IA deveria armazenar em qual unidade? Se armazenada em pontos e lida como fração, os deltas seriam 100x errados.

---

### 5.4 `ia_rules.py` — Parametrização hardcoded (viola Matriz IA)
**Arquivo:** `core/ia_rules.py`  
**Matriz IA (p.12-13):** "Os deltas são parametrizados em uma tabela de configuração (`tb_regras_scoring`) no banco PostgreSQL, permitindo ajuste fino sem deploy de código."  
**Código atual:** Todos os deltas são constantes hardcoded em Python. A tabela `tb_regras_scoring` **não existe** no schema atual.

---

## 6. Nomenclatura Divergente

### 6.1 `InseminacaoResponse` — Chave `id` vs `inseminacao_id`
**Arquivo:** `schemas/inseminacao_schema.py` linha 45  
```python
id: UUID = Field(..., validation_alias="inseminacao_id")
```
Com `populate_by_name=True` e sem `by_alias=True`, o JSON de resposta serializa como `"id"`. A documentação p.19 mostra `"id": "uuid-ins"`. ✓ Consistente — mas o `validation_alias` sugere que o campo interno é `inseminacao_id`, o que pode causar confusão em alguns contextos de serialização.

---

### 6.2 Feature `dias_desde_ultima_ins` vs `dias_desde_ultima_inseminacao`
**Arquivos:** `core/ia_rules.py` linha 85, `services/predicao_service.py` linha 106  
**Problema:** A mesma feature tem nomes diferentes dependendo da fonte:
- `InseminacaoModel.dias_desde_ultima_ins` (BD)
- `predicao_service.py` e `ia_rules.py`: `dias_desde_ultima_inseminacao`
- Matriz IA e README: `dias_desde_ultima_ins`
- ML microsserviço (modelo treinado): `dias_desde_ultima_ins`

**Impacto:** Quando ML retorna `top_5_fatores`, o nome da feature será `dias_desde_ultima_ins`. Quando o fallback de regras gera os fatores, será `dias_desde_ultima_inseminacao`. O frontend vê nomes diferentes dependendo do motor.

---

### 6.3 Alertas — Comentário interno equivocado
**Arquivo:** `routers/alerta_router.py` linha 60  
```python
# ALE-02b — alias /contagem para compatibilidade com o frontend (antes de /{alerta_id})
```
Mas `ALE-02` na doc é `PATCH /alertas/{id}/lido`. `GET /alertas/contagem` é `ALE-04`. Os comentários no router não correspondem aos IDs da documentação.

---

### 6.4 `GET /diario/{animal_id}/sanitario` — `OUTRO` no enum não documentado
**Arquivo:** `models/enums.py`  
**Documentação (API RESTful p.25):** tipo = `VACINA | VERMIFUGACAO | MEDICACAO | EXAME`  
**Código:** `TipoSanitario` tem `OUTRO` como 5º valor — não documentado.

---

## 7. Endpoints Extras (Não Documentados)

Existem no código mas não estão no índice consolidado de endpoints da documentação.

| Endpoint | Arquivo | Observação |
|----------|---------|------------|
| `GET /ia/predicoes/{animal_id}` | `routers/ia_router.py` | Histórico de predições por animal. Útil, mas ausente na doc. |
| `GET /animais/counts` | `routers/animal_router.py` | Contagem por espécie/status. Não listado como endpoint próprio — só aparece como parte do dashboard. |
| `GET /alertas/badge` | `routers/alerta_router.py` | Duplica `/alertas/contagem`. Doc lista apenas `/contagem` (ALE-04). |

---

## 8. Inconsistências Entre os Três Documentos

| Ponto | API RESTful PDF | Matriz IA PDF | README |
|-------|-----------------|---------------|--------|
| Fórmula do Motor de Regras | Não detalha | `Score = Base + Σ Deltas` (aditivo, truncado) | `sigmoid(Σdeltas/40 + logit(base))` — **ERRADO** |
| Endpoint predicao | `POST /ia/predicao-prenhez` | `POST /api/v1/ia/predicao-prenhez` | `POST /predicao` (microsserviço Python) |
| Features do modelo | 14 features listadas (p.28) | 14 features com grupos A-E | 14 features na tabela — nomes ligeiramente diferentes |
| `ciclos_sem_concepcao` | Aparece em fatores da response (p.28) | Feature do Grupo C (p.8) | Feature extra apenas para motor de regras |
| `dias_desde_ultima_ins` | `dias_desde_ultima_ins` (p.28 fatores) | `dias_desde_ultima_ins` (p.11) | `dias_desde_ultima_ins` (tabela de features) |

---

## 9. Referência Cruzada: ID da Doc → Arquivo de Código

| ID Doc | Endpoint | Status | Arquivo |
|--------|----------|--------|---------|
| AUTH-01 a 05 | `/auth/*` | ✅ Implementado | `routers/auth_router.py` |
| USR-01 a 03 | `/usuarios/me` | ✅ Implementado | `routers/user_me_router.py` |
| FAZ-01 a 04 | `/fazendas` | ⚠️ Falta `total_animais` e `capacidade_rebanho` | `routers/fazenda_router.py` |
| ANI-01 a 08 | `/animais` | ⚠️ Falta `dados_geneticos`, `ultimo_evento`, `idade_meses` | `routers/animal_router.py` |
| REP-01 a 04 | `/reprodutores` | ✅ Implementado | `routers/reprodutor_router.py` |
| INS-01 | `GET /inseminacoes` | ⚠️ Falta `sort`, `order`, campos aninhados | `routers/inseminacao_router.py` |
| INS-02 | `POST /inseminacoes` | 🔴 `protocolo_descricao` vs `protocolo_id`; falta `alerta_criado` | `routers/inseminacao_router.py` |
| INS-03 | `GET /inseminacoes/pendentes-diagnostico` | ⚠️ Falta `urgencia`, `meta` | `routers/inseminacao_router.py` |
| INS-04 | `POST /inseminacoes/{id}/diagnostico` | ⚠️ Falta `animal_status_atualizado` | `routers/inseminacao_router.py` |
| INS-05 | `GET /inseminacoes/{id}` | ✅ Implementado | `routers/inseminacao_router.py` |
| INS-06 | `PATCH /inseminacoes/{id}` | ❌ Ausente | — |
| INS-07 | `GET /inseminacoes/{id}/diagnostico` | ❌ Ausente | — |
| INS-08 | `DELETE /inseminacoes/{id}` | ❌ Ausente | — |
| DIA-01 | `GET /diario/{id}/pesagens` | ⚠️ Paginação offset vs page | `routers/diario_router.py` |
| DIA-02 | `POST /diario/{id}/pesagens` | ✅ Implementado | `routers/diario_router.py` |
| DIA-03 | `GET /diario/{id}/partos` | ⚠️ Paginação offset vs page | `routers/diario_router.py` |
| DIA-04 | `POST /diario/{id}/partos` | ✅ Implementado | `routers/diario_router.py` |
| DIA-05 | `GET /diario/{id}/sanitario` | ⚠️ Falta `alertas_proxima_dose` | `routers/diario_router.py` |
| DIA-06 | `POST /diario/{id}/sanitario` | ✅ Implementado | `routers/diario_router.py` |
| DIA-07 | `GET /diario/{id}/ocorrencias` | ⚠️ Param `resolvida` vs `apenas_nao_resolvidas` | `routers/diario_router.py` |
| DIA-08 | `POST /diario/{id}/ocorrencias` | ✅ Implementado | `routers/diario_router.py` |
| DIA-09 | `GET /diario/{id}/exportar-pdf` | ❌ Ausente | — |
| DIA-10 | `PATCH /diario/{id}/pesagens/{id}` | ❌ Ausente | — |
| IA-01 | `POST /ia/predicao-prenhez` | 🔴 Sem envelope; falta `tipo_inseminacao` no request | `routers/ia_router.py` |
| IA-02 | `GET /ia/padroes-fertilidade` | 🔴 Params e response divergem | `routers/ia_router.py` |
| IA-03 | `POST /ia/selecao-genetica` | ❌ Ausente | — |
| IA-04 | `GET /ia/modelo-info` | ❌ Ausente | — |
| ALE-01 | `GET /alertas` | ⚠️ Paginação offset vs page; falta campo `animal` | `routers/alerta_router.py` |
| ALE-02 | `PATCH /alertas/{id}/lido` | ✅ Implementado | `routers/alerta_router.py` |
| ALE-03 | `PATCH /alertas/{id}/resolver` | ⚠️ Sem body; sem `lido: true` na resposta | `routers/alerta_router.py` |
| ALE-04 | `GET /alertas/contagem` | ✅ Implementado (+ extra `/badge`) | `routers/alerta_router.py` |
| DSH-01 | `GET /dashboard/kpis` | ⚠️ Falta `fazenda_id` param | `routers/dashboard_router.py` |
| DSH-02 | `GET /dashboard/grafico-reprodutivo` | ✅ Implementado | `routers/dashboard_router.py` |
| DSH-03 | `GET /dashboard/timeline` | ✅ Implementado | `routers/dashboard_router.py` |
| REL-01 | `GET /relatorios/reprodutivo` | ⚠️ Sem paginação | `routers/relatorio_router.py` |
| REL-02 | `GET /relatorios/ponderal` | ❌ Ausente | — |
| REL-03 | `GET /relatorios/sanitario` | ✅ Implementado | `routers/relatorio_router.py` |
| REL-04 | `GET /relatorios/reprodutivo/exportar` | ✅ Implementado | `routers/relatorio_router.py` |
| REL-05 | `GET /relatorios/ponderal/exportar` | ❌ Ausente | — |
| REL-06 | `GET /relatorios/sanitario/exportar` | ✅ Implementado (só CSV) | `routers/relatorio_router.py` |

**Legenda:** ✅ OK · ⚠️ Parcial · 🔴 Bug crítico · ❌ Ausente

---

## 10. Compatibilidade timestamp / timestamptz (Supabase / asyncpg)

**Verificação realizada em 2026-06-08** a pedido — investigação do erro recorrente de
"incompatibilidade timestamp e timestamptz" no Supabase.

### Causa-raiz encontrada (🔴 corrigida)
O schema fonte da verdade (`endpoint/agroGen_schema.sql`) declara **todas** as colunas
de data/hora como `TIMESTAMP` (= `TIMESTAMP WITHOUT TIME ZONE`, naive). Porém **5 colunas
em 2 models** divergiam, declarando `DateTime(timezone=True)` (= `TIMESTAMPTZ`):

| Arquivo | Coluna | Era | Schema SQL | Corrigido |
|---------|--------|-----|-----------|-----------|
| `models/user_model.py` | `bloqueado_ate` | `DateTime(timezone=True)` | `TIMESTAMP` | ✅ `DateTime` |
| `models/user_model.py` | `ultimo_acesso` | `DateTime(timezone=True)` | `TIMESTAMP` | ✅ `DateTime` |
| `models/user_model.py` | `created_at` | `DateTime(timezone=True)` | `TIMESTAMP` | ✅ `DateTime` |
| `models/user_model.py` | `updated_at` | `DateTime(timezone=True)` | `TIMESTAMP` | ✅ `DateTime` |
| `models/animal_model.py` | `updated_at` | `DateTime(timezone=True)` | `TIMESTAMP` | ✅ `DateTime` (já era inconsistente com `created_at` do mesmo model) |

**Por que causava erro:** o `auth_service.login()` gravava `datetime.now(timezone.utc)`
(**aware**) em `bloqueado_ate`/`ultimo_acesso`. Como a coluna real no Supabase é
`TIMESTAMP WITHOUT TIME ZONE`, o **asyncpg rejeita datetime aware** nessas colunas
(`can't use offset-aware datetime with timestamp without time zone column`).

### Correções aplicadas
1. Models alinhados ao schema (5 colunas → `DateTime` naive).
2. `auth_service.login()`: `now = datetime.now(timezone.utc).replace(tzinfo=None)`
   (naive UTC) e comparação `bloqueado_ate > now` sem `.replace(tzinfo=...)`.
3. `inseminacao_service.create()`: normaliza `data_inseminacao` para naive UTC antes do
   insert (`.astimezone(utc).replace(tzinfo=None)`), pois a coluna é `TIMESTAMP`.
4. Removida variável morta `now` (aware) no `inseminacao_service`.

### Pontos verificados e OK (sem ação)
- `dashboard_repository.kpis/grafico`: já usa `now_naive` nas queries; `now.isoformat()`
  é apenas string de saída.
- `auth_repository`: `usado_em` já gravado com `.replace(tzinfo=None)`.
- `refresh_token`/`password_reset`: colunas `DateTime` naive; persistência DB ainda
  desabilitada (`_REFRESH_DB_ENABLED`).
- Queries novas desta auditoria (`list_pendentes_diagnostico`, `padroes`, `ponderal`,
  `_buscar_ultimo_evento`): usam naive ou `Date`, sem mistura aware/naive.

### Migrations Alembic — ✅ corretas
- Apenas 2 migrations: `0001_create_tb_refresh_tokens` e `0002_create_predicao_log`.
- Ambas usam `sa.DateTime` (naive), consistente com o schema e com os models.
- Demais tabelas vêm do `agroGen_schema.sql` (não geridas pelo Alembic), todas `TIMESTAMP`.
- **Recomendação:** ao habilitar o refresh token no banco, gravar `expires_at` como
  naive UTC (`.replace(tzinfo=None)`) para manter a consistência.

---

*Auditoria gerada em 2026-06-07; seção 10 (timestamps) e status de resolução adicionados em 2026-06-08.*
