# Prompt para Claude — Design Completo da Plataforma de Inseminação Artificial com IA

---

## CONTEXTO DO PROJETO

Crie o design completo e funcional (HTML + CSS + JS em um único arquivo) de uma **plataforma web responsiva** chamada **AgroGen IA** — um sistema de coleta de dados genéticos e monitoramento de inseminação artificial em bovinos, ovinos e caprinos, com uso de Inteligência Artificial.

O sistema foi desenvolvido para o **Hackathon Expoagro Crateús 2026**, promovido pela Prefeitura Municipal de Crateús – CE. O público-alvo são **técnicos agropecuários e produtores rurais do sertão cearense**, que precisam de uma interface acessível, clara e funcional — inclusive via dispositivos móveis com conexão instável.

---

## IDENTIDADE VISUAL E ESTILO

- **Tema:** Agroindustrial moderno. Rústico-tecnológico. Mistura o campo com dados e IA.
- **Paleta principal:** Verde-escuro do sertão (`#1B4332`), terra seca (`#8B5E3C`), bege areia (`#F5EFE6`), branco limpo (`#FAFAFA`), e acento âmbar/dourado (`#D4A017`) para IA e destaques.
- **Tipografia:** Fonte display robusta para títulos (ex: `Sora`, `DM Sans Bold`, ou `Familjen Grotesk`); fonte legível para corpo (ex: `Inter`, `IBM Plex Sans`). Importar via Google Fonts.
- **Componentes:** Cards com cantos arredondados suaves, bordas sutis, sombras leves. Badges coloridos por espécie. Botões sólidos com hover animado.
- **Modo:** Tema claro por padrão com opção de escuro (toggle no header).
- **Ícones:** Use Lucide Icons via CDN ou emojis de fallback.

---

## ARQUITETURA DE PÁGINAS

O sistema é uma **Single Page Application (SPA)** simulada via JavaScript, com navegação entre seções sem recarregar a página. Implemente um **sistema de rotas simples** via `hashchange` ou variável de estado JS.

### Páginas obrigatórias:

1. **Login / Cadastro**
2. **Dashboard Principal**
3. **Módulo: Animais** (listagem + cadastro)
4. **Módulo: Inseminação** (registro de evento)
5. **Módulo: Análise com IA**
6. **Módulo: Relatórios**
7. **Perfil do Produtor**

---

## PÁGINA 1 — LOGIN / CADASTRO

### Layout:
- Tela dividida: lado esquerdo com imagem/ilustração do sertão (use um gradiente verde-terra com texto motivacional), lado direito com formulário.
- Em mobile: apenas o formulário ocupa a tela inteira.

### Fluxo:
- Toggle entre **"Entrar"** e **"Criar conta"** (transição suave com CSS).
- Formulário de login: campos `E-mail` e `Senha` + botão "Entrar".
- Formulário de cadastro: campos `Nome completo`, `CPF`, `E-mail`, `Telefone`, `Tipo de usuário` (dropdown: Produtor Rural / Técnico Agropecuário / Veterinário), `Senha`, `Confirmar senha`.
- Validação inline nos campos (borda vermelha + mensagem de erro ao perder foco).
- Botão "Entrar" faz login simulado (qualquer e-mail/senha válidos) e redireciona ao Dashboard.
- Link "Esqueci minha senha" (abre modal simples com campo de e-mail).

### Estado salvo:
- Após login, salve `{ nome, tipo, email }` em variável JS global `currentUser`.
- Exiba o nome do usuário logado no header de todas as páginas seguintes.

---

## HEADER GLOBAL (visível em todas as páginas após login)

### Conteúdo:
- Logo: ícone de DNA/folha + texto **"AgroGen IA"** à esquerda.
- Menu de navegação (horizontal em desktop, hambúrguer em mobile) com links: Dashboard · Animais · Inseminação · Análise IA · Relatórios.
- À direita: toggle dark/light mode + avatar do usuário com dropdown (nome + "Sair").

### Comportamento:
- Item ativo no menu tem destaque visual (borda inferior verde ou fundo suave).
- Em mobile: menu lateral (drawer) que abre com animação slide.

---

## PÁGINA 2 — DASHBOARD PRINCIPAL

### Layout: grid de cards + gráfico central.

