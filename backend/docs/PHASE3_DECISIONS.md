# PHASE3_DECISIONS.md — Domínio Reprodutivo, Diário de Bordo e Alertas

## O que foi implementado

| Domínio | Endpoints | Regras de negócio principais |
|---|---|---|
| Inseminações | INS-01 a INS-04 | Status PRENHA/DESCARTADA bloqueado, intervalo mínimo por espécie, forcar_registro, alerta DIAGNOSTICO_PENDENTE automático |
| Diagnósticos via INS | INS-04b | Data > inseminação, unicidade, data_parto_prevista calculada automaticamente, atualiza animal.status, resolve alerta pendente |
| Pesagens | DIA-01/02 | GMD calculado no service antes de persistir |
| Partos | DIA-03/04 | IEP calculado, num_partos+1, óbito_matriz soft-delete animal |
| Sanitário | DIA-05/06 | Alerta PROXIMA_DOSE N-7 dias automático |
| Ocorrências | DIA-07/08/PATCH | Alerta OCORRENCIA_CRITICA imediato se gravidade=CRITICA |
| Alertas | ALE-01 a ALE-05 | Badge leve (count), PATCH lido/resolvido |

---

## Decisões de design

### Padrão de rotas: `/diario/{animal_id}/...`
Seguindo a spec (DIA-01 a DIA-08). Um único `diario_router.py` agrupa pesagens, partos, sanitário e ocorrências aninhados sob o animal. Coerente com o conceito de "Diário de Bordo por animal".

### `forcar_registro: bool` para intervalo curto
Se `dias_desde_ultima_ins < ciclo[especie]` e `forcar_registro=False` → 422 com detalhe de quantos dias faltam. Se `forcar_registro=True` → prossegue com warning na response. Ciclos: bovino/caprino 21d, ovino 17d.

### GMD calculado no service, não em trigger SQL
O trigger `fn_validar_pesagem()` no SQL já calcula GMD no banco. O service Python também calcula antes de persistir para que o valor esteja disponível na response imediata (sem necessidade de re-fetch). Se os dois divergirem por algum motivo, o valor do banco prevalece na próxima leitura.

### IEP não armazenado
O IEP (Intervalo Entre Partos) não é salvo no banco — é calculado dinamicamente em `PartoService.list_by_animal` para cada par de partos consecutivos. Mantém as tabelas limpas e evita dessincronia.

### Alertas gerados dentro da transação do evento
Alertas são criados de forma síncrona dentro do mesmo request que dispara o evento (inseminação, sanitário, ocorrência). Isso simplifica o código e garante consistência (se o commit falhar, o alerta também não é criado). Para volumes muito altos, poderia ser migrado para fila assíncrona — documentado como débito técnico.

### `DiagnosticoModel` sem ForeignKey no ORM
`inseminacao_id`, `animal_id` e `veterinario_id` em `diagnostico_model.py` não têm `ForeignKey` declarado — apenas constraints no banco SQL. O sistema funciona porque o PostgreSQL enforça as restrições. Corrigir o model requer adicionar as FKs e testar a Alembic autogenerate — agendado para quando houver cobertura de testes.

### Badge (`GET /alertas/badge`)
Endpoint declarado antes de `/{alerta_id}` para evitar captura da string "badge" como UUID. Retorna apenas 3 inteiros — intencionalmente leve para polling frequente do frontend.

---

## Regras zootécnicas implementadas

| Regra | Valor | Fonte |
|---|---|---|
| Gestação bovino | 283 dias | AgroGen-Especificacao-Tecnica.pdf |
| Gestação ovino/caprino | 150 dias | AgroGen-Especificacao-Tecnica.pdf |
| Ciclo bovino/caprino | 21 dias | AgroGen-Especificacao-Tecnica.pdf |
| Ciclo ovino | 17 dias | AgroGen-Especificacao-Tecnica.pdf |
| Pós-parto mínimo bovino | 45 dias (aviso) | AgroGen-Especificacao-Tecnica.pdf |
| Pós-parto mínimo ovino/caprino | 30 dias (aviso) | AgroGen-Especificacao-Tecnica.pdf |
| Alerta diagnóstico | data_inseminacao + 30d | AgroGen-IA-API-RESTful.pdf |
| Alerta próxima dose | proxima_dose − 7d | AgroGen-IA-Entidades.pdf ENT-11 |
| GMD | (peso_atual − peso_anterior) / dias | AgroGen-Especificacao-Tecnica.pdf |

---

## O que fica fora da Fase 3

| Item | Justificativa |
|---|---|
| Testes automatizados | Requer banco de teste + fixtures — Fase 4 |
| RBAC por endpoint | `get_current_user` disponível; wiring de perfis é Fase 4 |
| Análise IA integrada ao fluxo reprodutivo | Requer modelo ML treinado — `analises_ia` endpoint já existe |
| Relatórios agregados (taxa de prenhez, GMD médio por lote) | Fase 4 |
| Exportação de dados LGPD completa (inclui eventos diário) | USR-03 atual é MVP; Fase 4 complementa |
| Alertas assíncronos via fila (ex: Redis + Celery) | Atual é síncrono-inline; suficiente para MVP |
| `ForeignKey` no `DiagnosticoModel` | Débito técnico — requer testes Alembic |
