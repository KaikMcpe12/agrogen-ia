# AUDIT.md — AgroGen IA Frontend
**Atualizado em:** 2026-05-30  
**Fontes lidas:**
- `AgroGen-IA-Arquitetura-UX.pdf` (22 páginas) ✅
- `AgroGen-IA-API-RESTful.pdf` (46 páginas) ✅
- `AgroGen-IA-Adendo-UX.pdf` (19 páginas) ✅
- Código-fonte atual em `src/`

---

## Commits realizados

| Commit | Hash | Descrição |
|--------|------|-----------|
| C1 | `e1afb19` | Infraestrutura — storage keys, error-messages, utils, ALE-04 polling |
| C2 | `9c727b2` | Dashboard completações |
| CFix | `9d3957f` | Fix inconsistências Adendo UX |
| C3 | `b74d596` | TELA-02 + SUB-01: filtros, sort, edit modal, perfil do animal |
| C4 | `9b4f781` | Inseminação: MODAL-04, melhorias MODAL-03/05, TELA-03 |
| C5 | `2d55c8e` | Diário de Bordo completo (TELA-05) |
| C6 | `bc42e38` | Análise IA completa (TELA-04) |
| C7 | `b2173a9` | Auth: RecuperarSenha, RedefinirSenha, FLUXO-07 |
| C8 | `d5f632b` | Perfil 3 abas, MODAL-11 a MODAL-15, FAZ-01/04 |
| C9 | `50d96ea` | Header: seletor de fazenda, atalho Fazendas |
| C10 | WIP | OfflineBanner, Relatórios melhorias, polimento final |

---

## TELA-01 — Dashboard

| Item | Status | Commit |
|------|--------|--------|
| Polling automático 5 min | ✅ | C1 |
| Indicador "Atualizado às HH:MM" | ✅ | C2 |
| Card Alertas clicável → anchor #alertas | ✅ | C2 |
| Badge taxa prenhez 3 estados (≥60%/40-59%/<40%) | ✅ | C2 |
| Filtro período 3M/6M/12M no gráfico | ✅ | C2 |
| Timeline ícone diferente por tipo | ✅ | C2 |
| Datas relativas pt-BR | ✅ | C1+C2 |
| Alertas urgentes filtrados 7 dias | ✅ | C2 |
| Alerta crítico com fundo destacado | ✅ | C2 |
| Empty state "sem fazenda" (Tractor + "Bem-vindo ao AgroGen IA!") | ✅ | CFix |
| Empty state "fazenda sem animais" (cow + CTA Novo Animal) | ✅ | CFix |
| Empty state "sem inseminações" (gráfico com placeholder) | ⏳ | C3 |

---

## TELA-02 — Animais

| Item | Status | Commit |
|------|--------|--------|
| Busca por nome, código, brinco (debounce 300ms) | ✅ | — |
| Chips com contagem ao lado | ❌ | C3 |
| Botão "Limpar filtros" | ❌ | C3 |
| Filtros persistem em sessionStorage | ❌ | C3 |
| Ordenação por clique no cabeçalho ↑↓ | ❌ | C3 |
| Ação "Registrar inseminação" com animal pré-selecionado | ❌ | C3 |
| Paginação 10/20/50 + "Exibindo X de Y" | ❌ | C3 |
| Ícone Editar (lápis) → AnimalModal mode="edit" | ❌ | C3 |
| Animal DESCARTADA com opacidade reduzida | ✅ | — |
| Empty state lista vazia (cow + "Nenhum animal cadastrado ainda") | 🟡 emoji, sem CTA completo | C3 |
| Empty state filtros sem resultado (filter-x + "Limpar filtros") | ❌ | C3 |
| Importar CSV → MODAL-13 | ❌ | C8 |

---

## TELA-03 — Inseminação