### Cards de resumo (linha superior, 4 cards):
1. **Total de animais cadastrados** — número grande + ícone de animal + breakdown por espécie (ex: "32 bovinos · 18 ovinos · 12 caprinos").
2. **Inseminações este mês** — número + comparativo com mês anterior (ex: "▲ 12% vs mês anterior").
3. **Taxa média de prenhez (IA)** — percentual em destaque com badge colorido (verde se >60%, amarelo se 40-60%, vermelho se <40%).
4. **Alertas ativos** — número de animais em período de observação pós-inseminação.

### Gráfico central:
- Gráfico de barras simples (usando `<canvas>` com Chart.js via CDN) mostrando inseminações por mês nos últimos 6 meses, com linha de taxa de prenhez sobreposta.
- Legenda: Inseminações (barras verdes) + Taxa de prenhez (linha âmbar).
- Título: "Desempenho reprodutivo — últimos 6 meses".

### Lista de atividades recentes (lado direito ou abaixo do gráfico):
- Timeline de últimas 5 ações realizadas no sistema (ex: "Cadastrou Mimosa — Nelore fêmea", "Inseminação registrada — Lote B3", "IA analisou rebanho Fazenda Boa Esperança").
- Cada item com ícone colorido por tipo, nome da ação, e data/hora relativa (ex: "há 2 horas").

### Alertas de ciclo reprodutivo:
- Tabela compacta mostrando animais que devem ser verificados nos próximos 7 dias (diagnóstico de gestação previsto).
- Colunas: Animal · Espécie · Data da inseminação · Dias decorridos · Ação (botão "Ver").

---

## PÁGINA 3 — MÓDULO: ANIMAIS

### Sub-seções: Listagem e Cadastro (toggle entre as duas).

### 3A — Listagem de animais:

#### Filtros no topo:
- Barra de busca por nome ou identificador.
- Dropdown: filtrar por espécie (Todos / Bovinos / Ovinos / Caprinos).
- Dropdown: filtrar por sexo (Todos / Macho / Fêmea).
- Dropdown: filtrar por raça.
- Botão "Cadastrar animal" (abre o formulário de cadastro).

#### Tabela/cards de animais:
- Em desktop: tabela com colunas: `ID` · `Nome` · `Espécie` · `Raça` · `Sexo` · `Linhagem` · `Histórico Reprodutivo` · `Ações`.
- Em mobile: cards empilhados, cada um mostrando nome, espécie (badge colorido), raça e botão de ações.
- Badges de espécie coloridos: Bovinos = verde-escuro · Ovinos = azul · Caprinos = terra.
- Ações por animal: botões "Ver detalhes" · "Registrar inseminação" · "Editar" · "Excluir".
- Paginação simples (10 animais por página).

#### Dados de exemplo pré-carregados (array JS com ao menos 12 animais fictícios):
```
[
  { id: "BOV-001", nome: "Mimosa", especie: "Bovino", raca: "Nelore", sexo: "Fêmea", linhagem: "Linhagem A", historico: "2 partos", status: "Em observação" },
  { id: "BOV-002", nome: "Trovão", especie: "Bovino", raca: "Angus", sexo: "Macho", linhagem: "Linhagem B", historico: "Reprodutor", status: "Ativo" },
  { id: "OVI-001", nome: "Faísca", especie: "Ovino", raca: "Santa Inês", sexo: "Fêmea", linhagem: "Linhagem C", historico: "1 parto", status: "Prenha" },
  { id: "CAP-001", nome: "Serena", especie: "Caprino", raca: "Anglo Nubiana", sexo: "Fêmea", linhagem: "Linhagem D", historico: "3 partos", status: "Ativo" },
  // ... mais 8 animais variados
]
```

### 3B — Cadastro / Edição de animal:

#### Formulário com campos agrupados em seções:

**Identificação:**
- ID (gerado automaticamente, editável): `BOV-XXX`, `OVI-XXX`, `CAP-XXX`.
- Nome do animal.
- Espécie (radio buttons grandes e visuais: 🐄 Bovino / 🐑 Ovino / 🐐 Caprino).
- Raça (dropdown dinâmico conforme espécie selecionada):
  - Bovinos: Nelore, Angus, Girolando, Gir, Brahman, Sindi, Guzerá, Outro.
  - Ovinos: Santa Inês, Dorper, Morada Nova, Texel, Somalis, Outro.
  - Caprinos: Anglo Nubiana, Saanen, Toggenburg, Boer, Moxotó, Outro.
- Sexo (Macho / Fêmea — toggle visual).
- Data de nascimento (date picker).
- Peso atual (kg).
- Identificação no brinco/tatuagem.

