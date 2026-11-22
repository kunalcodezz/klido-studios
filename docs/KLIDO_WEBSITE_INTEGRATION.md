# Public Website Integration Guide (`klido-website`)

This guide explains how to connect the **existing public agency repository** (`https://github.com/kunalcodezz/Klido.git`, deployed at `https://klido.in`) to the **shared Supabase CMS backend** managed by **Klido Studio** (`studio.klido.in`).

> **Architectural Boundary**: Keep `klido-website` (`kunalcodezz/Klido`) and `klido-studio` as two completely independent repositories and two independent Netlify sites. Never embed admin auth or CMS editing routes into `klido-website`.

---

## 1. Environment & Dependencies in `klido-website`

Install `@supabase/supabase-js` and `@tanstack/react-query` (plus `zod` if sharing runtime validation) in `klido-website`:

```bash
npm install @supabase/supabase-js @tanstack/react-query zod
```

Add only **public** environment variables to `klido-website`'s `.env` and Netlify environment settings (keep existing `VITE_EMAILJS_*` variables for the contact form):

```env
VITE_SUPABASE_URL=https://wbckdglxkogblbegskho.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_jz4bnJfjrb0ljyvDdStXMw_2cbGf1t9
```

---

## 2. Shared Rendering & Schema Files to Sync into `klido-website`

Copy these read-only modules from `klido-studio/src/` into `klido-website/src/cms/` so both preview and live production render identical layouts:

1. `src/types/database.ts`
2. `src/schemas/{tiptap,styles,blocks,validation}.ts`
3. `src/lib/{supabase,schemaValidator,publicCmsClient}.ts`
4. `src/providers/{DesignTokenProvider,GlobalSettingsProvider,CMSDataProvider}.tsx`
5. `src/blocks/{registry,styleCompiler,RichTextRenderer,BlockResolver,SectionRenderer,PageRenderer}.tsx`
6. `src/blocks/components/{InteractiveWidgets,HeroBlock,PrimitiveBlocks,CollectionBlocks,InteractiveBlocks,LayoutBlocks}.tsx`

> Ensure `klido-website/src/index.css` continues loading Google Fonts (`Montserrat` and `Playfair Display`) and Tailwind CSS v4.

---

## 3. Fetching Published Pages & Preserving Interactivity

### Route Resolution Flow in `klido-website`
In `klido-website`'s `App.tsx` catch-all / page route:
1. Call `fetchPublicSiteBundle()` via React Query (`staleTime: 60_000`) to hydrate design tokens (`DesignTokenProvider`), navigation (`Header`), footer (`Footer`), active redirects, and visible collections (`services`, `projects`, `brands`, `testimonials`).
2. Check `resolveActiveRedirect(location.pathname, bundle.redirects)` first and perform a client `<Navigate to={match.destination} replace />` if matched.
3. Call `fetchPublishedPageBySlug(location.pathname, bundle.seoGlobal)`:
   - Queries `pages` where `status = 'published'` and `published_revision_id IS NOT NULL`.
   - Fetches only the immutable `page_revisions` row matching `published_revision_id`.
   - Never queries `draft` revisions (which are also blocked at the database layer by Supabase RLS).
4. Render `<PageRenderer tree={payload.tree} />` inside `<CMSDataProvider>` and `<DesignTokenProvider>`.
5. Update `document.title`, `<meta name="description">`, canonical link, and OpenGraph meta tags using `resolvePublicPageSeo(payload.page, bundle.seoGlobal)`.
6. **Graceful Offline/Bootstrap Fallback**: If Supabase returns `null` for a core route (`/`, `/services`, `/approach`, `/about`, `/contact`) prior to seeding, render the existing static page component so the public site never goes blank.
7. **Preserved Interactive Widgets & EmailJS**:
   - `ContactFormBlock` / `ContactSection` in `klido-website` keeps its existing `@emailjs/browser` submission handler (`VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`).
   - `CampaignMap`, `InteractiveGlobe`, and `ScopePlanner` continue rendering identically via `InteractiveWidgets`.

---

## 4. Resolving Audit Findings in `klido-website` (`Klido.git`)

### A. Add `netlify.toml` to `klido-website` root (fixes SPA deep-link 404s)
`Klido.git` uses `BrowserRouter` for `/services`, `/approach`, `/about`, and `/contact` without a Netlify SPA fallback. Add `netlify.toml` to `Klido.git`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### B. Replace Legacy Hash URLs in `Klido.git/public/sitemap.xml`
Replace `/#services`, `/#approach`, `/#pricing`, and `/#contact` in `public/sitemap.xml` with clean canonical routes (or export the generated XML directly from **Klido Studio → SEO & Sitemap**):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.klido.in/</loc><priority>1.0</priority></url>
  <url><loc>https://www.klido.in/services</loc><priority>0.8</priority></url>
  <url><loc>https://www.klido.in/approach</loc><priority>0.8</priority></url>
  <url><loc>https://www.klido.in/about</loc><priority>0.8</priority></url>
  <url><loc>https://www.klido.in/contact</loc><priority>0.8</priority></url>
</urlset>
```

### C. Fix Broken `STUDIO_IMAGES` Paths
In `Klido.git/src/data/klidoData.ts`, `STUDIO_IMAGES` referenced missing `/src/assets/images/klido_*.jpg` paths. Upload finalized photography into **Klido Studio → Media Library** (`klido-media` bucket) and bind the generated `public_url` values directly inside the Page Builder (`image` and `hero` blocks) so zero broken relative assets exist in production.
