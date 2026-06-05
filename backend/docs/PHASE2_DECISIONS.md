# PHASE2_DECISIONS.md — Expansão dos CRUDs (Fazendas, Animais e Reprodutores)

## Correções da Fase 1

| Item | Problema | Solução |
|---|---|---|
| `animal_repository.update` | HTTP 420 METHOD_FAILURE (não-padrão) | Substituído por 422 UNPROCESSABLE_ENTITY |
| `FazendaBase.usuario_id` | Campo no body tornava auth irrelevante | Removido do schema; router injeta via `current_user` (JWT) |
| `FazendaRepository.create` | Não aceitava `usuario_id` externo | Assinatura alterada para `create(schema, usuario_id)` |

---

## Fazendas

### Guards no soft_delete
Dois novos helpers em `FazendaRepository`:
- `count_animais_ativos(fazenda_id)` — COUNT com `ativo=True` na tabela `animais`
- `count_fazendas_ativas(usuario_id)` — COUNT com `ativo=True` na tabela `fazendas`

`FazendaService.soft_delete` agora verifica (nessa ordem):
1. Fazenda possui animais ativos → 409
2. É a única fazenda ativa do usuário → 409

### JWT como fonte de usuario_id
`POST /api/v1/fazendas` e `GET /api/v1/fazendas` não aceitam mais `usuario_id` como body/query. O valor é lido do token autenticado (`current_user.usuario_id`). `FazendaResponse` mantém `usuario_id` para exibição.

---

## Animais

### Código automático (ANI-02)
`AnimalCreate.codigo` passou a ser `Optional`. Se ausente, `AnimalService.create` chama `AnimalRepository.next_codigo(fazenda_id, especie)`, que faz:
```
COUNT de todos os animais da fazenda com aquela espécie (incluindo inativos)
→ prefixo[especie] + (count+1) zero-padded 4 dígitos
```
Exemplo: 3 bovinos existentes → próximo código = `BOV-0004`.

### Filtros avançados e paginação (ANI-01)
`list_all` agora aceita `q` (ILIKE em `nome` e `codigo`), `sexo`, `status_animal`, `raca` (ILIKE), `sort`, `order`. Retorna `tuple[list, int]` com COUNT total para o `PaginatedEnvelope`.

### Máquina de estados
Implementada como `VALID_TRANSITIONS: dict[StatusAnimal, set[StatusAnimal]]` em `services/animal_service.py`. Validada no `update` antes de qualquer persistência. `DESCARTADA` é terminal — nenhuma transição permitida.

```
ATIVA            → PRENHA, EM_REPOUSO, REPRODUTOR_ATIVO, EM_MONITORAMENTO, DESCARTADA
PRENHA           → ATIVA, EM_REPOUSO, DESCARTADA
EM_REPOUSO       → ATIVA, EM_MONITORAMENTO, DESCARTADA
REPRODUTOR_ATIVO → ATIVA, EM_MONITORAMENTO, DESCARTADA
EM_MONITORAMENTO → ATIVA, EM_REPOUSO, DESCARTADA
DESCARTADA       → (terminal)
```

### Importação CSV (ANI-08)
Processamento **síncrono linha a linha** — decisão deliberada para partial success: linhas válidas são persistidas mesmo que outras falhem. Alternativa all-or-nothing (transação única) rejeitada porque o usuário prefere importar o que for possível e corrigir o resto.

### ANI-07 e ANI-06
- `/animals/racas` declarado **antes** de `/{animal_id}` no router para evitar captura indevida pela rota de parâmetro.
- `/animals/{id}/historico` instancia repositórios de `inseminacao`, `pesagem` e `parto` diretamente no endpoint (sem passar pelo service) por ser query de leitura cross-domínio sem regra de negócio.

---

## Reprodutores

### `updated_at` adicionado ao model
`ReproductorModel` estava sem `updated_at`. Adicionado com `server_default + onupdate=func.now()`.

### Soft delete (substituição do hard delete)
`ReproductorRepository` herda `delete` do `BaseRepository` que faz hard delete. Adicionado `soft_delete(reprodutor_id)` que seta `ativo=False`. O `delete` herdado não é exposto via router.

### Validações de tipo no schema
`@model_validator` em `ReproductorBase` garante:
- `ANIMAL_PROPRIO` → `animal_id` obrigatório
- `SEMEN_EXTERNO` → `animal_id` deve ser `None`

Validação adicional no service (`create`):
- Animal vinculado deve ser `MACHO`
- Espécie do reprodutor deve bater com a espécie do animal
- Idempotência: se animal já tem reprodutor ativo → 409

---

## PDFs referenciados mas ausentes

`AgroGen-IA-Adendo-UX.pdf` e `AgroGen-IA-Adendo-Reprodutores.pdf` não existem em `docs/`. Conteúdo extraído de `AgroGen-IA-API-RESTful.pdf` e `AgroGen-IA-Entidades.pdf`.

---

## O que fica fora da Fase 2

| Item | Justificativa |
|---|---|
| `DadosGeneticos` criado junto com `Animal` | Fase 3 — requer transação composta |
| Histórico detalhado com paginação por tipo | Fase 3 — ANI-06 retorna estrutura básica |
| Relatórios agregados (taxa de prenhez, GMD) | Fase 3 |
| Testes automatizados | Fase 3 — requer banco de teste e fixtures |
| `total_animais` no response de Fazenda | Não especificado no doc principal; evitado para não adicionar N+1 sem necessidade |
| Auth nos endpoints de Animal/Reprodutor | Fase 3 — `get_current_user` disponível, falta wiring e RBAC |