**Dados Genéticos:**
- Linhagem/Genealogia (campo texto).
- Pai (busca por ID de animal cadastrado ou texto livre).
- Mãe (idem).
- DEP — Diferença Esperada na Progênie (campo opcional, numérico, tooltip explicativo).
- Certificado de registro genético (upload simulado — botão que exibe nome do arquivo).
- Observações genéticas (textarea).

**Histórico Reprodutivo:**
- Número de partos/crias anteriores.
- Data do último parto.
- Última inseminação (data + resultado — sucesso/falha — preenchido automaticamente se houver registros).
- Status reprodutivo atual (dropdown: Ativa · Prenha · Em repouso · Descartada · Reprodutor ativo).

**Botões:** "Salvar animal" (verde) · "Cancelar" (cinza) · "Salvar e registrar inseminação" (âmbar).

#### Validações:
- Espécie e raça obrigatórias.
- Data de nascimento não pode ser futura.
- Peso deve ser número positivo.
- Ao salvar: adiciona ao array JS global `animais[]` e redireciona para a listagem com notificação toast de sucesso.

---

## PÁGINA 4 — MÓDULO: INSEMINAÇÃO

### Fluxo completo de registro de evento de inseminação:

#### Passo 1 — Selecionar animal:
- Campo de busca com autocomplete (busca no array `animais[]`).
- Card do animal selecionado exibe: nome, espécie, raça, último ciclo, status atual.
- Aviso visual se animal já tiver inseminação recente (menos de 21 dias — bovinos, 17 dias — ovinos/caprinos).

#### Passo 2 — Dados do reprodutor/sêmen:
- Tipo de inseminação: IA Convencional / IA em Tempo Fixo (IATF) / Transferência de Embrião.
- Reprodutor: busca no cadastro de machos OU entrada manual de "sêmen externo" (com campos: Touro/Carneiro/Bode, Raça, Registro, Empresa fornecedora, Dose número).
- Palheta/lote: campo texto.
- Técnico responsável: dropdown com técnicos cadastrados + opção "Eu mesmo".

#### Passo 3 — Dados do evento:
- Data e hora da inseminação.
- Fase do cio / protocolo hormonal utilizado (texto livre).
- Condição corporal da fêmea no momento (escala 1-5, slider visual).
- Temperatura ambiente (°C).
- Observações do técnico (textarea).

#### Passo 4 — Confirmação:
- Resumo de todos os dados em um card de revisão.
- Botão "Confirmar e salvar" → salva em array JS `inseminacoes[]` e redireciona ao Dashboard com toast de sucesso.
- Botão "Editar" (volta ao passo correspondente).

#### Histórico de inseminações:
- Abaixo do formulário (ou em tab separada): tabela com todos os eventos registrados.
- Colunas: Animal · Espécie · Reprodutor · Data · Técnico · Status (Aguardando diagnóstico / Prenha / Falha).
- Botão "Registrar diagnóstico" por linha (abre modal com resultado: Prenha / Não prenha + data do diagnóstico).

---

## PÁGINA 5 — MÓDULO: ANÁLISE COM IA

> Esta é a página mais importante do sistema. Deve ser visualmente impactante e transmitir confiança tecnológica.

### Três análises disponíveis (tabs ou cards selecionáveis):

---

### 5A — Predição de Taxa de Prenhez

**Objetivo:** Estimar a probabilidade de sucesso de uma inseminação com base nos dados do animal e histórico.

**Interface:**
- Seletor de animal (autocomplete).
- Exibe automaticamente: histórico de inseminações, taxa histórica do animal, condição corporal média, raça.
- Botão "Analisar com IA" → exibe um loader animado (spinner + texto "Processando dados genéticos...") por 2-3 segundos → resultado.

**Resultado exibido:**
- Gauge/medidor circular grande mostrando a probabilidade (ex: 74%).
- Interpretação: "Alta probabilidade de sucesso" (verde ≥65%) / "Probabilidade moderada" (amarelo 40-64%) / "Baixa probabilidade — avalie o protocolo" (vermelho <40%).
- Fatores que mais influenciaram (lista com ícones): ✅ Histórico positivo de 3 prenhezes · ✅ Boa condição corporal (4/5) · ⚠️ Intervalo curto desde última inseminação · ✅ Raça com alta fertilidade na região.
- Recomendações do sistema (texto em card âmbar): "Considere aguardar mais 15 dias para o próximo ciclo" ou "Protocolo IATF recomendado para esta matriz".

