# Autoffer Web — Frontend

A modern, production‑ready **React + TypeScript** frontend powered by **Vite** and **Tailwind CSS v4** with a reusable UI kit (shadcn/ui + Radix), client‑side routing, and rich, desktop‑style workflows (catalog, cart, dashboard, reports, PDF export, and chat windows).

> ✨ This README intentionally focuses **only on the frontend**: how it’s built, how to run it locally, and how the UI is organized.

---

## Tech Stack

- **Build & Dev:** Vite  + React 19 + TypeScript 5
- **Styling:** Tailwind CSS v4, utility‑first with design tokens defined in `src/index.css`
- **UI Components:** shadcn/ui (Radix primitives), lucide‑react icons
- **Routing:** React Router
- **Data & State:** TanStack Query (client caching), lightweight React Contexts (`CartContext`, `ChatContext`)
- **PDF Export:** jsPDF + html2canvas
- **Linting:** ESLint 9 + TypeScript ESLint
- **Aliases:** `@/* → src/*` (configured in `tsconfig.json` and `vite.config.ts`)

---

## Quick Start

### Prerequisites
- **Node.js 20+** (recommended) and **npm 10+**

### Install
```bash
npm install
```

### Run (development)
```bash
npm run dev
```
By default, the dev server runs on **http://localhost:5173** (see `vite.config.ts`).

### Build (production)
```bash
npm run build
```

### Preview (serve the built assets locally)
```bash
npm run preview
```

No additional environment variables are required for basic UI boot and navigation.

---

## Project Structure (frontend‑only)

```
autofferWeb/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  public/
  src/
    assets/            # Static assets and images
    components/        # Reusable UI + feature components
    components/ui/     # shadcn/ui primitives (button, card, toast, etc.)
    context/           # React Contexts (cart, chat)
    lib/               # Utilities
    pages/             # Route-level pages (Index, Home, NotFound)
    services/          # Frontend-only services and adapters
    App.tsx            # Providers, routes, shells
    main.tsx           # App bootstrap
    index.css          # Tailwind v4 layers + design tokens
```

> Path alias: import with `@/` (e.g., `import Button from "@/components/ui/button"`).

---

## Core Features

### 🔐 Authentication (UI)
- `Index` page with login and banner.
- Redirects authenticated users to the dashboard.
- **ProtectedRoute** component wraps pages that require access control.

### 🧭 Application Shell
- **NavBar** with quick navigation between **Home**, **Catalog**, **Operations**, **My Account**, and **My Projects**.
- **TooltipProvider**, toasts, and a global **Chat** surface for a desktop-like experience.

### 🛒 Catalog & Cart
- Product gallery with supplier filter and search term matching.
- **ProductDetailsDialog** to inspect items and add them to the cart.
- **CartDialog** shows items, per‑item removal, clear‑cart, and a running total.
- Cart state is managed by `CartContext` (simple, predictable, and typed).

### 📁 Projects
- **MyProjects** component lists projects and lets users jump into relevant flows.
- Designed to work with the other modules (catalog, operations) for end‑to‑end workflows.

### 🧮 Operations & Reports
- Ready‑made dialogs for report generation:
  - **Profit/Loss Report**
  - **Glazing Report**
  - **Time Period Report**
  - **Manual Price Offer**
- Each dialog renders a print‑ready layout and supports **PDF export** via jsPDF + html2canvas.

### 💬 Chat Windows (UI)
- Customer list and floating chat windows, powered by `ChatContext` state.
- Optimized for multitasking while navigating other sections of the app.

### 🖼️ Home Dashboard
- Welcome hero, spotlight carousel, quick actions, and a showcase section for aluminum projects.

---

## Styling & Design System

- **Tailwind v4** with layered imports:
  ```css
  @import "tailwindcss/theme.css" layer(theme);
  @import "tailwindcss/preflight.css" layer(base);
  @import "tailwindcss/utilities.css" layer(utilities);
  ```
- Theme tokens (colors, foreground/background, etc.) are defined in `src/index.css` using CSS variables.
- Base components are built from **shadcn/ui** (Radix under the hood) for accessible, consistent UI.

---

## Scripts

- `npm run dev` – local development with hot reload
- `npm run build` – type‑check and build for production
- `npm run preview` – preview built assets
- `npm run lint` – lint the codebase

---

## Coding Notes

- **TypeScript‑first:** Strong typing across components, contexts, and services.
- **React Query:** Co-locates data hooks per feature for predictable and declarative fetching/caching.
- **File Naming:** Components use `PascalCase.tsx`; utilities and hooks use `camelCase.ts`.
- **Imports:** Prefer `@/` alias to avoid long relative paths.

---

## Where to Look (by feature)

- **Routing shell:** `src/App.tsx`
- **Auth UI:** `src/pages/Index.tsx`, `src/components/LoginForm.tsx`, `src/components/ProtectedRoute.tsx`
- **Dashboard:** `src/pages/Home.tsx`, `src/components/NavBar.tsx`
- **Catalog & Cart:** `src/components/Catalog.tsx`, `src/components/ProductDetailsDialog.tsx`, `src/components/CartDialog.tsx`, `src/context/CartContext.tsx`
- **Projects:** `src/components/MyProjects.tsx`
- **Operations/Reports:** `src/components/*ReportDialog.tsx`, `src/components/ManualPriceOfferDialog.tsx`
- **Chat:** `src/components/Chat.tsx`, `src/context/ChatContext.tsx`
- **UI primitives:** `src/components/ui/*`

---

## Contributing

1. Create a new branch for your change.
2. Run `npm run lint` and address any issues.
3. Commit using clear messages (e.g., `feat(catalog): add supplier filter`).
4. Open a PR.

---

© 2025 Autoffer Web — Frontend
