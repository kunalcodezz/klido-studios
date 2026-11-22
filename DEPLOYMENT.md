# Klido Studio & Klido Public Website — Deployment Runbook

This runbook documents production deployment across **two independent Netlify sites** backed by **one shared Supabase project**.

---

## 1. Shared Supabase Backend Setup

### A. Run Database Migrations in Order
Open the Supabase SQL Editor for project `wbckdglxkogblbegskho` and execute:
1. `supabase/migrations/0001_extensions_and_enums.sql`
2. `supabase/migrations/0002_core_tables.sql`
3. `supabase/migrations/0003_rls_and_storage.sql`
4. `supabase/migrations/0004_rpcs_and_triggers.sql`
5. `supabase/migrations/0005_seed_klido_defaults.sql`

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

## 2. Independent Netlify Deployment #1 — `klido-studio` (`studio.klido.in`)

1. Connect the `klido-studio` repository in Netlify.
2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `20` or `22`
3. **Environment Variables**:
   - `VITE_SUPABASE_URL` = `https://wbckdglxkogblbegskho.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_...`
   - *(Never set `SUPABASE_SERVICE_ROLE_KEY` in `VITE_*` variables.)*
4. **Routing & Security Headers**:
   - Handled automatically by root `netlify.toml` (SPA rewrite `/* -> /index.html 200`, `X-Robots-Tag: noindex, nofollow`, `X-Frame-Options: DENY`).
5. **Custom Domain & SSL**:
   - Attach `studio.klido.in` in **Domain management** and provision Let's Encrypt TLS certificate.

---

## 3. Independent Netlify Deployment #2 — `klido-website` (`klido.in`)

1. Keep `https://github.com/kunalcodezz/Klido.git` connected as its own Netlify site.
2. Apply integration steps from `docs/KLIDO_WEBSITE_INTEGRATION.md` (including adding `netlify.toml` to `klido-website`).
3. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Environment Variables**:
   - `VITE_SUPABASE_URL` = `https://wbckdglxkogblbegskho.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_...`
   - Retain existing `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`.
5. **Custom Domain & SSL**:
   - Keep `klido.in` / `www.klido.in` pointing to this Netlify site with HTTPS enforced.

---

## 4. Production Verification & Rollback Checklist

### Post-Deploy Smoke Checks
- `https://studio.klido.in/login` loads without console errors and redirects `/dashboard` when unauthenticated.
- Editing a page in Visual Builder saves a draft without altering live `https://klido.in`.
- Generating an expiring preview link opens `/preview/:pageId?token=...` with `<meta name="robots" content="noindex, nofollow" />`.
- Publishing a page as `SUPER_ADMIN` immediately reflects on `https://klido.in`.

### Fast Content Rollback
- **Page-level rollback**: Open **Klido Studio → Revisions**, choose the prior revision, and click **Restore & Publish** (executes `restore_page_revision` RPC atomically).
- **Site-level rollback**: Use Netlify **Deploys → Publish deploy** on the respective site (`klido-studio` or `klido-website`) independently.