**Lógica JS da IA (simulada):**
```javascript
function preverPrenhez(animal, inseminacoes) {
  let score = 50; // base
  const historicoAnimal = inseminacoes.filter(i => i.animalId === animal.id);
  const taxaHistorica = historicoAnimal.length > 0
    ? historicoAnimal.filter(i => i.resultado === 'Prenha').length / historicoAnimal.length
    : 0.5;
  score += taxaHistorica * 30;
  if (animal.condicaoCorporal >= 4) score += 10;
  if (animal.condicaoCorporal <= 2) score -= 15;
  const racasFerteis = ['Nelore', 'Gir', 'Santa Inês', 'Anglo Nubiana'];
  if (racasFerteis.includes(animal.raca)) score += 8;
  // Intervalo desde última inseminação
  const ultimaIns = historicoAnimal.sort((a,b) => new Date(b.data)-new Date(a.data))[0];
  if (ultimaIns) {
    const diasDesde = (Date.now() - new Date(ultimaIns.data)) / 86400000;
    if (diasDesde < 21 && animal.especie === 'Bovino') score -= 20;
    if (diasDesde > 60) score += 5;
  }
  return Math.min(95, Math.max(5, Math.round(score)));
}
```

---

### 5B — Identificação de Padrões de Fertilidade

**Objetivo:** Analisar o rebanho inteiro e encontrar padrões que explicam sucesso ou falha.

**Interface:**
- Seletor de rebanho/lote (dropdown com grupos cadastrados) ou "Todo o rebanho".
- Período de análise (últimos 3/6/12 meses — radio buttons).
- Botão "Gerar análise" → loader → resultados.

**Resultado exibido:**
- Gráfico de barras: taxa de prenhez por raça (Chart.js).
- Gráfico de linha: evolução da taxa de prenhez por mês.
- Cards de insight:
  - "Melhores meses para inseminação: Maio–Julho" (baseado em dados históricos).
  - "Raça com maior taxa: Nelore (78%)" / "Raça com menor taxa: Angus (52%) — possível inadaptação climática".
  - "Condição corporal ideal identificada: entre 3,5 e 4,5".
  - "Técnico com melhor taxa de sucesso: João Silva (82%)".
- Tabela com ranking de matrizes por taxa de sucesso histórica.

---

### 5C — Recomendação de Seleção Genética

**Objetivo:** Recomendar quais matrizes cruzar com quais reprodutores para maximizar qualidade genética da próxima geração.

**Interface:**
- Objetivo do cruzamento (checkboxes múltiplos): Ganho de peso · Precocidade · Resistência ao calor · Qualidade do leite · Prolificidade · Tamanho da carcaça.
- Fêmeas disponíveis (multi-select com busca — filtra por espécie e status "Ativa").
- Reprodutores disponíveis (machos cadastrados OU banco de sêmen externo).
- Botão "Gerar recomendações" → loader → resultado.

**Resultado exibido:**
- Tabela de cruzamentos recomendados: Matriz · Reprodutor recomendado · Score genético estimado · Justificativa.
- Cruzamentos a evitar (consanguinidade detectada): listados em vermelho com explicação.
- Card de alerta se poucos reprodutores cadastrados: "Amplie a variabilidade genética — considere sêmen externo de touros provados".

---

## PÁGINA 6 — MÓDULO: RELATÓRIOS

### Interface:

#### Filtros (painel lateral ou linha de filtros no topo):
- Tipo de relatório (dropdown):
  - Desempenho reprodutivo geral
  - Desempenho por espécie
  - Desempenho por técnico
  - Histórico individual de animal
  - Análise genética do rebanho
- Espécie: Todos / Bovinos / Ovinos / Caprinos.
- Período: data inicial → data final (date pickers).
- Produtor/Fazenda (se multi-fazenda).
- Botão "Gerar relatório" (verde) · "Exportar PDF" (âmbar) · "Exportar CSV" (cinza).

#### Relatório gerado (exibido abaixo dos filtros):

**Cabeçalho do relatório:**
- Logo AgroGen IA + nome da fazenda/produtor + período + data de geração.

**Resumo executivo (4 métricas em destaque):**
- Total de inseminações no período.
- Taxa geral de prenhez.
- Número de nascimentos esperados.
- Custo médio estimado por prenhez (campo de custo por dose de sêmen — editável).

**Tabela detalhada:**
- Colunas: Animal · Espécie · Raça · Data inseminação · Reprodutor · Técnico · Resultado · Observações.
- Linhas com status colorido (verde = prenha, vermelho = falha, amarelo = aguardando).

