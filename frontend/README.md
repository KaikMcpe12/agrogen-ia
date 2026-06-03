<div align="center">

# AgroGen IA — Frontend

**React 18 · Vite · TypeScript · PWA · Mobile-first**

</div>

---

## 📦 Tecnologias

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| [React](https://react.dev) | 18 | Interface de usuário |
| [Vite](https://vitejs.dev) | 5 | Bundler e dev server |
| [TypeScript](https://typescriptlang.org) | 5 | Tipagem estática (strict mode) |
| [Tailwind CSS](https://tailwindcss.com) | 3 | Estilização utility-first |
| [React Router](https://reactrouter.com) | v6 | Roteamento SPA |
| [TanStack Query](https://tanstack.com/query) | v5 | Cache e gerenciamento de dados assíncronos |
| [Axios](https://axios-http.com) | — | Cliente HTTP com interceptors |
| [React Hook Form](https://react-hook-form.com) | — | Gerenciamento de formulários |
| [Zod](https://zod.dev) | — | Validação de schemas e tipos |
| [Radix UI](https://radix-ui.com) | — | Primitivos acessíveis (Dialog, Tabs, Toast) |
| [Lucide React](https://lucide.dev) | — | Ícones |
| [Chart.js](https://chartjs.org) + [react-chartjs-2](https://react-chartjs-2.js.org) | — | Gráficos |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | — | Progressive Web App |
| [idb-keyval](https://github.com/jakearchibald/idb-keyval) | — | IndexedDB para queue offline |

---

## 🏗️ Arquitetura

```
frontend/
├── public/
│   └── icons/               # Ícones PWA (192x192, 512x512)
├── styles.css               # Design tokens + reset + Tailwind @layer base
├── index.html
├── vite.config.ts           # Configuração Vite + PWA plugin
├── tailwind.config.ts       # Estende tokens do styles.css
├── tsconfig.json            # strict: true
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── app/
    │   ├── providers.tsx    # QueryClient + Router + Theme + Toaster
    │   └── router.tsx       # Rotas com React.lazy (code splitting)
    ├── components/
    │   ├── ui/              # Button, Input, Card, Badge, Toast, FormField...
    │   ├── layout/          # Header, BottomNav, Drawer, Logo, SkipLink
    │   ├── modals/          # MODAL-01 a MODAL-17
    │   ├── charts/          # WeightChart, ReproductiveChart, GaugeChart
    │   └── InstallPWAPrompt.tsx
    ├── pages/
    │   ├── auth/            # Login, Cadastro, RecuperarSenha
    │   ├── dashboard/
    │   ├── animais/         # Listagem + Perfil do Animal
    │   ├── inseminacao/     # Histórico + Diagnósticos pendentes
    │   ├── ia/              # Predição, Padrões, Seleção Genética
    │   ├── diario/          # Diário de Bordo (Peso, Parição, Sanitário, Ocorrências)
    │   ├── relatorios/
    │   ├── reprodutores/    # Listagem + Perfil do Reprodutor
    │   └── perfil/          # Dados pessoais, Fazendas, Privacidade
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useTheme.ts
    │   ├── useFazendaAtiva.ts
    │   ├── useOnlineStatus.ts
    │   ├── useDebounce.ts
    │   ├── useMediaQuery.ts
    │   └── useChartTheme.ts
    ├── lib/
    │   ├── api/
    │   │   ├── client.ts         # Instância Axios única
    │   │   ├── endpoints/        # Um arquivo por domínio
    │   │   ├── mocks/            # Dados mock por domínio
    │   │   └── error-messages.ts # Códigos da API → mensagens pt-BR
    │   ├── schemas/              # Schemas Zod por entidade
    │   ├── offline/
    │   │   ├── mutationQueue.ts  # Queue em IndexedDB (idb-keyval)
    │   │   └── useQueueSync.ts   # Sincronização ao voltar online
    │   └── types/                # Tipos TypeScript das entidades
    └── ...
```

---

## 🧭 Telas e Navegação

| Rota | Tela |
|------|------|
| `/login` | Autenticação |
| `/cadastro` | Criação de conta |
| `/dashboard` | Dashboard principal (KPIs, gráfico, alertas) |
| `/animais` | Listagem do rebanho |
| `/animais/:id` | Perfil do animal (360°) |
| `/inseminacao` | Histórico + Diagnósticos pendentes |
| `/analise-ia` | Predição · Padrões · Seleção Genética |
| `/diario-de-bordo` | Diário (busca de animal) |
| `/diario-de-bordo/:id` | Diário de animal específico |
| `/reprodutores` | Catálogo de reprodutores |
| `/reprodutores/:id` | Perfil do reprodutor |
| `/relatorios` | Relatórios com exportação PDF/CSV |
| `/perfil` | Dados pessoais, Fazendas, Privacidade (LGPD) |

---

## ⚡ Rodando Localmente

### Pré-requisitos

- Node.js >= 20
- npm >= 10

### Instalação

```bash
# Entrar na pasta do frontend
cd frontend

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local
```

### Variáveis de ambiente

```env
# .env.local
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Iniciar em modo de desenvolvimento

```bash
npm run dev
# Disponível em http://localhost:5173
```

### Build de produção

```bash
npm run build
# Gera os estáticos em dist/

npm run preview
# Pré-visualizar o build localmente
```

---

## 🐳 Rodando com Docker

### Somente o frontend

```bash
docker build -t agrogen-frontend .
docker run -p 80:80 agrogen-frontend
```

### Com toda a stack (recomendado)

Na raiz do projeto:

```bash
# Sem Nginx (cada serviço na sua porta)
docker compose up -d
# Frontend em http://localhost:80

# Com Nginx (tudo em http://localhost)
docker compose -f docker-compose.nginx.yml up -d
```

---

## 📱 PWA — Instalação como App

O AgroGen IA é um **Progressive Web App** instalável em qualquer dispositivo.

**Android (Chrome):**
1. Abra o sistema no Chrome
2. Menu (⋮) → "Adicionar à tela inicial"

**iOS (Safari):**
1. Abra o sistema no Safari
2. Botão de compartilhar → "Adicionar à Tela de Início"

**Desktop (Chrome/Edge):**
1. Ícone de instalação na barra de endereço (lado direito)

> Requer HTTPS em produção. Em `localhost` funciona sem HTTPS.

### Funcionamento offline

O app opera em modo offline com dados em cache. Ações realizadas offline (cadastros, registros) ficam em fila local (IndexedDB) e são sincronizadas automaticamente ao recuperar a conexão.

---

## 🎨 Design System

Os tokens de design estão centralizados em `styles.css` na raiz do projeto:

```css
:root {
  --green-900: #1a3a18;
  --green-700: #2E5A27;   /* cor primária */
  --amber-soft: #FFF3E0;  /* destaque "IA" no logo */
  /* ... */
}

[data-theme="dark"] {
  /* tokens de dark mode */
}
```

**Tipografia:**
- Display: `Sora`
- Corpo: `Inter`
- Código / IDs: `JetBrains Mono`

**Mobile-first:** viewport mínimo de referência 375px (iPhone SE). Bottom navigation em mobile (< 768px), header horizontal em desktop.

---

## 🔧 Scripts disponíveis

```bash
npm run dev        # Servidor de desenvolvimento com HMR
npm run build      # Build de produção
npm run preview    # Preview do build
npm run lint       # ESLint
```

---

## 📄 Licença

GNU GPL v3.0 — veja [`../LICENSE`](../LICENSE)
