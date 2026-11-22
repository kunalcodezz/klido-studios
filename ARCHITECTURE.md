# Klido Studio — Architecture & `klido-website` Audit Report

**Milestone 1 Deliverable**  
**Audited Public Repository**: `https://github.com/kunalcodezz/Klido.git` (read-only audit; zero files modified in public repo)

---

## Part 1: Existing `klido-website` Repository Audit

### 1. Current Folder Structure

```text
Klido/
├── .env.example                    # EmailJS env vars (VITE_EMAILJS_*) + GEMINI_API_KEY, APP_URL
├── .gitignore
├── README.md
├── bun.lock / package-lock.json
├── index.html                      # Static meta, canonical, OG/Twitter, Schema.org JSON-LD, Google Fonts
├── metadata.json                   # Studio metadata
├── package.json                    # React 19, Vite 8, Tailwind v4, react-router-dom v7, @emailjs/browser, lucide-react, motion
├── tsconfig.json
├── vite.config.ts
├── public/
│   ├── assets/images/              # Duplicate copy of src/assets/images/* + process/step-01..05.jpg
│   ├── apple-touch-icon.png, favicon-*.png, favicon.ico, favicon.png
│   ├── klido_Logo.png              # 1.1 MB root logo referenced by OG/JSON-LD
│   ├── robots.txt                  # Allows all + Googlebot-Image; references sitemap.xml
│   └── sitemap.xml                 # Lists /, /#services, /#approach, /#pricing, /#contact (hash URLs)
└── src/
    ├── App.tsx                     # BrowserRouter, ScrollManager, Skip link, Header, Routes, Footer, NotFoundPage
    ├── main.tsx                    # React createRoot entry
    ├── index.css                   # Tailwind v4 @import, CSS custom properties, typography utilities, grid paper, reduced-motion
    ├── vite-env.d.ts
    ├── assets/images/              # Bundled image assets (Hashi.png, Klido_Logo.png, Saanjh by riya.png, ZEGORE.png, klidodesk.png/.jpg, process/)
    ├── data/
    │   └── klidoData.ts            # PRACTICE_AREAS, ARCHITECTURE_MODULES, AUDIT_DOMAINS, OPERATING_BOUNDARIES, CLIENT_BRANDS, STUDIO_IMAGES
    ├── pages/
    │   ├── HomePage.tsx
    │   ├── ServicesPage.tsx
    │   ├── ApproachPage.tsx
    │   ├── AboutPage.tsx
    │   └── ContactPage.tsx
    └── components/
        ├── Header.tsx              # Exported KlidoMark + sticky morphing pill Header + mobile drawer
        ├── Footer.tsx              # 3-column footer (Practice, Engage, Contact) + KlidoMark
        ├── CampaignMap.tsx         # Interactive 3-stage strategy diagram in HomePage Hero
        ├── BrandsSection.tsx       # Asymmetric brand showcase grid (HashiBusiness, Saanjh by Riya, Zegore)
        ├── SeniorStudioSection.tsx # Split desk photo + "A small, senior studio" checklist
        ├── PricingSection.tsx      # 5-plan asymmetric grid (4 individual + featured Growth Bundle) + 6-item bottom highlights
        ├── HowWeWorkSection.tsx    # Sticky intro + 5-step vertical timeline with process card images
        ├── ContactSection.tsx      # Contact details + InteractiveGlobe + EmailJS two-way lead form
        ├── FAQSection.tsx          # Sticky intro + direct inquiry card + 7-item accordion
        ├── InteractiveGlobe.tsx    # HTML5 <canvas> interactive drag-to-spin dotted 3D globe with hub markers
        ├── ScopePlanner.tsx        # Interactive scope builder (business model, bottleneck, channels, cadence) -> navigates to /contact
        ├── ProjectBriefSection.tsx # Alternate detailed brief form component (types used by ContactSection)
        └── ResilientImage.tsx      # <figure> image wrapper with graceful error fallback placeholder
```

---

### 2. Existing Routes & Navigation

**Routes (`src/App.tsx`)**:
- `/` → `HomePage`
- `/services` → `ServicesPage`
- `/approach` → `ApproachPage`
- `/about` → `AboutPage`
- `/contact` → `ContactPage` (receives optional `location.state`: `{ scope?: ScopeTransferState, selectedPlan?: SelectedPlanState }`)
- `*` → `NotFoundPage` (inline 404 component in `App.tsx`)