**Gráficos:**
- Pizza: distribuição de resultados (prenha / falha / aguardando).
- Barras: taxa de prenhez por raça.

**Rodapé:**
- Assinatura digital simulada + aviso de conformidade LGPD: "Dados tratados conforme Lei nº 13.709/2018".

#### Exportação simulada:
- Botão "Exportar PDF": abre `window.print()` estilizado (CSS `@media print` que mostra apenas o relatório).
- Botão "Exportar CSV": gera e faz download de um arquivo `.csv` com os dados da tabela.

---

## PÁGINA 7 — PERFIL DO PRODUTOR

### Dados do perfil:
- Avatar circular com iniciais do nome.
- Nome, CPF (mascarado: `***.***.***/XX`), e-mail, telefone.
- Tipo de usuário (badge: Produtor / Técnico / Veterinário).
- Fazenda(s) associada(s): lista com nome, município, área (ha), espécies criadas.

### Configurações:
- Alterar senha (formulário inline com validação).
- Preferências de notificação (toggles: alertas de ciclo · diagnósticos vencidos · novos resultados de IA).
- Tema (light/dark mode).

### Dados LGPD:
- Seção "Meus dados": botão "Solicitar exportação dos meus dados" (simula download JSON) · botão "Solicitar exclusão da conta" (abre modal de confirmação com aviso).

---

## ESTADO GLOBAL DA APLICAÇÃO (JavaScript)

Implemente um objeto global `AppState` que persiste os dados durante a sessão:

```javascript
const AppState = {
  currentUser: null,       // { nome, email, tipo }
  animais: [...],          // array de animais (pré-populado com exemplos)
  inseminacoes: [...],     // array de eventos de inseminação
  reproducoes: [...],      // resultados de diagnóstico
  currentPage: 'login',   // página ativa
  darkMode: false,
  
  // Métodos
  adicionarAnimal(animal) { ... },
  registrarInseminacao(evento) { ... },
  calcularTaxaPrenhez(filtros) { ... },
  getAnimaisPorEspecie(especie) { ... },
};
```

---

## COMPONENTES REUTILIZÁVEIS

Implemente como funções JS que retornam HTML string ou manipulam o DOM:

- `renderToast(mensagem, tipo)` — notificação flutuante (sucesso/erro/aviso) que desaparece após 3 segundos.
- `renderModal(titulo, conteudo, onConfirm)` — modal genérico com overlay.
- `renderBadgeEspecie(especie)` — badge colorido por espécie.
- `renderLoader(texto)` — spinner com texto de carregamento.
- `renderGraficoBarras(canvas, labels, data, titulo)` — wrapper Chart.js.
- `renderGaugePrenhez(percentual)` — medidor circular SVG animado.

---

## REQUISITOS TÉCNICOS

- **Arquivo único:** Todo o código em um único `.html` com CSS e JS internos.
- **Zero dependências de backend:** toda lógica roda no cliente com arrays JS.
- **CDN permitidos:**
  - Chart.js: `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js`
  - Lucide Icons: `https://unpkg.com/lucide@latest`
  - Google Fonts (para as fontes escolhidas)
- **Responsividade obrigatória:** funcionar bem em 375px (mobile) e 1280px (desktop).
- **Acessibilidade básica:** labels em todos os inputs, contraste adequado, navegação por teclado no menu.
- **Licença:** GNU GPL v3.0 (incluir comentário no topo do arquivo).
- **LGPD:** rodapé de todas as páginas com aviso de tratamento de dados.

---

## DADOS FICTÍCIOS PRÉ-CARREGADOS

Inclua no array `AppState.animais` ao menos 15 animais das 3 espécies, e no array `AppState.inseminacoes` ao menos 20 eventos distribuídos nos últimos 6 meses, com resultados variados (prenha / falha / aguardando), para que todos os gráficos e análises de IA tenham dados para exibir desde o primeiro acesso.

---

## ENTREGÁVEL ESPERADO

Um único arquivo `index.html` completo, autocontido, que ao abrir em qualquer navegador moderno:

1. Exibe a tela de login.
2. Após login (qualquer credencial), mostra o dashboard com dados e gráficos.
3. Permite navegar por todas as 6 páginas funcionais.
4. Permite cadastrar animais, registrar inseminações, rodar as 3 análises de IA e gerar relatórios.
5. É visualmente coerente, agradável e profissional em desktop e mobile.
