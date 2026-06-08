# Inconsistências Frontend × Documentação API RESTful v1.0

**Gerado em:** 2026-06-06 | **Corrigido em:** 2026-06-07  
**Fontes:** `AgroGen-IA-API-RESTful.pdf` (46 págs.) × código-fonte `src/`  
**Auditado:** sim — 3 falsos positivos removidos, 31 problemas confirmados  
**Status:** ✅ 31 corrigidos | ⚠️ 1 pendente de backend (ver E-10) | 🆕 1 nova inconsistência encontrada durante implementação

---

## 🆕 Nova inconsistência encontrada durante implementação

### [N-1] `inseminacoesApi.registrarDiagnostico.body.metodo` — tipado como `string`

**Arquivo:** `src/lib/api/endpoints/inseminacoes.ts`

O campo `metodo` no body de `registrarDiagnostico` estava tipado como `string` genérico, mas o tipo `MetodoDiagnostico` já existe em `src/types/index.ts` com os valores válidos: `"PALPACAO_RETAL" | "ULTRASSONOGRAFIA" | "EXAME_LABORATORIAL"`.

**✅ Corrigido:** Atualizado para `metodo: MetodoDiagnostico`.

---

## ⚠️ Pendente de backend

### [E-10] `/animais/counts` — endpoint não documentado

Este endpoint não existe na documentação oficial da API. Com `VITE_USE_REAL_API=true` retornará 404.

**Decisão:** No frontend, as contagens por espécie nos chips da listagem foram migradas para usar os dados de `GET /dashboard/kpis` (`total_animais.por_especie`). Os chips de status (ativa, prenha, etc.) foram exibidos sem badge de contagem.

**Ação necessária no backend:** Adicionar endpoint `GET /animais/counts` ou garantir que `GET /dashboard/kpis` retorne os dados necessários.

---

## Legenda de severidade

| Símbolo | Significado |
|---------|-------------|
| 🔴 CRÍTICO | Vai quebrar em runtime com `VITE_USE_REAL_API=true` |
| 🟠 ALTO | Funcionalidade documentada ausente ou endpoint enviado errado |
| 🟡 MÉDIO | Tipo incompleto ou dado ignorado, sem crash imediato |
| 🔵 PRÁTICA | Duplicação de lógica, dead code, invalidação de cache incompleta |

---

## 1. Types (`src/types/index.ts`)

### 🔴 [T-1] `GraficoPonto` — estrutura de array vs objeto (doc p.33)

**Problema:** A API retorna um único objeto com arrays paralelos. O frontend tipa como array de objetos.

**Doc resposta real:**
```json
{
  "data": {
    "labels": ["Jan/26","Fev/26","Mar/26"],
    "inseminacoes": [14, 18, 12],
    "taxa_prenhez": [0.57, 0.72, 0.58],
    "periodo": { "inicio": "2026-01-01", "fim": "2026-06-05" }
  }
}
```

**Código atual (`src/types/index.ts:264`):**
```typescript
export interface GraficoPonto {
  mes: string;
  inseminacoes: number;
  taxa_prenhez: number;
}
```

**Correção — substituir:**
```typescript
export interface GraficoReprodutivoData {
  labels: string[];
  inseminacoes: number[];
  taxa_prenhez: number[];
  periodo: { inicio: string; fim: string };
}
```

**Arquivos afetados além do types:**
- `src/lib/api/endpoints/dashboard.ts:14` — trocar `ApiResponse<GraficoPonto[]>` por `ApiResponse<GraficoReprodutivoData>`
- `src/pages/dashboard/Dashboard.tsx:110` — `const points = data?.data ?? []` vai receber objeto; adaptar para montar array de pontos: `const points = data?.data ? data.data.labels.map((l, i) => ({ mes: l, inseminacoes: data.data.inseminacoes[i], taxa_prenhez: (data.data.taxa_prenhez[i] ?? 0) * 100 })) : []`
- `src/lib/api/mocks/dashboard.ts:19` — mock retorna `GraficoPonto[]`; adaptar para o novo formato

---

### 🔴 [T-2] `DashboardKPI.inseminacoes_mes.sentido` — enum incompatível (doc p.33)

**Código atual (`src/types/index.ts:258`):**
```typescript
inseminacoes_mes: { total: number; delta_pct: number; sentido: "up" | "down" };
```

**Doc retorna:** `"sentido": "positivo"` ou `"negativo"` (lowercase pt-BR)

**Correção:**
```typescript
inseminacoes_mes: { total: number; delta_pct: number; sentido: "positivo" | "negativo" };
```

