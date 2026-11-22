# Klido Studio

**Klido Studio** is the dedicated CMS, visual website builder, and administrative dashboard for the [Klido](https://www.klido.in) digital growth and e-commerce operations agency (`klido-website`).

It enables authorized Klido administrators to visually build pages, edit structured content and design tokens, manage services, client brands, portfolio work, testimonials, media assets, navigation, SEO metadata, and publish immutable page revisions—without modifying production source code or committing to GitHub for routine updates.

---

## Dual-Repository Architecture

| Application | Repository | Domain | Hosting | Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Klido Public Website** | `kunalcodezz/Klido` (`klido-website`) | `klido.in` | Netlify | Public SSR/SPA site fetching published CMS revisions, design tokens, and dynamic collections from Supabase. |
| **Klido Studio (CMS)** | `klido-studio` (this app) | `studio.klido.in` | Netlify | Admin authentication, visual three-panel page builder, content managers, media library, SEO, drafts, and publishing. |
| **Shared Backend** | Shared Supabase Project | — | Supabase | PostgreSQL database, Auth, Row Level Security (RLS), Storage buckets, and atomic publish/revision RPCs. |

---

## Technology Stack (`klido-studio`)

- **Framework**: React 19, Vite 8, TypeScript (strict)
- **Styling & Typography**: Tailwind CSS v4 (`Montserrat` for UI/body, `Playfair Display` for editorial headings)
- **Routing & Data**: React Router, TanStack Query, Zod, React Hook Form
- **Visual Builder State & Interactions**: Zustand (with undo/redo history), `@dnd-kit`, Tiptap, Lucide React
- **Backend**: Supabase (`@supabase/supabase-js` — PostgreSQL, Auth, Storage, RLS, RPCs)

---

## Planned Folder Structure

```text
klido-studio/
├── docs/                           # Milestone documentation & audit appendices
├── supabase/
│   └── migrations/                 # Ordered SQL migrations, RLS policies, RPCs, storage policies
├── tests/                          # Unit, integration, RLS, and E2E Playwright tests
├── src/
│   ├── blocks/                     # Shared BlockRegistry, Zod schemas, PageRenderer, SectionRenderer
│   │   ├── registry.ts             # Central block definitions & metadata
│   │   ├── schemas.ts              # Zod validation schemas for blocks, styles, responsive overrides
│   │   ├── PageRenderer.tsx        # Shared CMS tree renderer (identical to public site)
│   │   ├── SectionRenderer.tsx     # Individual section wrapper with style/animation/selection hooks
│   │   └── components/             # Concrete block components (Hero, Brands, Pricing, FAQ, Layout, etc.)
│   ├── components/
│   │   ├── layout/                 # Collapsible sidebar, top bar, breadcrumbs, AuthGuard
│   │   ├── builder/                # 3-panel visual editor (Layers, Canvas, Property Inspector)
│   │   ├── media/                  # Media uploader, picker modal, usage tracker
│   │   └── ui/                     # Minimalist reusable UI primitives
│   ├── providers/                  # AuthProvider, CMSDataProvider, GlobalSettingsProvider, DesignTokenProvider
│   ├── stores/                     # Zustand editor, history (undo/redo), viewport, and UI stores
│   ├── hooks/                      # TanStack Query hooks, autosave debounce, keyboard shortcuts
│   ├── lib/                        # Supabase client, schema validators, safe style resolvers, audit logger
│   ├── pages/                      # Lazy-loaded admin routes (/login, /dashboard/*, /preview/:pageId)
│   └── types/                      # Strict TypeScript interfaces for DB tables, CMS JSON, and roles
├── .env.example
├── ARCHITECTURE.md
└── README.md
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure public Supabase credentials (never expose `SUPABASE_SERVICE_ROLE_KEY` in `VITE_*` variables):

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Public `klido-website` audit and dual-repo architecture
- [`DATABASE.md`](./DATABASE.md) — Supabase PostgreSQL schema, RPCs, and storage bucket setup
- [`SECURITY.md`](./SECURITY.md) — RBAC matrix, RLS safeguards, XSS & media upload hardening
- [`docs/KLIDO_WEBSITE_INTEGRATION.md`](./docs/KLIDO_WEBSITE_INTEGRATION.md) — Drop-in public site CMS integration guide for `kunalcodezz/Klido`
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Dual independent Netlify + Supabase production deployment runbook
- [`EDITOR.md`](./EDITOR.md) — Non-technical editor and administrator handbook

---

## Execution Milestones

- [x] **Milestone 1**: Existing `klido-website` repository audit, integration strategy, and architecture documentation (`ARCHITECTURE.md`).
- [x] **Milestone 2**: Supabase schema migrations, Auth, RBAC (`SUPER_ADMIN`, `EDITOR`, `VIEWER`), RLS policies, and Storage.
- [x] **Milestone 3**: Klido Studio shell UI, routing, protected layouts, and real database Dashboard Overview.
- [x] **Milestone 4**: CMS Zod schemas, `BlockRegistry`, `DesignTokenProvider`, and shared rendering engine.
- [x] **Milestone 5**: Three-panel Visual Website Builder (dnd-kit layers, live canvas, dynamic inspector).
- [x] **Milestone 6**: Drafts, debounced autosave, secure expiring preview, atomic publishing, and revision history.
- [x] **Milestone 7**: Content managers (Services, Portfolio, Brands, Testimonials, Navigation/Footer), Media Library, SEO, Design System.
- [x] **Milestone 8**: `klido-website` CMS integration package, end-to-end/security test suite, and independent Netlify deployment docs.

