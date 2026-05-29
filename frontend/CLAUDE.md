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
- **Tailwind CSS v4** for styling (CSS variables with oklch color space, defined in `src/index.css`)
- **shadcn/ui** + **Radix UI** for components (follow shadcn conventions in `src/components/ui/`)
- **react-hook-form** + **Zod v4** for all form validation
- **Lucide React** for icons
- Path alias: `@/` → `src/`

## Architecture

The app is an agricultural management system (AgroGen) in early development. Currently only login/register screens exist.

**Current routing**: `App.tsx` uses a `useState` toggle between login/register — not yet using `AppRoutes.tsx`. Routing via React Router is planned but not wired up.

**Key directories:**
- `src/pages/` — Full-page components, each in its own folder with co-located CSS modules and `types.ts`
- `src/components/ui/` — shadcn-generated components only; shared non-shadcn components go in `src/components/`
- `src/services/` — API and auth service stubs (`api.ts`, `authService.ts`) waiting to be implemented
- `src/types/` — Shared TypeScript types (`User.ts`, `Auth.ts`, `Api.ts`) waiting to be filled

**Form pattern** (see `src/pages/Login/Login.tsx`): define a Zod schema, pass it to `zodResolver` in `useForm`, bind fields with `register`, display errors from `formState.errors`.

**Adding shadcn components**: use `npx shadcn@latest add <component>` — do not hand-write components into `src/components/ui/`.

## Language

The project is in Portuguese (UI text, comments, task files). Keep all user-facing strings in Portuguese.