**Arquivo afetado:** `src/pages/dashboard/Dashboard.tsx:48-49` — atualizar comparação:
```typescript
// antes
trend.sentido === "up" ? "text-ok" : "text-danger"
trend.sentido === "up" ? <TrendingUp> : <TrendingDown>

// depois
trend.sentido === "positivo" ? "text-ok" : "text-danger"
trend.sentido === "positivo" ? <TrendingUp> : <TrendingDown>
```

**Mock afetado:** `src/lib/api/mocks/dashboard.ts:8` — trocar `sentido: "up"` por `sentido: "positivo"`

---

### 🔴 [T-3] `PadroesFertilidade.top_reprodutores` — nomes de campos errados (doc p.29)

**Doc retorna:** `{ "nome": "Touro Elite 7023", "inseminacoes": 18, "taxa_filhos": 0.78 }`

**Código atual (`src/types/index.ts:306`):**
```typescript
top_reprodutores?: { reprodutor: string; inseminacoes: number; taxa_prenhez: number }[];
```

**Correção:**
```typescript
top_reprodutores?: { nome: string; inseminacoes: number; taxa_filhos: number }[];
```

**Arquivos afetados:**
- `src/pages/ia/AnaliseIA.tsx:544` — `r.reprodutor` → `r.nome`
- `src/pages/ia/AnaliseIA.tsx:552` — `r.taxa_prenhez` → `r.taxa_filhos`; ajustar threshold de cor (valor 0-1 não percentual): `r.taxa_filhos >= 0.75` etc.
- `src/lib/api/mocks/ia.ts:48-53` — trocar campos `reprodutor` → `nome` e `taxa_prenhez` → `taxa_filhos` (converter de percentual para decimal: `75` → `0.75`)

---

### 🔴 [T-4] `TimelineItem` — estrutura flat vs nested (doc p.34)

**Doc retorna:**
```json
{
  "tipo": "INSEMINACAO",
  "animal_codigo": "BOV-0012",
  "animal_nome": "Mimosa",
  "animal_id": "uuid",
  "descricao": "Inseminação IATF registrada",
  "usuario_nome": "Dr. Paulo Mendes",
  "data": "2026-06-05T09:30:00Z",
  "data_relativa": "há 2 horas"
}
```

**Código atual (`src/types/index.ts:270`):**
```typescript
export interface TimelineItem {
  id: string;
  tipo: TipoEvento | "ALERTA";
  animal: Pick<Animal, "id" | "codigo" | "nome">;
  usuario?: string;
  descricao: string;
  data: string;
}
```

**Correção:**
```typescript
export interface TimelineItem {
  tipo: TipoEvento | "ALERTA";
  animal_id: string;
  animal_codigo: string;
  animal_nome: string;
  descricao: string;
  usuario_nome?: string;
  data: string;
  data_relativa?: string;
}
```

**Arquivo afetado:** `src/pages/dashboard/Dashboard.tsx`
- linha 187: `item.animal?.id` → `item.animal_id`
- linha 195: `item.animal.codigo` → `item.animal_codigo`

**Mock afetado:** `src/lib/api/mocks/dashboard.ts:28-37` — reescrever com campos flat

---

### 🟡 [T-5] `DashboardKPI.taxa_prenhez.badge` — enum diferente (doc p.33)

**Doc retorna:** `"badge": "POSITIVO"` (POSITIVO/NEGATIVO)

**Código atual (`src/types/index.ts:259`):**
```typescript
taxa_prenhez: { valor: number; percentual: number; badge: "ok" | "warn" | "danger"; periodo: string };
```

**Nota:** `Dashboard.tsx:62-63` recalcula o badge localmente (não usa o campo da API), então não quebra em runtime. Mas o tipo está errado e pode confundir.

**Correção:**
```typescript
taxa_prenhez: { valor: number; percentual: number; badge: "POSITIVO" | "NEGATIVO"; periodo: string };
```

---

### 🟡 [T-6] `PadroesFertilidade.por_mes.prenhes` — typo no nome do campo (doc p.29)

**Doc retorna:** `"prenhes": 8` (plural)

**Código atual (`src/types/index.ts:302`):**
```typescript
por_mes: { mes: string; inseminacoes: number; prenhez: number; taxa: number }[];
```

**Correção:**
```typescript
por_mes: { mes: string; inseminacoes: number; prenhes: number; taxa: number }[];
```

**Mock afetado:** `src/lib/api/mocks/ia.ts:25-31` — campo `prenhez` → `prenhes`

---

### 🟡 [T-7] `DiagnosticoInseminacao.resultado` — valor "INCONCLUSIVO" não documentado