| Item | Status | Commit |
|------|--------|--------|
| Duas abas (Inseminações / Diagnósticos) com badge | ❓ verificar | C4 |
| Indicador atraso linha Pendente > 28d | ❓ | C4 |
| Fila pendentes ordenada urgência (mais antigos primeiro) | ❓ | C4 |
| Indicador "crítico" > 30 dias | ❓ | C4 |
| Botão "Filtros avançados" → DRAWER-03 ligado | ❌ | C4 |
| Empty state "sem inseminações" (syringe) | ❌ | C4 |
| Empty state "sem pendentes" (check-circle, "Tudo em dia!") | ❌ | C4 |

---

## TELA-04 — Análise IA

| Item | Status | Commit |
|------|--------|--------|
| 3 abas, gauge circular, top-5 fatores | ✅ | — |
| **Aviso clínico SEMPRE visível** (não condicional à API) | ❌ | C6 |
| Animação "Analisando..." com mensagens rotativas 1.5s | ❌ | C6 |
| Botão "Registrar Inseminação" no resultado | ❌ | C6 |
| Padrões: tabela top reprodutores | ❌ | C6 |
| Padrões: mínimo 20 inseminações | ✅ | — |
| Seleção Genética: alerta F > 6.25% | ❌ | C6 |
| Seleção Genética: tooltips DEP/heterose/endogamia | ❌ | C6 |
| Empty state "sem animal selecionado" (brain) | ❌ | C6 |
| Empty state "dados insuficientes" (bar-chart-disabled) | ✅ | — |
| Empty state "sem objetivos" (target) | ❌ | C6 |

---

## TELA-05 — Diário de Bordo

| Item | Status | Commit |
|------|--------|--------|
| Últimos 5 animais acessados como atalho (localStorage) | ❌ | C5 |
| URL muda para /diario-de-bordo/{id} ao selecionar | ❌ | C5 |
| Card identificação STICKY no topo ao navegar abas | ❌ | C5 |
| Aba Parição visível só para FÊMEAS | ❌ | C5 |
| Aba Sanitário badge alerta (próxima dose ≤7d) | ❌ | C5 |
| Linha próxima dose vencida com indicador | ❌ | C5 |
| Ocorrências não resolvidas no topo | ✅ | — |
| Tooltip gráfico peso (data + peso exactos) | 🟡 | C5 |
| GMD entre pesagens | ✅ | — |
| Botões "Exportar Ficha PDF" e "Exportar CSV" | ❌ | C5 |
| MODAL-07 "Óbito da Matriz" → confirmação descarte | ❌ | C5 |
| Empty states por aba (scale, baby, etc.) | ❌ | C5 |

---

## TELA-06 — Relatórios

| Item | Status | Commit |
|------|--------|--------|
| 5 tipos de relatório | ❓ verificar | C10 |
| Filtros atualizam com debounce 500ms (sem botão "Gerar") | ❓ | C10 |
| Atalhos de período | ❓ | C10 |
| Prévia limitada 50 linhas | ❓ | C10 |
| Exportar CSV UTF-8 + Exportar PDF | ❓ | C10 |
| Empty state filtros sem resultado | ❌ | C10 |

---

## Auth (TELA-07, TELA-08, TELA-09)

| Item | Status | Commit |
|------|--------|--------|
| Login: "Lembrar-me" + sessionStorage/localStorage corretos | ✅ | CFix |
| Login: link "Esqueci minha senha" → /recuperar-senha | ✅ | CFix |
| Login: mensagens de erro específicas por código | ✅ | C1+CFix |
| Cadastro: CPF obrigatório + validação dígito | ✅ | CFix |
| Cadastro: senha min 8 + maiúscula + número + símbolo | ✅ | CFix |
| Cadastro: indicador de força da senha | ✅ | CFix |
| Cadastro: checkbox "Aceitar os termos" obrigatório | ✅ | CFix |
| /recuperar-senha (TELA-09a) | ❌ | C7 |
| /redefinir-senha?token= (TELA-09b) | ❌ | C7 |
| FLUXO-07 onboarding pós-cadastro | ❌ | C7 |

---

## Perfil (TELA-10)