**Navigation (`src/components/Header.tsx`)**:
- Brand link: `KlidoMark` (`/` + smooth scroll to top)
- `NAV_ITEMS`:
  1. `Services` → `/` (active when `/` with no hash OR `/services`)
  2. `Approach` → `/#how-we-work`
  3. `Studio` → `/about`
  4. `Work` → `/#work`
  5. `Pricing` → `/#pricing`
- Primary Header CTA: `Start a project` → `/contact`

**Footer (`src/components/Footer.tsx`)**:
- Brand description + `KlidoMark`
- Column 1 (`Practice`): `Services` (`/services`), `Approach` (`/approach`), `Studio` (`/about`), `Work` (`/#work`)
- Column 2 (`Engage`): `Service Plans` (`/#pricing`), `FAQ` (`/#faq`), `Scope Planner` (`/services#scope-planner`), `Audit Standards` (`/approach#audit-matrix`), `Start a project` (`/contact`)
- Column 3 (`Contact`): `mailto:klidoagency@gmail.com`, `Mon–Fri, 09:00–18:00`, `Remote Worldwide`

---

### 3. Page & Section Breakdown

1. **`HomePage.tsx`** (7 sequential sections):
   - **Hero (`HomePage.tsx`)**: Eyebrow (`YOUR PARTNER IN DIGITAL GROWTH`), headline with cobalt blue accent & hand-drawn lime SVG underline (`brands people remember.`), subtitle, dual CTAs (`Tell us what you're building` → `#start-project`, `See how we work` → `/approach`), and right-column `<CampaignMap />`.
   - **Brands (`BrandsSection.tsx`, `#work`)**: Section header + asymmetric showcase for **HashiBusiness** (ops), **Saanjh by Riya** (social, ops, influencer + Instagram CTA), and full-width **Zegore** row. *(Note: hardcodes JSX cards rather than reading `CLIENT_BRANDS` from `klidoData.ts`.)*
   - **Senior Studio (`SeniorStudioSection.tsx`)**: Ambient lime/cobalt corner glows, left `ResilientImage` (`brandDesk`), right headline with lime SVG underline (`challenge it.`), editorial paragraph, and 3-item checklist.
   - **Pricing (`PricingSection.tsx`, `#pricing`)**: 5 service plans (`Meta Ads`, `Influencer Marketing`, `Social Media`, `Business Operations`, and featured dark-gradient `Growth Bundle` with `"MOST POPULAR"` badge) + 6-item trust/highlight grid. Clicking a plan invokes `onSelectPlan` and smoothly scrolls to `#start-project`.
   - **How We Work (`HowWeWorkSection.tsx`, `#how-we-work`)**: Sticky left header + 5-step vertical timeline (`01 Discovery & Audit` through `05 Optimization & Growth`) with process step images.
   - **Contact (`ContactSection.tsx`, `#start-project`)**: Left column with email, phone (`+91 9172569021`), Instagram (`@klidoagency`), and `<InteractiveGlobe />`; right column with validated EmailJS inquiry form.
   - **FAQ (`FAQSection.tsx`, `#faq`)**: Sticky left column with "Still have questions?" CTA card + right column 7-item accordion.

2. **`ServicesPage.tsx`** (`/services`):
   - Split header (`STUDIO_IMAGES.strategyDesk` + CTA to `#scope-planner` & `/approach`)
   - Numbered breakdown of `PRACTICE_AREAS` (`01.` Paid Search & Social Acquisition, `02.` Technical & Editorial SEO, `03.` Conversion Architecture & Landing Systems, `04.` Measurement & Attribution Infrastructure)
   - `<ScopePlanner />` (`#scope-planner`)

3. **`ApproachPage.tsx`** (`/approach`):
   - Header + `TIMELINE_PHASES` (3-column 90-day roadmap)
   - Interactive `#audit-matrix` (4 domain tabs from `AUDIT_DOMAINS` + expandable diagnostic check accordions)
   - `OPERATING_BOUNDARIES` comparison table (`Klido Standard` vs `What We Avoid`)

4. **`AboutPage.tsx`** (`/about`):
   - Studio intro + `ResilientImage` (`STUDIO_IMAGES.studioInterior`)
   - 3 `OPERATING_PRINCIPLES`
   - `<BrandsSection />`
   - 4 `STUDIO_DISCIPLINES` directory + CTA