**Código atual (`src/types/index.ts:153`, `src/lib/api/endpoints/inseminacoes.ts:38`):**
```typescript
resultado: "PRENHA" | "VAZIA" | "INCONCLUSIVO"
```

A documentação não lista "INCONCLUSIVO" como resultado válido para o body do diagnóstico. O backend Spring Boot pode rejeitar com `VALIDATION_ERROR`.

**Correção:** Remover `"INCONCLUSIVO"` até confirmação de que o backend aceita esse valor.

---

### 🟡 [T-8] `Parto GET` — campo `resumo` ausente (doc p.24)

**Doc retorna além de `data[]` e `meta`:**
```json
"resumo": { "total_partos": 2, "iep_medio_dias": 365, "prolificidade_media": 1.0 }
```

**Arquivo:** `src/lib/api/endpoints/diario.ts:18`

**Correção — criar interface com resumo:**
```typescript
interface PartosResponse {
  success: boolean;
  data: Parto[];
  resumo: { total_partos: number; iep_medio_dias: number; prolificidade_media: number };
  meta: PaginationMeta;
}
```
Substituir `PaginatedResponse<Parto>` por `PartosResponse` no `diarioApi.partos()`.

---

### 🟡 [T-9] `EventoSanitario GET` — campo `alertas_proxima_dose` ausente (doc p.25)

**Doc retorna** `"alertas_proxima_dose": 1` no nível raiz da resposta.

**Arquivo:** `src/lib/api/endpoints/diario.ts:33`

**Correção — criar interface:**
```typescript
interface SanitarioResponse extends PaginatedResponse<EventoSanitario> {
  alertas_proxima_dose: number;
}
```
Substituir `PaginatedResponse<EventoSanitario>` por `SanitarioResponse`.

---

### 🟡 [T-10] `POST /diario/{id}/pesagens` — response incompleto (doc p.24)

**Doc retorna:** `{ id, peso_kg, gmd_calculado, created_at }`

**Código atual (`src/lib/api/endpoints/diario.ts:16`):**
```typescript
client.post<ApiResponse<{ id: string; gmd_calculado?: number }>>
```

**Correção:**
```typescript
client.post<ApiResponse<{ id: string; peso_kg: number; gmd_calculado?: number; created_at: string }>>
```

---

## 2. Endpoints (`src/lib/api/endpoints/`)

### 🔴 [E-1] `alertasApi.marcarLido()` e `alertasApi.resolver()` — PATCH sem body (doc p.31-32)

**Arquivo:** `src/lib/api/endpoints/alertas.ts:31-35`

**Código atual:**
```typescript
marcarLido: (id: string) =>
  client.patch<ApiResponse<null>>(`/alertas/${id}/lido`).then((r) => r.data),

resolver: (id: string) =>
  client.patch<ApiResponse<null>>(`/alertas/${id}/resolver`).then((r) => r.data),
```

**Doc exige body:**
- `PATCH /alertas/{id}/lido` → `{ "lido": true }`
- `PATCH /alertas/{id}/resolver` → `{ "resolvido": true }`

**Correção:**
```typescript
marcarLido: (id: string) =>
  client.patch<ApiResponse<{ id: string; lido: boolean }>>(`/alertas/${id}/lido`, { lido: true }).then((r) => r.data),

resolver: (id: string) =>
  client.patch<ApiResponse<{ id: string; resolvido: boolean; lido: boolean }>>(`/alertas/${id}/resolver`, { resolvido: true }).then((r) => r.data),
```

---

### 🔴 [E-2] `authApi.logout()` — não envia `refresh_token` no body (doc p.5)

**Arquivo:** `src/lib/api/endpoints/auth.ts:11-13`

**Código atual:**
```typescript
logout: () =>
  client.post<ApiResponse<null>>("/auth/logout").then((r) => r.data),
```

**Correção — aceitar token como parâmetro:**
```typescript
logout: (refresh_token: string) =>
  client.post<ApiResponse<{ mensagem: string }>>("/auth/logout", { refresh_token }).then((r) => r.data),
```

**Arquivo afetado:** `src/hooks/useAuth.ts:37-43` — passar o token lido do storage:
```typescript
const logout = async () => {
  const refresh =
    localStorage.getItem(STORAGE_KEYS.refreshToken) ??
    sessionStorage.getItem(STORAGE_KEYS.refreshToken);
  if (refresh) {
    await authApi.logout(refresh).catch(() => {});  // <— passar refresh
  }
  localStorage.clear();
  sessionStorage.clear();
  queryClient.clear();
  window.location.href = "/login";
};
```

---

