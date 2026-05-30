# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite + HMR)
npm run build     # Type-check then build for production
npm run lint      # ESLint checks
npm run preview   # Preview production build locally
```

## Stack

- **React 19** + **TypeScript** + **Vite 8**
- **Tailwind CSS v4** for styling (CSS variables, defined in `styles.css` at root)
- **shadcn/ui** + **Radix UI** for components (follow shadcn conventions in `src/components/ui/`)
- **react-hook-form** + **Zod v4** for all form validation
- **TanStack React Query v5** for data fetching
- **React Router v7** with lazy-loaded pages
- **Lucide React** for icons
- Path alias: `@/` → `src/`

## Skills
- em .agents/skills

## Architecture

AgroGen IA is an agricultural management system (bovino, ovino, caprino) with mock API ready for real backend integration (`VITE_USE_REAL_API=true`).

### Entry point flow

```
main.tsx → <App /> → providers.tsx (QueryClient + Toast) → ThemeInit → RouterProvider
```

- `src/main.tsx` — renders `<App />`
- `src/App.tsx` — ThemeInit effect + `<Providers><RouterProvider /></Providers>`
- `src/app/providers.tsx` — pure context providers: QueryClientProvider + ToastProvider
- `src/routes.tsx` — `createBrowserRouter` config (only exports `router`, no components)
- `src/components/layout/AppLayout.tsx` — authenticated app shell (Header + BottomNav + Outlet)

### App Shell layout pattern (IMPORTANT)

The layout uses `h-dvh flex flex-col overflow-hidden` on the root div so that only `<main>` scrolls. Header and BottomNav are natural flex siblings — they never scroll away.

```jsx
// src/components/layout/AppLayout.tsx
<div className="h-dvh flex flex-col overflow-hidden bg-bg">
  <Header />                               {/* shrink-0, no sticky needed */}
  <main className="flex-1 min-h-0 overflow-y-auto pb-6">
    <Outlet />
  </main>
  <BottomNav />                            {/* md:hidden, no fixed needed */}
</div>
```

Do NOT add `position: sticky` or `position: fixed` to Header/BottomNav — the flex shell handles positioning.

### Key directories

- `src/pages/` — Full-page components by domain (`auth/`, `animais/`, `diario/`, etc.)
- `src/components/ui/` — shadcn-generated primitives only; run `npx shadcn@latest add <component>`
- `src/components/layout/` — Header, BottomNav, AppLayout, Drawer, MobileNavDrawer, AlertDrawer
- `src/components/modals/` — Modal01–Modal10 (scoped to specific data entry workflows)
- `src/lib/api/` — Typed endpoints + axios-mock-adapter mocks
- `src/hooks/` — useDebounce, useTheme, useScrollLock, useChartTheme, useFazendaAtiva, useMediaQuery

### Form pattern

Define Zod schema → `zodResolver` in `useForm` → bind fields with `register` → display errors from `formState.errors`.

### Modal patterns (mobile-first)

**Pattern A — Full-screen on mobile (long/complex forms):** Modal01, Modal02, Modal03, Modal05, Modal08
```jsx
<div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden md:block" onClick={onClose} />
  <div className="relative bg-surface flex flex-col w-full h-full md:h-auto md:max-w-lg md:rounded-[16px] md:border md:border-line md:max-h-[90dvh] md:shadow-[var(--shadow-lg)] md:mx-4">
```

**Pattern B — Bottom Sheet on mobile (quick actions):** Modal06, Modal07, Modal09, Modal10
```jsx
<div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
  <div className="relative bg-surface w-full flex flex-col rounded-t-[24px] md:rounded-[16px] md:max-w-md md:border md:border-line md:shadow-[var(--shadow-lg)] md:mx-4 max-h-[85dvh] md:max-h-[90dvh]">
    <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
      <div className="w-10 h-1 bg-line rounded-full" /> {/* Drag handle */}
    </div>
```

Always use `useScrollLock(open)` from `src/hooks/useScrollLock.ts` at the top of every modal component to prevent body scroll while open.

### Drawer component

`src/components/layout/Drawer.tsx` supports `side="left" | "right" | "bottom"`. Use `side="bottom"` for mobile bottom sheets (e.g. BottomNav "Mais" button).

### Scrollable tab bars

For horizontal tab bars on mobile, use `overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]` on the container and `flex-shrink-0 whitespace-nowrap` on each tab button. A `.scrollbar-none::-webkit-scrollbar { display: none; }` utility is defined in `styles.css`.

### Color palette notes

- `--color-green-700` (#2d6a4f) is the correct active/primary color for nav items with white text (not green-100 which is light)
- Dark mode overrides are in `styles.css` under `[data-theme="dark"]`
- Theme is toggled via `data-theme` attribute on `document.documentElement`

## Adding shadcn components

Use `npx shadcn@latest add <component>` — do not hand-write components into `src/components/ui/`.

## Language

The project is in Portuguese (UI text, comments, task files). Keep all user-facing strings in Portuguese.