5. **`ContactPage.tsx`** (`/contact`):
   - Renders `<ContactSection id="contact" selectedPlan={routeState?.selectedPlan} initialScope={routeState?.scope} />`

---

### 4. Visual Identity, Fonts, Palette & Responsive Rules

- **Fonts (`index.html` & `src/index.css`)**:
  - Body/UI: `'DM Sans'`
  - Headings (`.font-display`, `h1–h4`): `'Plus Jakarta Sans'`
  - Tabular numbers / indices (`.font-mono-tabular`): `'JetBrains Mono'`
- **Color Palette (`src/index.css` + components)**:
  - `--bg-canvas`: `#FFFFFF`
  - `--bg-subtle`: `#F7F9FE` (also `#FAFBFD`, `#FAFBFF`, `#F5F7FC`)
  - `--ink-primary`: `#0D1126` (and `#101735`)
  - `--ink-secondary`: `#4A5268`
  - `--ink-muted`: `#6B7388` (and `#8C95A8`)
  - `--border-hairline`: `#E5E9F2`
  - `--border-strong`: `#CFD6E6`
  - `--accent-primary`: `#123FFF` (and `#2457FF` in Contact/Pricing)
  - `--accent-hover`: `#0D31CC`
  - `--accent-subtle`: `#EEF2FF`
  - `--accent-lime`: `#C2F81A` (plus `#D6FF00` in ContactSection, `#9AD900`/`#96C700` checkmarks)
  - Featured Pricing Card dark gradient: `#0A1437` → `#132B78` → `#123FFF`
- **Container & Breakpoints**:
  - Max width: `1200px` (`1240px` in `ContactSection`, `FAQSection`, `PricingSection`)
  - Tailwind responsive breakpoints: `sm` (`640px`), `md` (`768px`), `lg` (`1024px`), `xl` (`1280px`)
  - Touch target accessibility floor: `min-height: 44px` on `button, a, [role="button"]` in `index.css`
  - Surface utility: `.bg-grid-paper` (`28px × 28px` light grid)

---

### 5. Assets, Animations & Integrations Inventory

- **Images**:
  - Existing bundled assets in `src/assets/images/` (and duplicated in `public/assets/images/`): `Klido_Logo.png`, `klidodesk.png`, `klidodesk.jpg`, `Hashi.png`, `saanjhbyriya.png`, `Saanjh by riya.png`, `ZEGORE.png`, `process/step-01-consultation.jpg` through `step-05-optimization.jpg`.
  - **Missing referenced paths**: `STUDIO_IMAGES.hero` (`/src/assets/images/klido_hero_studio_1794583087140.jpg`), `STUDIO_IMAGES.strategyDesk` (`/src/assets/images/klido_strategy_desk_1794583087264.jpg`), and `STUDIO_IMAGES.studioInterior` (`/src/assets/images/klido_studio_interior_1794583088377.jpg`) are **absent from the repo**, causing `ResilientImage` to display its fallback icon/caption box on `/services` and `/about`.
- **Animations & Interactions**:
  - Note: `motion` (`^12.23.24`) is installed in `package.json` but **unused** in `src/`.
  - Scroll-morphing sticky `Header` (transitions between full-width bar and floating `820px` / `380px` glass pill using `requestAnimationFrame` scroll direction detection).
  - Interactive `<CampaignMap />` (3 clickable stage cards updating bottom context note + dashed SVG connector paths).
  - Interactive `<InteractiveGlobe />` (HTML5 `<canvas>` 3D spherical projection, Retina DPR `ResizeObserver`, pointer drag-to-spin + momentum velocity, auto-spin, Klido Pune/Mumbai HQ & global hubs).
  - Interactive `<ScopePlanner />` (multi-select scope configurator forwarding state to `/contact`).
  - Interactive `#audit-matrix` tablist + accordion (`ApproachPage.tsx`).
  - Interactive `<FAQSection />` accordion + `<PricingSection />` plan selection → scroll & prefill `#start-project`.
  - `@media (prefers-reduced-motion: reduce)` honored in `src/index.css`.