### 🟠 [E-3] `authApi.me()` — tipo de retorno incompleto (doc p.7)

**Arquivo:** `src/lib/api/endpoints/auth.ts:14-15`

**Código atual:**
```typescript
client.get<ApiResponse<{ id: string; nome: string; email: string; perfil: Perfil }>>("/usuarios/me", ...)
```

**Doc retorna:** `id, nome, email, cpf, telefone, perfil, ultimo_acesso, fazendas[{id, nome, municipio, estado}]`

**Correção — usar o tipo `Usuario` já definido:**
```typescript
me: (signal?: AbortSignal) =>
  client.get<ApiResponse<Usuario>>("/usuarios/me", { ...(signal ? { signal } : {}) }).then((r) => r.data),
```

`Usuario` em `src/types/index.ts:118` já inclui todos os campos. Com isso, `Perfil.tsx` pode ler fazendas de `/usuarios/me` e eliminar a chamada extra a `fazendasApi.listar()`.

---

### 🟠 [E-4] `inseminacoesApi.pendentes()` — ignora parâmetros documentados (doc p.21)

**Arquivo:** `src/lib/api/endpoints/inseminacoes.ts:21-23`

**Código atual:**
```typescript
pendentes: (signal?: AbortSignal) =>
  client.get<ApiResponse<Inseminacao[]>>("/inseminacoes/pendentes-diagnostico", ...).then((r) => r.data),
```

**Doc aceita:** `fazenda_id` e `dias_minimos` (integer)

**Doc retorna** além do array:
```json
"meta": { "total": 7, "criticos": 2, "atencao": 5 }
```

**Correção:**
```typescript
interface PendentesResponse {
  success: boolean;
  data: Inseminacao[];
  meta: { total: number; criticos: number; atencao: number };
}

pendentes: (params?: { fazenda_id?: string; dias_minimos?: number }, signal?: AbortSignal) =>
  client.get<PendentesResponse>("/inseminacoes/pendentes-diagnostico", {
    params,
    ...(signal ? { signal } : {}),
  }).then((r) => r.data),
```

---

### 🟠 [E-5] `relatoriosApi` — `tecnico` vs `tecnico_id` e tipos extras (doc p.36)

**Arquivo:** `src/lib/api/endpoints/relatorios.ts:14-22`

**Código atual:**
```typescript
export interface RelatorioParams {
  fazenda_id?: string;
  data_inicio?: string;
  data_fim?: string;
  especie?: string;
  status?: string;       // não documentado
  tecnico?: string;      // nome errado — doc usa tecnico_id (UUID)
}
```

**Correção:**
```typescript
export interface RelatorioParams {
  fazenda_id?: string;
  data_inicio?: string;
  data_fim?: string;
  especie?: string;
  tecnico_id?: string;   // UUID — renomear de "tecnico"
  page?: number;
  limit?: number;
}
```

Remover `status` (não documentado para `/relatorios/reprodutivo`).

---

### 🟠 [E-6] `animaisApi` — endpoint ANI-06 `/historico` não implementado (doc p.13-14)

O endpoint `GET /animais/{animal_id}/historico` retorna resumo consolidado (últimas 10 inseminações, pesagens e partos). O mock existe (`src/lib/api/mocks/index.ts:174`) mas a função não foi adicionada ao endpoint.

**Arquivo:** `src/lib/api/endpoints/animais.ts` — adicionar:
```typescript
historico: (id: string, params?: { limit?: number }, signal?: AbortSignal) =>
  client.get<ApiResponse<{
    inseminacoes: Pick<Inseminacao, "id" | "data_inseminacao" | "tipo" | "resultado">[];
    pesagens: Pick<Pesagem, "id" | "data" | "peso_kg" | "gmd_calculado">[];
    partos: Pick<Parto, "id" | "data_parto" | "num_crias" | "num_crias_vivas">[];
  }>>(`/animais/${id}/historico`, { params, ...(signal ? { signal } : {}) }).then((r) => r.data),
```

---

### 🟠 [E-7] `animaisApi` — endpoint ANI-08 `importar-csv` não implementado (doc p.16)

**Arquivo:** `src/lib/api/endpoints/animais.ts` — adicionar:
```typescript
importarCsv: (arquivo: File, fazendaId: string) => {
  const form = new FormData();
  form.append("arquivo", arquivo);
  form.append("fazenda_id", fazendaId);
  return client.post<ApiResponse<{
    total_linhas: number;
    importados: number;
    erros: number;
    detalhes_erros: { linha: number; erro: string }[];
  }>>("/animais/importar-csv", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
},
```

---