| Item | Status | Commit |
|------|--------|--------|
| 3 abas (Dados / Fazendas / Privacidade) | ❌ | C8 |
| Aba Dados: nome e telefone editáveis (USR-02) | ❌ | C8 |
| Aba Fazendas: CRUD completo (MODAL-11/12) | ❌ | C8 |
| Aba Privacidade: exportar dados, excluir conta, toggle tema | ❌ | C8 |
| MODAL-11 Nova Fazenda | ❌ | C8 |
| MODAL-12 Editar Fazenda (mode="edit") | ❌ | C8 |
| MODAL-13 Importar CSV (3 passos) | ❌ | C8 |
| MODAL-14 Confirmar Exclusão Conta | ❌ | C8 |
| MODAL-15 Alterar Senha | ❌ | C8 |
| Empty state "sem fazendas" (tractor) | ❌ | C8 |

---

## SUB-03 — Detalhes da Inseminação

| Item | Status | Commit |
|------|--------|--------|
| Rota /inseminacao/:id | ❌ | C4 |
| Blocos: header evento, dados, animal, reprodutor, técnico, diagnóstico, parto, timeline | ❌ | C4 |

---

## Header Global

| Item | Status | Commit |
|------|--------|--------|
| Sino com badge polling 60s (ALE-04) | ✅ | C1 |
| Seletor de fazenda | ❌ | C9 |
| Avatar dropdown com link Fazendas | ❌ | C9 |
| FLUXO-10: troca de fazenda invalida todas as queries | ❌ | C9 |

---

## BottomNav (Adendo 9.7)

| Item | Status | Commit |
|------|--------|--------|
| 5 itens: Início(home)/Animais(cow)/Inseminação(syringe)/Diário(book-open)/Mais(menu) | ✅ | CFix |
| "Mais" inclui: Análise IA, Relatórios, Perfil, Sair | ✅ | CFix |

---

## Modais MODAL-01 a MODAL-10

| Modal | Status | Commit |
|-------|--------|--------|
| MODAL-01/02 AnimalModal mode="create" | ✅ | — |
| MODAL-01/02 AnimalModal mode="edit" (FLUXO-08) | ❌ | C3 |
| MODAL-03 InseminacaoModal — banner amarelo INTERVALO_CURTO | ❓ verificar | C4 |
| MODAL-03 — Protocolo obrigatório se IATF | ❓ | C4 |
| MODAL-04 ReprodutorModal (ausente) | ❌ | C4 |
| MODAL-05 DiagnosticoModal — data parto auto-calculada | ✅ | — |
| MODAL-06 PesagemModal | ✅ | — |
| MODAL-07 PartoModal — "Óbito Matriz" → descarte | ❌ | C5 |
| MODAL-08 SanitarioModal | ✅ | — |
| MODAL-09 OcorrenciaModal | ✅ | — |
| MODAL-10 DeleteConfirm | ✅ | — |

---

## Infraestrutura e Convenções

| Item | Status | Commit |
|------|--------|--------|
| localStorage keys `agrogen.*` padronizadas | ✅ | C1+CFix |
| Access token em sessionStorage; refreshToken localStorage | ✅ | CFix |
| error-messages.ts centralizado (Adendo 7.2) | ✅ | C1+CFix |
| Interpolação {N}/{X} em mensagens dinâmicas | ✅ | CFix |
| Skip-link "Pular para conteúdo principal" | ✅ | C1 |
| formatRelativeTime pt-BR | ✅ | C1 |
| formatNumber (vírgula decimal, ponto milhar) | ✅ | C1 |
| InstallPWAPrompt com chaves corretas e "Agora não" | ✅ | CFix |
| Banner offline fixo | ❌ | C10 |
| aria-label em todos os ícone-only buttons | 🟡 parcial | C10 |
| aria-live="polite" nos toasts | ❌ | C10 |

---

## Empty States (Adendo 6.2 — mínimo 10 para MVP)

