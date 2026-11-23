# Klido Studio & Klido Public Website — Vercel Deployment Runbook

This runbook documents production deployment across **two independent Vercel projects** backed by **one shared Supabase project**.

---

## 1. Shared Supabase Backend Setup

### A. Run Database Migrations in Order
Open the Supabase SQL Editor for project `wbckdglxkogblbegskho` and execute:
1. `supabase/migrations/0001_extensions_and_enums.sql`
2. `supabase/migrations/0002_core_tables.sql`
3. `supabase/migrations/0003_rls_and_security_functions.sql`
4. `supabase/migrations/0004_storage_policies.sql`
5. `supabase/migrations/0005_seed_klido_defaults.sql`
6. `supabase/migrations/0006_enforce_five_approved_pages.sql`

### B. Verify RLS & Security Policies
Run `supabase/tests/rls_verification.sql` in the SQL Editor (rollback transaction included) to verify:
- Anonymous users can read only `published` pages/revisions and visible collection records.
- Draft revisions and `audit_logs` are inaccessible to `anon`.
- Users cannot escalate `profiles.role` via direct `UPDATE`.

### C. Provision First `SUPER_ADMIN`
1. In **Supabase Dashboard → Authentication → Users**, invite or create the owner account.
2. Promote that account once via SQL Editor:
   ```sql
   UPDATE public.profiles
   SET role = 'SUPER_ADMIN', is_active = true
   WHERE email = 'owner@klido.in';
   ```
3. Configure **Authentication → URL Configuration**:
   - **Site URL**: `https://studio.klido.in`
   - **Redirect URLs**:
     - `https://studio.klido.in/**`
     - `http://localhost:3000/**` (local development only)

### D. Seed the 5 Core Klido Pages
1. Sign in to `Klido Studio` as `SUPER_ADMIN`.
2. Navigate to **Overview** or **Pages** and click **Seed Default Klido Pages** (`seedKlidoCmsPages`) to populate `/`, `/services`, `/approach`, `/about`, and `/contact`.
3. Open **Website Settings** and **SEO & Sitemap** to review domain metadata (`https://www.klido.in`).

---

## 2. Independent Vercel Project #1 — `klido-studio` (`studio.klido.in`)

1. Import the private `klido-studio` repository into **Vercel → Add New → Project**.
2. **Build & Output Settings** (auto-detected from root `vercel.json`):
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Node.js Version: `20.x` or `22.x`
3. **Environment Variables** (Production & Preview):
   - `VITE_SUPABASE_URL` = `https://wbckdglxkogblbegskho.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_...`
   - *(Never set `SUPABASE_SERVICE_ROLE_KEY` in `VITE_*` variables.)*
4. **Routing & Security Headers**:
   - Handled automatically by root `vercel.json` (SPA rewrite `/(.*) -> /index.html`, `X-Robots-Tag: noindex, nofollow`, `X-Frame-Options: DENY`).
5. **Custom Domain & SSL**:
   - Add `studio.klido.in` under **Project Settings → Domains** and point your DNS `CNAME` record (`studio`) to `cname.vercel-dns.com`.

---

## 3. Independent Vercel Project #2 — `klido-website` (`klido.in`)

1. Import the private `kunalcodezz/Klido` repository as a separate Vercel project.
2. Apply the integration steps from `docs/KLIDO_WEBSITE_INTEGRATION.md` (including adding `vercel.json` to `klido-website`).
3. **Build & Output Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables**:
   - `VITE_SUPABASE_URL` = `https://wbckdglxkogblbegskho.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_...`
   - Retain existing `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`.
5. **Custom Domain & SSL**:
   - Add `klido.in` and `www.klido.in` under **Project Settings → Domains** with automatic Vercel TLS certificates.

---

## 4. Production Verification & Rollback Checklist

### Post-Deploy Smoke Checks
- `https://studio.klido.in/login` loads without console errors and redirects `/dashboard` when unauthenticated.
- Hard-refreshing `/dashboard/pages` or `/preview/:pageId?token=...` returns HTTP 200 via `vercel.json` SPA rewrites (no 404).
- Editing a page in Visual Builder saves a draft without altering live `https://klido.in`.
- Generating an expiring preview link opens `/preview/:pageId?token=...` with `<meta name="robots" content="noindex, nofollow" />`.
- Publishing a page as `SUPER_ADMIN` immediately reflects on `https://klido.in`.

### Fast Content & Build Rollback
- **Page-level rollback**: Open **Klido Studio → Revisions**, choose the prior revision, and click **Restore & Publish** (executes `restore_page_revision` RPC atomically).
- **Site-level rollback**: Use Vercel **Deployments → Instant Rollback** on either project (`klido-studio` or `klido-website`) independently.