### 🟠 [E-8] `diarioApi` — endpoint DIA-09 `exportar-pdf` não implementado (doc p.27)

**Arquivo:** `src/lib/api/endpoints/diario.ts` — adicionar:
```typescript
exportarPdf: (animalId: string) =>
  client.get(`/diario/${animalId}/exportar-pdf`, { responseType: "blob" }).then((r) => r.data as Blob),
```

---

### 🟠 [E-9] `animaisApi.listarRacas()` — nunca chamada em nenhum componente

**Arquivo:** `src/lib/api/endpoints/animais.ts:46`

A função existe mas é dead code: `Modal01NewAnimalStep1` usa select estático de espécie, `Modal02NewAnimalStep2` usa inputs de texto livres, `ModalChatNewAnimal` usa constante `RACAS` hardcoded.

**Ação necessária:** Conectar ao `Modal01NewAnimalStep1` ou `Modal02NewAnimalStep2` para popular raças dinamicamente após selecionar espécie, conforme especificado no ANI-07 da doc.

---

### 🟠 [E-10] `animaisApi.counts()` — endpoint não documentado (causará 404)

**Arquivo:** `src/lib/api/endpoints/animais.ts:34`

`GET /animais/counts` não existe na documentação da API. Com `VITE_USE_REAL_API=true` vai retornar 404.

**Usado em:** `src/pages/animais/AnimalList.tsx:240`

**Alternativas:**
1. Solicitar ao time de backend que adicione o endpoint
2. Derivar as contagens do response paginado (`meta.total` por filtro)
3. Usar os dados do `GET /dashboard/kpis` que já retorna `total_animais.por_especie`

---

### 🔵 [E-11] `relatoriosApi.exportar()` — dead code (nunca chamada)

**Arquivo:** `src/lib/api/endpoints/relatorios.ts:32`

`Relatorios.tsx` gera CSV e PDF 100% no browser (via `Blob` e `@react-pdf/renderer`). A função `relatoriosApi.exportar()` existe mas nunca é importada ou chamada.

**Ação:** Ou remover a função e manter geração no cliente, ou substituir a geração local por chamada à API (`GET /relatorios/reprodutivo/exportar?formato=pdf|csv`).

---

## 3. Mocks (`src/lib/api/mocks/`)

### 🟠 [M-1] Mock de `atualizarPerfil` usa método PUT em vez de PATCH

**Arquivo:** `src/lib/api/mocks/index.ts:80`

**Código atual:**
```javascript
mock.onPut("/usuarios/me").reply(...)
```

**Correção:**
```javascript
mock.onPatch("/usuarios/me").reply(...)
```

---

### 🟠 [M-2] Mock de `exportarDados` tem URL errada

**Arquivo:** `src/lib/api/mocks/index.ts:86`

**Código atual:**
```javascript
mock.onGet("/usuarios/me/exportar").reply(...)
```

**Doc endpoint:** `GET /usuarios/me/dados`

**Correção:**
```javascript
mock.onGet("/usuarios/me/dados").reply(async () => {
  await delay(1000, 2000);
  return [200, {
    success: true,
    data: {
      usuario: usuario,
      animais_cadastrados: animais.length,
      inseminacoes_registradas: inseminacoes.length,
      export_gerado_em: new Date().toISOString(),
    },
  }];
});
```

---

### 🟠 [M-3] Mock de `/usuarios/me/alterar-senha` — endpoint não documentado

**Arquivo:** `src/lib/api/mocks/index.ts:75-78`

`POST /usuarios/me/alterar-senha` não existe na documentação. Com API real retornará 404.

**Ação:** Remover o mock ou confirmar com o time de backend se esse endpoint será adicionado.

---

### 🟠 [M-4] Mock de `selecaoGenetica` — response com tipos errados

**Arquivo:** `src/lib/api/mocks/index.ts:501-515`

**Código atual:**
```javascript
{ matriz: "BOV-0001 Estrela", reprodutor: "Zeus Angus", score_genetico: 87, heterose_esperada: "12%", risco_endogamia: "0.02" }
```

**Doc retorna:**
```json
{
  "matriz": { "id": "uuid", "codigo": "BOV-0012", "nome": "Mimosa" },
  "reprodutor": { "id": "uuid", "nome": "Touro Elite 7023" },
  "score_genetico": 0.89,
  "heterose_esperada_pct": 4.2,
  "risco_endogamia_f": 0.012,
  "alerta_consanguinidade": false,
  "justificativa": "Cruzamento Nelore × Angus maximiza ganho de peso com heterose positiva."
}
```