| Tela / Condição | Status | Commit |
|-----------------|--------|--------|
| /dashboard — sem fazenda (Tractor) | ✅ | CFix |
| /dashboard — sem animais (cow) | ✅ | CFix |
| /animais — lista vazia | 🟡 emoji, sem padrão | C3 |
| /animais — filtros sem resultado | ❌ | C3 |
| /inseminacao — sem inseminações | ❌ | C4 |
| /inseminacao — sem pendentes | ❌ | C4 |
| /analise-ia — sem animal selecionado | ❌ | C6 |
| /analise-ia — sem objetivos (Seleção) | ❌ | C6 |
| /diario-de-bordo — sem animal | ❌ | C5 |
| /diario-de-bordo — aba sem dados (peso/parição/etc.) | ❌ | C5 |
| DRAWER-01 alertas — sem alertas | ✅ | C2 |
| /perfil — sem fazendas | ❌ | C8 |
| /relatorios — filtros sem resultado | ❌ | C10 |

**Implementados: 4/13** → Meta mínima MVP: 10 → precisamos mais 6.

---

## Items NÃO NEGOCIÁVEIS para MVP — status final

| Item | Status |
|------|--------|
| Aviso clínico SEMPRE visível na Predição IA | ❌ C6 |
| Polling sino de alertas 60s (ALE-04) | ✅ C1 |
| Empty states TELA-02 (lista + filtro) | ❌ C3 |
| Empty state Dashboard sem fazenda | ✅ CFix |
| Validação intervalo curto MODAL-03 | ❓ C4 |
| Reuso create/edit mesmo componente | ❌ C3 |
| Mobile bottom nav 5 itens corretos | ✅ CFix |
| Dark mode funcionando | ✅ — |
| PWA manifest + service worker | ✅ — |
| error-messages.ts centralizado | ✅ C1 |

---

## Adendo — Gestão de Reprodutores (v1.0)

### TELA-11 — Reprodutores

| Item | Status | Commit |
|------|--------|--------|
| Rota /reprodutores acessível pelo menu do avatar | ✅ | C11 |
| Busca em tempo real por nome ou registro (debounce 300ms) | ✅ | C11 |
| Filtros chips: Espécie, Tipo (Sêmen Externo/Animal Próprio), Status | ✅ | C11 |
| Contagem ao lado de cada chip de filtro | ✅ | C11 |
| Tabela desktop com 9 colunas (seção 3.1.3) | ✅ | C11 |
| Degradação para cards em mobile (< 768px) | ✅ | C11 |
| Badge visual diferente: Sêmen Externo (amarelo) vs Animal Próprio (verde) | ✅ | C11 |
| Botão "Novo Reprodutor" abre MODAL-04 modo completo | ✅ | C11 |
| Botão "Promover animal a reprodutor" abre MODAL-17 | ❌ | C14 |
| Empty states cobertos (3 cenários) | ✅ | C11 |
| FLUXO-14: banner "Retomar inseminação" | ✅ | C11 |
| FLUXO-12: toggle ativo/inativo com confirmação na desativação | ✅ | C11 |
| FLUXO-13: exclusão com tratamento de 409 + opção desativar | ✅ | C11 |
| Paginação 10/20/50 + "Exibindo X de Y" | ✅ | C11 |

### SUB-04 — Perfil do Reprodutor

| Item | Status | Commit |
|------|--------|--------|
| Rota /reprodutores/:id | ✅ | C11 (rota) / C12 (página) |
| Header com botões: Editar, Ativar/Desativar, Excluir, Voltar | ❌ | C12 |
| Se ANIMAL_PROPRIO: link "Ver perfil do animal →" para SUB-01 | ❌ | C12 |
| Card de identidade com campos diferenciados por tipo | ❌ | C12 |
| Card de dados genéticos com tooltips nos DEPs | ❌ | C12 |
| 4 KPI cards: total inseminações, taxa de prenhez, crias geradas, última utilização | ❌ | C12 |
| Taxa de prenhez exibe "—" se menos de 5 inseminações com diagnóstico | ❌ | C12 |
| Tabela das últimas 10 inseminações com links para SUB-01 das matrizes | ❌ | C12 |
| Link "Ver todas as inseminações deste reprodutor →" | ❌ | C12 |
| Gráfico de desempenho mensal (opcional, se ≥10 inseminações) | ❌ | C12 |

### Modais