- **Forms & Third-Party Integrations**:
  - `@emailjs/browser` (`^5.0.3`) in `ContactSection.tsx`: Two-step email dispatch (`ADMIN_TEMPLATE_ID` first, `CUSTOMER_TEMPLATE_ID` second) with `full_success`, `partial_success`, and `error` states, honeypot field, 1-second rapid-submit protection, and `500`-char counter.
  - `ProjectBriefSection.tsx`: Alternate detailed intake component (currently unused in routes, exports `SelectedPlanState` type).
- **SEO (`index.html`, `public/robots.txt`, `public/sitemap.xml`)**:
  - Static `<title>Klido</title>`, canonical `https://www.klido.in/`, OG/Twitter cards, `Schema.org` `WebSite` + `Organization` JSON-LD, `robots.txt`, and `sitemap.xml` (currently uses hash fragments like `/#services` instead of `/services`, `/approach`, `/about`, `/contact`).
  - No `netlify.toml` or `public/_redirects` exists yet.

---

## Part 2: CMS Integration Report

### A. Component Inventory: CMS Blocks vs. Code-Controlled

| Component / Module | Classification | Rationale |
| :--- | :--- | :--- |
| **Hero Section** (`HomePage` Hero + `CampaignMap` copy) | **CMS Block (`hero`)** | Eyebrow, headline, highlighted underline phrase, subtitle, CTAs, and `CampaignMap` stage copy/labels should be editable in Klido Studio while preserving the exact SVG underline & `CampaignMap` layout. |
| **Brands Showcase** (`BrandsSection`) | **CMS Block (`brands`)** | Driven by the `brands` database table (`HashiBusiness`, `Saanjh by Riya`, `Zegore`, future brands) + section heading/subtitle/layout config. |
| **Senior Studio** (`SeniorStudioSection`) | **CMS Block (`editorial-split` / `text` + `image`)** | Eyebrow, headline, highlighted phrase, body copy, bullet checklist, and `brandDesk` media asset. |
| **Service Plans & Pricing** (`PricingSection`) | **CMS Block (`services-grid` / `pricing`)** | Driven by the `services` database table (prices, discounts, features, featured highlight, mapped disciplines) + bottom trust highlights. |
| **How We Work Timeline** (`HowWeWorkSection`) | **CMS Block (`process-timeline` / `statistics` / repeatable steps)** | Sticky heading, subtitle, and 5 numbered process steps with step images stored in Media Library. |
| **Contact & Globe Section** (`ContactSection`) | **Hybrid CMS Block (`contact`)** | Heading, subtitle, email, phone, social link, and form labels are **CMS-controlled**; EmailJS submission logic, honeypot, rate-limit, and `<InteractiveGlobe />` canvas physics remain **code-controlled**. |
| **FAQ Section** (`FAQSection`) | **CMS Block (`faq`)** | Eyebrow, heading, subtitle, "Still have questions?" card copy, and repeatable FAQ items. |
| **Page Split Headers, Practice Areas, Audit Matrix, Operating Boundaries, Principles, Disciplines** | **CMS Blocks** (`hero`, `services-grid`, `accordion-tabs`, `comparison-table`, `grid`, `text`) | All currently hardcoded copy/arrays on `ServicesPage`, `ApproachPage`, and `AboutPage` migrate into structured CMS page JSON + collections. |
| **Header & Morphing Pill Nav** (`Header.tsx`) | **Hybrid: Data CMS / Behavior Code** | Nav labels, URLs, logo asset, and CTA button come from `navigation_items` + `site_settings`; scroll-collapse pill physics and mobile drawer accessibility remain **code-controlled**. |
| **Footer** (`Footer.tsx`) | **CMS Block (`footer`)** | Description, link columns, contact details, copyright text come from `site_settings` / `navigation_items`. |
| **`InteractiveGlobe`, `CampaignMap` canvas/SVG geometry, `ScopePlanner` rules, `ScrollManager`, `ResilientImage`, `EmailJS` transport** | **Code-Controlled** | Complex interactive canvas rendering, security anti-spam, routing state transfer, and EmailJS API dispatch stay in vetted React code, consuming safe CMS props where applicable. |

### B. Hardcoded Content Requiring Migration to Supabase