**Correção do mock:**
```javascript
{
  matriz: { id: "ani-001", codigo: "BOV-0001", nome: "Estrela" },
  reprodutor: { id: "rep-002", nome: "Zeus Angus" },
  score_genetico: 0.87,
  heterose_esperada_pct: 12.0,
  risco_endogamia_f: 0.02,
  alerta_consanguinidade: false,
  justificativa: "Cruzamento maximiza ganho de peso com heterose positiva.",
}
```

---

### 🟡 [M-5] Mock de `pendentes-diagnostico` — falta `meta` (doc p.21)

**Arquivo:** `src/lib/api/mocks/index.ts:336-342`

**Código atual:** Retorna `{ success, data: [...] }` sem `meta`.

**Doc retorna:** `meta: { total, criticos, atencao }`

**Correção:**
```javascript
mock.onGet("/inseminacoes/pendentes-diagnostico").reply(async () => {
  await delay();
  const pendentes = inseminacoes
    .filter((i) => i.resultado === "PENDENTE")
    .sort((a, b) => b.dias_decorridos - a.dias_decorridos);
  const criticos = pendentes.filter((i) => i.dias_decorridos > 30).length;
  const atencao = pendentes.filter((i) => i.dias_decorridos > 14 && i.dias_decorridos <= 30).length;
  return [200, {
    success: true,
    data: pendentes,
    meta: { total: pendentes.length, criticos, atencao },
  }];
});
```

---

### 🟡 [M-6] Mock de `listarRacas` retorna `string[]` em vez de `Record<string, string[]>`

**Arquivo:** `src/lib/api/mocks/index.ts:198-201`

**Código atual:**
```javascript
return [200, { success: true, data: ["Nelore", "Angus", "Brahman", ...] }];
```

**Doc retorna:** `data: { "BOVINO": [...], "OVINO": [...], "CAPRINO": [...] }`

**Correção:**
```javascript
mock.onGet("/animais/racas").reply(async (config) => {
  await delay(100, 200);
  const especie = (config.params as Record<string,string> | undefined)?.["especie"];
  const todas = {
    BOVINO: ["Nelore", "Angus", "Brahman", "Gir Leiteiro", "Guzerá", "Tabapuã", "Simmental"],
    OVINO: ["Santa Inês", "Morada Nova", "Dorper", "Suffolk", "Somalis Brasileira"],
    CAPRINO: ["Saanen", "Anglo-nubiano", "Boer", "Moxotó", "Canindé"],
  };
  const data = especie && especie in todas
    ? { [especie]: todas[especie as keyof typeof todas] }
    : todas;
  return [200, { success: true, data }];
});
```

---

## 4. Hooks (`src/lib/api/hooks/` e `src/hooks/`)

### 🟡 [H-1] `useCreateInseminacao` — não invalida `animais.detail` no `onSuccess` online

**Arquivo:** `src/lib/api/hooks/useCreateInseminacao.ts:49-54`

O `onSuccess` online invalida `inseminacoes.list`, `dashboard.kpis` e `alertas`, mas **não invalida** `["animais", "detail", input.animal_id]`. O status do animal (que pode mudar para `EM_MONITORAMENTO`) não é recarregado.

**Correção — adicionar na linha 54:**
```typescript
void queryClient.invalidateQueries({ queryKey: ["animais", "detail", input.animal_id] });
```

---

### 🔵 [H-2] `useDeleteAnimal` existe mas não é usado em `AnimalList` e `AnimalDetail`

`src/lib/api/hooks/useDeleteAnimal.ts` invalida corretamente `animais.list`, `animais.counts`, `animais.detail` e `dashboard.kpis`.

**`AnimalList.tsx:248-252`** define mutation inline que perde `dashboard.kpis`:
```typescript
// antes (inline, incompleto)
const deleteMutation = useMutation({
  mutationFn: (id: string) => animaisApi.deletar(id),
  onSuccess: () => {
    void qc.invalidateQueries({ queryKey: ["animais", "list"] });
    void qc.invalidateQueries({ queryKey: ["animais", "counts"] });
  },
});
```

```typescript
// depois
import { useDeleteAnimal } from "@/lib/api/hooks/useDeleteAnimal";
const deleteMutation = useDeleteAnimal();
// chamar: deleteMutation.mutate(id)
```

**`AnimalDetail.tsx:366-371`** define mutation inline que perde `animais.counts` e `dashboard.kpis`:
```typescript
// depois
import { useDeleteAnimal } from "@/lib/api/hooks/useDeleteAnimal";
const deleteMutation = useDeleteAnimal();
// chamar: deleteMutation.mutate(id!) e redirecionar no onSuccess do hook (adicionar callback)
```