| Item | Status | Commit |
|------|--------|--------|
| MODAL-04 revisado com diferenciação rápido/completo | ❌ | C13 |
| MODAL-04 com espécie pré-preenchida e travada quando aberto de MODAL-03 | ❌ | C13 |
| MODAL-04 com regra: empresa fornecedora obrigatória se SEMEN_EXTERNO | ❌ | C13 |
| MODAL-04 com regra: animal vinculado obrigatório se ANIMAL_PROPRIO | ❌ | C13 |
| MODAL-04 mode=create vs mode=edit no mesmo componente (reuso) | ❌ | C13 |
| MODAL-16 (= MODAL-04 em mode=edit) com campos read-only conforme tipo | ❌ | C13 |
| MODAL-16 com tooltip explicando por que tipo não é editável | ❌ | C13 |
| MODAL-17 Promover Animal a Reprodutor implementado | ❌ | C14 |
| MODAL-17 com busca filtrada apenas em machos ATIVA | ❌ | C14 |
| MODAL-17 com detecção de animal já promovido (banner amarelo) | ❌ | C14 |
| MODAL-17 com toggle "Atualizar status do Animal" (default marcado) | ❌ | C14 |

### Fluxos

| Item | Status | Commit |
|------|--------|--------|
| FLUXO-11: promover touro a reprodutor a partir de SUB-01 | ❌ | C14+C15 |
| FLUXO-12: reativar/desativar reprodutor (confirmação só na desativação) | ✅ | C11 |
| FLUXO-13: tentativa de exclusão com tratamento de erro 409 + opção desativar | ✅ | C11 |
| FLUXO-14: atalho "Gerenciar todos os reprodutores" a partir de MODAL-03 com preservação de rascunho | ❌ | C15 |

### Integrações com telas existentes

| Item | Status | Commit |
|------|--------|--------|
| SUB-01: botão "Tornar reprodutor" em machos ATIVA | ❌ | C15 |
| SUB-01: link "Ver perfil do reprodutor →" se já promovido | ❌ | C15 |
| TELA-02: filtro "É reprodutor?" e badge na coluna Status | ❌ | C15 |
| MODAL-03: select de reprodutor FILTRADO POR ESPÉCIE da fêmea | ❌ | C15 |
| MODAL-03: empty state quando sem reprodutores da espécie cadastrados | ❌ | C15 |
| MODAL-03: link "Gerenciar todos os reprodutores →" no rodapé do dropdown | ❌ | C15 |
| TELA-04 Seleção Genética: nome do reprodutor como link para SUB-04 | ❌ | C15 |
| TELA-06 Relatórios: nome do reprodutor no comparativo como link para SUB-04 | ❌ | C15 |
| SUB-03 Detalhes da Inseminação: card "Reprodutor utilizado" linkável para SUB-04 | ❌ | C15 |
| Menu do avatar (Header): item "Reprodutores" adicionado | ❌ | C15 |

### Regras de negócio em cascata

| Item | Status | Commit |
|------|--------|--------|
| Bloquear exclusão de Animal vinculado a Reprodutor ativo | ✅ | C16 |
| Diálogo "Desativar reprodutor automaticamente?" ao mudar Animal para DESCARTADA | ❌ | requer status no Modal01/02 |
| Nome do Reprodutor ANIMAL_PROPRIO lê sempre de tb_animal (sincronização visual) | ✅ | C11 (mock) |
| Promoção idempotente: banner com link para perfil existente | ✅ | C14 |

---

## Próximos commits (plano restante)

| Commit | Foco |
|--------|------|
| C3 | Animais: chips, filtros, sort, edit, SUB-01 completo |
| C4 | Inseminação: abas, MODAL-03/04, SUB-03 |
| C5 | Diário: sticky, fêmea/macho, badge sanitário, exportar |
| C6 | Análise IA: aviso clínico fixo, animação, tabela reprodutores |
| C7 | Auth: /recuperar-senha, /redefinir-senha, FLUXO-07 onboarding |
| C8 | Perfil 3 abas + MODAL-11 a 15 |
| C9 | Header: seletor fazenda + FLUXO-10 |
| C10 | Empty states, banner offline, relatórios, polimento |