1. `src/data/klidoData.ts`: `PRACTICE_AREAS`, `ARCHITECTURE_MODULES`, `AUDIT_DOMAINS`, `OPERATING_BOUNDARIES`, `CLIENT_BRANDS`, `STUDIO_IMAGES`.
2. `src/components/BrandsSection.tsx`: Inline JSX for HashiBusiness, Saanjh by Riya (including Instagram URL), and Zegore (which currently bypasses `CLIENT_BRANDS`).
3. `src/components/PricingSection.tsx`: `SERVICE_PLANS` (5 plans with INR pricing) and `PLAN_HIGHLIGHTS` (6 items).
4. `src/components/HowWeWorkSection.tsx`: `PROCESS_STEPS` (5 steps + images).
5. `src/components/FAQSection.tsx`: `FAQ_ITEMS` (7 items) + support card copy.
6. `src/components/ContactSection.tsx`: `klidoagency@gmail.com`, `+91 9172569021`, `@klidoagency` link, headlines/subtitles.
7. `src/components/Header.tsx` & `Footer.tsx`: `NAV_ITEMS`, footer columns, contact hours, copyright.
8. `src/pages/ServicesPage.tsx`, `ApproachPage.tsx`, `AboutPage.tsx`: `TIMELINE_PHASES`, `STUDIO_DISCIPLINES`, `OPERATING_PRINCIPLES`, page headers.

### C. Existing Assets to Preserve

- `Klido_Logo.png`, `klido_Logo.png`, all `favicon-*.png`, `favicon.ico`, `apple-touch-icon.png`
- `Hashi.png`, `saanjhbyriya.png`, `ZEGORE.png`, `klidodesk.png`
- `process/step-01-consultation.jpg` through `process/step-05-optimization.jpg`
- Clean up duplicate asset files (`Saanjh by riya.png` vs `saanjhbyriya.png`, `klidodesk.jpg` vs `klidodesk.png`, and duplicated `public/assets/images/` vs `src/assets/images/`) when seeding Supabase Storage, and upload replacements for the 3 missing image paths (`hero`, `strategyDesk`, `studioInterior`).

### D. CMS Integration Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Client-Side SPA SEO Limitation** | Static `index.html` tags won't reflect per-page CMS SEO titles/OG tags for crawlers that don't wait for async Supabase fetches. | Store per-page `seo_metadata` in Supabase `pages`; update `document.title`/meta tags dynamically on route change AND implement a Netlify build-time prerender / Edge Function meta-injector for `/`, `/services`, `/approach`, `/about`, `/contact` + dynamic `sitemap.xml`. |
| **Missing Netlify SPA Fallback** | No `netlify.toml` or `_redirects` exists in `Klido.git`; direct navigation to `/services` on Netlify would return 404. | Add `netlify.toml` with SPA fallback (`/* -> /index.html 200`) on both `klido-website` and `klido-studio` deployments. |
| **Visual Drift Between Studio & Public Site** | If Klido Studio renders mockups instead of real Klido blocks, WYSIWYG edits won't match `klido.in`. | Share identical Zod schemas, `DesignTokenProvider`, and `PageRenderer`/`BlockRegistry` architecture across both apps; seed `klido-studio` with exact Klido design tokens (`#123FFF`, `#C2F81A`, `#0D1126`, `Plus Jakarta Sans` / `DM Sans` / `JetBrains Mono`). |
| **Draft Leakage & Concurrent Overwrites** | Public site accidentally fetching unpublished drafts or two editors overwriting each other. | Enforce Supabase RLS (`status = 'published'` / `published_revision_id` for anon reads; drafts restricted to authenticated admins + short-lived HMAC/signed preview tokens) and optimistic concurrency (`revision_number` / `updated_at` checks) on saves/publishes. |
| **CMS Downtime Breaking Public Site** | Blank homepage if Supabase is temporarily unreachable. | Keep resilient fallback seed/last-known snapshot in `klido-website` and wrap individual sections in error boundaries so one failing block never crashes a page. |
| **XSS / Arbitrary Code Injection** | Rich text or custom CSS fields allowing `<script>` or `javascript:` URLs. | Strict Zod schemas (allowlisted CSS properties, URL protocol validation `https:`/`mailto:`/`tel:`/`/`), Tiptap structured JSON / sanitized output, zero raw `dangerouslySetInnerHTML`. |

### E. Recommended Migration Sequence