---

### 🔵 [H-3] `useAsyncFieldValidation` — criado mas nunca importado

**Arquivo:** `src/hooks/useAsyncFieldValidation.ts`

O hook para validação assíncrona de campo (ex: brinco único) foi criado mas não é usado em nenhum modal ou formulário. O checklist de engenharia (`docs/AUDIT.md:416`) marca como ✅.

**Ação:** Conectar em `Modal01NewAnimalStep1` no campo `brinco` ou em `Modal02NewAnimalStep2` para validar brinco duplicado contra o servidor.

---

## 5. Páginas (`src/pages/`)

### 🔴 [P-1] `AnaliseIA.tsx` — `iaApi.predicao()` não envia `condicao_corporal_atual` (doc p.28)

**Arquivo:** `src/pages/ia/AnaliseIA.tsx:114`

**Código atual:**
```typescript
mutationFn: () => iaApi.predicao({ animal_id: selectedAnimal!.id }),
```

`condicao_corporal_atual` é o fator de maior peso no modelo (impacto 0.18). `selectedAnimal.condicao_corporal` está disponível no componente (linha 196).

**Correção:**
```typescript
mutationFn: () => iaApi.predicao({
  animal_id: selectedAnimal!.id,
  condicao_corporal_atual: selectedAnimal!.condicao_corporal,
}),
```

---

### 🔴 [P-2] `AnaliseIA.tsx` — `iaApi.selecaoGenetica()` com payload completamente errado (doc p.29-30)

**Arquivo:** `src/pages/ia/AnaliseIA.tsx:580`

**Problemas:**
1. `objetivos` envia `["fertilidade","peso_desmame","heterose","endogamia"]` — doc espera `["GANHO_PESO","FERTILIDADE"]` (valores em UPPER_SNAKE_CASE diferentes)
2. `matrizes_ids: []` sempre vazio — IA recebe zero matrizes
3. `reprodutores_ids: []` sempre vazio — IA recebe zero reprodutores
4. Tipo local `Recomendacao` tem `matriz: string` e `reprodutor: string` (strings), doc retorna objetos

**Correções necessárias:**

a) Mapear critérios para valores da doc:
```typescript
const CRITERIO_TO_OBJETIVO: Record<string, string> = {
  fertilidade: "FERTILIDADE",
  peso_desmame: "GANHO_PESO",
  // heterose e endogamia não têm equivalente documentado — verificar com backend
};
```

b) Coletar `matrizes_ids` e `reprodutores_ids` via seletores antes de disparar

c) Corrigir tipo local `Recomendacao` (linha 590-596):
```typescript
type Recomendacao = {
  matriz: { id: string; codigo: string; nome: string };
  reprodutor: { id: string; nome: string };
  score_genetico: number;
  heterose_esperada_pct: number;
  risco_endogamia_f: number;
  alerta_consanguinidade: boolean;
  justificativa: string;
};
```

d) Atualizar renders (linhas 656, 659, 662, 665, 692, 696, 697, 705):
- `r.matriz` → `r.matriz.nome`
- `r.reprodutor` → `r.reprodutor.nome`
- `r.heterose_esperada` → `r.heterose_esperada_pct` (já é número, remover `parseFloat`)
- `r.risco_endogamia` → `r.risco_endogamia_f` (já é número)
- `parseFloat(r.risco_endogamia)` → `r.risco_endogamia_f`

---

### 🟡 [P-3] `AnaliseIA.tsx` — `aviso_clinico` da API ignorado, hardcoded no JSX (doc p.28)

**Arquivo:** `src/pages/ia/AnaliseIA.tsx:353-362`

O campo `predicao.aviso_clinico` está tipado em `PredicaoPrenhez` e retornado pela API, mas o componente exibe um aviso clínico hardcoded em vez de usar o valor da API.

**Correção:**
```typescript
// antes (hardcoded)
<p className="...">
  Este score não substitui o julgamento clínico veterinário...
</p>

// depois (da API com fallback)
<p className="...">
  {predicao.aviso_clinico ?? "Este score é uma estimativa probabilística e não substitui o julgamento clínico veterinário."}
</p>
```

---

### 🟠 [P-4] `Relatorios.tsx` — 4 de 5 tipos de relatório sem query implementada

**Arquivo:** `src/pages/relatorios/Relatorios.tsx:30-104`

O tipo `TipoRelatorio` define 5 opções, mas apenas `"reprodutivo"` tem `useQuery`. Os tipos `"ponderal"` e `"sanitario"` têm endpoints documentados (REL-02 e REL-03) mas sem implementação. Os tipos `"reprodutores"` e `"especies"` não existem na documentação.

