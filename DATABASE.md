# Klido Studio — Database Architecture (`DATABASE.md`)

**Shared Backend**: Supabase PostgreSQL (`wbckdglxkogblbegskho.supabase.co`)  
**Migrations Location**: `supabase/migrations/0001` – `0005`

---

## 1. Core Tables Overview

| Table | Purpose | Primary Relationships |
| :--- | :--- | :--- |
| `profiles` | Admin accounts & RBAC roles (`SUPER_ADMIN`, `EDITOR`, `VIEWER`) | `id -> auth.users(id)` |
| `pages` | Website routes, status (`draft`, `published`, `archived`), SEO JSON | `published_revision_id`, `draft_revision_id -> page_revisions(id)` |
| `page_revisions` | Immutable published snapshots & active draft JSON trees | `page_id -> pages(id)`, `created_by -> profiles(id)` |
| `site_settings` | Design system tokens, global SEO, footer/contact config | `updated_by -> profiles(id)` |
| `media_assets` | Metadata for Supabase Storage (`klido-media`) objects | `uploaded_by -> profiles(id)` |
| `services` | Service plans (`Meta Ads`, `Growth Bundle`, etc.) & practice areas | `image_asset_id -> media_assets(id)` |
| `projects` | Portfolio case studies & metrics | `cover_asset_id -> media_assets(id)` |
| `brands` | Client brands (`HashiBusiness`, `Saanjh by Riya`, `Zegore`) | `logo_asset_id`, `preview_asset_id -> media_assets(id)` |
| `testimonials` | Client quotes linked to projects/services | `avatar_asset_id`, `project_id`, `service_id` |
| `navigation_items` | Header & footer links with optional nesting (`parent_id`) | `parent_id -> navigation_items(id)` |
| `redirects` | HTTP 301/302/307/308 URL redirect rules | `created_by -> profiles(id)` |
| `audit_logs` | Append-only administrative activity log | `actor_id -> profiles(id)` |
| `preview_tokens` | Short-lived SHA-256 hashed tokens for draft preview access | `page_id -> pages(id)`, `revision_id -> page_revisions(id)` |

---

## 2. Database Security Functions (RPCs)

| Function | Privilege | Purpose |
| :--- | :--- | :--- |
| `save_page_draft(p_page_id, p_expected_draft_revision_id, p_content_json, p_change_summary)` | `EDITOR` / `SUPER_ADMIN` | Saves draft JSON with optimistic concurrency check against `pages.draft_revision_id`. |
| `publish_page_revision(p_page_id, p_expected_draft_revision_id, p_change_summary)` | `SUPER_ADMIN` | Atomically creates a new immutable `published` revision, supersedes the previous one, updates `pages.published_revision_id`, and writes an audit log. |
| `restore_page_revision(p_page_id, p_source_revision_id)` | `SUPER_ADMIN` | Copies a historical revision into the page's active draft without overwriting live published content. |
| `assign_user_role(p_target_user_id, p_new_role, p_is_active)` | `SUPER_ADMIN` | Non-self-service role management; prevents demoting/deactivating the last active `SUPER_ADMIN`. |
| `resolve_preview_token(p_raw_token)` | Token-bound `SECURITY DEFINER` | Validates SHA-256 token hash + expiration timestamp before returning draft revision JSON. |
| `check_media_asset_usage(p_asset_id)` | Staff | Counts references across `published_revision_id` pages and content collections before deletion. |

---

## 3. Applying Migrations & Bootstrapping First Super Admin

1. Open the **Supabase SQL Editor** (or use `supabase db push` via Supabase CLI).
2. Execute migrations in order:
   - `supabase/migrations/0001_extensions_and_enums.sql`
   - `supabase/migrations/0002_core_tables.sql`
   - `supabase/migrations/0003_rls_and_security_functions.sql`
   - `supabase/migrations/0004_storage_policies.sql`
   - `supabase/migrations/0005_seed_klido_defaults.sql`
3. Create your initial admin user in **Supabase Auth -> Users** (or sign up via `/login`), then promote that single account in SQL Editor (self-service promotion is blocked by trigger & RLS):

```sql
UPDATE public.profiles
SET role = 'SUPER_ADMIN', is_active = true
WHERE email = 'your-admin-email@klido.in';
```

4. Run `supabase/tests/rls_verification.sql` in the SQL Editor to verify RLS and function security inside a rolled-back transaction.