1. **Milestone 2**: Provision Supabase schema (`profiles`, `pages`, `page_revisions`, `site_settings`, `media_assets`, `services`, `projects`, `brands`, `testimonials`, `navigation_items`, `redirects`, `audit_logs`), RLS, Storage bucket, and atomic `publish_page_revision` RPC.
2. **Milestone 3**: Build Klido Studio auth (`/login`, `/forgot-password`), protected shell, collapsible sidebar, and real database Dashboard Overview.
3. **Milestone 4**: Implement shared CMS Zod schemas, `BlockRegistry` (including Klido-native blocks + nested `container`/`columns`/`grid`), `DesignTokenProvider`, and `PageRenderer`.
4. **Milestone 5**: Build the three-panel Visual Website Builder (`dnd-kit` layers, live interactive canvas, dynamic property inspector with responsive overrides).
5. **Milestone 6**: Implement autosave drafts, optimistic concurrency, secure expiring preview, atomic publishing, and revision diff/restore.
6. **Milestone 7**: Build full CRUD managers (Services, Portfolio, Brands, Testimonials, Navigation/Footer, Media Library, Global Design System, SEO Management) and seed existing Klido content & assets.
7. **Milestone 8**: Integrate `klido-website` with published Supabase revisions + fallback cache + SEO prerendering/meta injection, execute automated tests, and deploy both apps independently on Netlify.

---

## Part 3: Klido Studio System Architecture

### 1. Security & RBAC Model

- **Authentication**: Supabase Auth (Email/Password, password reset, session persistence).
- **Roles (`profiles.role`)**:
  - `SUPER_ADMIN`: Full access, manage users/roles, global settings, edit, publish, restore revisions, delete assets.
  - `EDITOR`: Edit pages, manage content collections & media, save drafts, preview, publish (or restricted per policy), cannot manage admin roles.
  - `VIEWER`: Read-only access to dashboard, pages, revisions, and previews.
- **Database Enforcement**: All authorization is enforced via PostgreSQL RLS policies and `SECURITY DEFINER` RPCs (e.g., `publish_page_revision`, `restore_page_revision`, `assign_user_role`). Never trust client-side guards alone, and never include `service_role` keys in `VITE_*` variables.

### 2. CMS Content & Design Token Model

- **Page Tree JSON**: Stored in `page_revisions.content_json` as `{ version: 1, sections: BlockNode[] }`.
- **Every `BlockNode`**:
  - `id` (UUID), `type` (registered in `BlockRegistry`), `name` (layer label), `visible`, `locked`
  - `props` (block-specific validated content & structured Tiptap JSON)
  - `styles` (controlled styling schema: typography, layout, spacing, appearance—no arbitrary CSS)
  - `responsive` (`tablet?: Partial<BlockStyles>`, `mobile?: Partial<BlockStyles>` inheriting from desktop)
  - `animations` (allowlisted preset, duration, delay, trigger, `disableOnMobile`)
  - `children?: BlockNode[]` (supported on `container`, `columns`, `grid`)
- **Design Tokens (`site_settings.design_system`)**: Global colors, typography, buttons, container widths, radii, shadows, mapped to CSS custom properties via `DesignTokenProvider`.

### 3. Draft, Preview & Atomic Publishing Flow

```text
[Editor Canvas (Zustand + Undo/Redo)]
        │  debounced autosave (1.5s) + optimistic lock check
        ▼
[page_revisions (status = 'draft')]  ──(Authenticated / Signed Expiring Token)──▶ [/preview/:pageId]
        │
        │  Publish Confirmation -> Supabase RPC: publish_page_revision()
        ▼
[New Immutable Revision (status = 'published')] + [pages.published_revision_id updated] + [audit_logs]
        │
        ▼
[klido-website (klido.in) reads ONLY published_revision_id via anon RLS]
```

### 4. Planned `klido-studio` Directory Structure

```text
src/
├── blocks/          # BlockRegistry, Zod schemas, PageRenderer, SectionRenderer, Klido & layout blocks
├── components/      # Layout shell, 3-panel Visual Builder, Media Library, UI primitives
├── hooks/           # TanStack Query hooks, debounced autosave, keyboard shortcuts
├── lib/             # Supabase client, style compiler, sanitizer, audit logger
├── pages/           # Lazy-loaded routes matching all /login and /dashboard/* paths
├── providers/       # AuthProvider, DesignTokenProvider, GlobalSettingsProvider
├── stores/          # Zustand editorStore, historyStore, uiStore
└── types/           # Strict TypeScript definitions for DB, blocks, styles, and RBAC
```