**Ação:**
1. Remover `"reprodutores"` e `"especies"` do tipo (não documentados)
2. Implementar queries para `"ponderal"` (`GET /relatorios/ponderal`) e `"sanitario"` (`GET /relatorios/sanitario`)
3. Criar interfaces `RelatorioPonderalRow` e `RelatorioSanitarioRow` baseadas nos responses da doc (p.36-38)

---

## 6. Resumo executivo por prioridade

### Fazer primeiro (críticos — quebram com API real)

| ID | Arquivo | Ação |
|----|---------|------|
| T-1 | `types/index.ts:264` + `dashboard.ts:14` + `Dashboard.tsx:110` + `mocks/dashboard.ts:19` | Refatorar `GraficoPonto[]` → `GraficoReprodutivoData` |
| T-2 | `types/index.ts:258` + `Dashboard.tsx:48-49` + `mocks/dashboard.ts:8` | `"up"/"down"` → `"positivo"/"negativo"` |
| T-3 | `types/index.ts:306` + `AnaliseIA.tsx:544,552` + `mocks/ia.ts:48-53` | `reprodutor`/`taxa_prenhez` → `nome`/`taxa_filhos` |
| T-4 | `types/index.ts:270` + `mocks/dashboard.ts:28-37` + `Dashboard.tsx:187,195` | TimelineItem flat vs nested |
| E-1 | `endpoints/alertas.ts:31-35` | Adicionar body nos PATCH de alertas |
| E-2 | `endpoints/auth.ts:11` + `hooks/useAuth.ts:42` | Enviar `refresh_token` no logout |
| P-1 | `AnaliseIA.tsx:114` | Enviar `condicao_corporal_atual` na predição |
| P-2 | `AnaliseIA.tsx:580,590-711` | Corrigir payload e tipos da seleção genética |

### Fazer em seguida (altos — funcionalidades ausentes ou erradas)

| ID | Arquivo | Ação |
|----|---------|------|
| M-1 | `mocks/index.ts:80` | `onPut` → `onPatch` |
| M-2 | `mocks/index.ts:86` | URL `/exportar` → `/dados` |
| M-3 | `mocks/index.ts:75-78` | Remover endpoint inventado |
| M-4 | `mocks/index.ts:501-515` | Corrigir response de seleção genética |
| E-3 | `endpoints/auth.ts:14` | Expandir tipo de `me()` para `Usuario` |
| E-4 | `endpoints/inseminacoes.ts:21` | Adicionar params + meta ao pendentes |
| E-5 | `endpoints/relatorios.ts:21` | `tecnico` → `tecnico_id` |
| E-6 | `endpoints/animais.ts` | Implementar `animaisApi.historico()` |
| E-7 | `endpoints/animais.ts` | Implementar `animaisApi.importarCsv()` |
| E-8 | `endpoints/diario.ts` | Implementar `diarioApi.exportarPdf()` |
| E-9 | Componentes de modal | Conectar `animaisApi.listarRacas()` |
| E-10 | `endpoints/animais.ts:34` | Confirmar endpoint `/animais/counts` com backend |
| P-4 | `Relatorios.tsx:30-104` | Remover tipos não documentados, implementar ponderal/sanitario |

### Depois (médios e práticas)

| ID | Arquivo | Ação |
|----|---------|------|
| T-5 | `types/index.ts:259` | badge enum |
| T-6 | `types/index.ts:302` + `mocks/ia.ts` | `prenhez` → `prenhes` |
| T-7 | `types/index.ts:153` + `endpoints/inseminacoes.ts:38` | Remover INCONCLUSIVO |
| T-8 | `endpoints/diario.ts:18` | Adicionar `resumo` em partos |
| T-9 | `endpoints/diario.ts:33` | Adicionar `alertas_proxima_dose` |
| T-10 | `endpoints/diario.ts:16` | Completar response de POST pesagem |
| M-5 | `mocks/index.ts:336` | Adicionar `meta` no pendentes |
| M-6 | `mocks/index.ts:198` | Corrigir formato do mock de raças |
| H-1 | `hooks/useCreateInseminacao.ts:54` | Invalidar `animais.detail` |
| H-2 | `AnimalList.tsx:248` + `AnimalDetail.tsx:366` | Usar `useDeleteAnimal` |
| H-3 | Modais de animal | Conectar `useAsyncFieldValidation` |
| P-3 | `AnaliseIA.tsx:353` | Usar `predicao.aviso_clinico` da API |
| E-11 | `endpoints/relatorios.ts:32` | Remover ou conectar `exportar()` |
