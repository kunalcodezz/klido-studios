# Klido Studio — Security Architecture (`SECURITY.md`)

---

## 1. Key & Credential Boundaries

- **Browser Environment (`VITE_*`)**: Uses only `VITE_SUPABASE_URL` and the public `VITE_SUPABASE_ANON_KEY` (`sb_publishable_*`).
- **Privileged Keys**: `SUPABASE_SERVICE_ROLE_KEY` / `sb_secret_*` must **never** appear in `VITE_*` variables, client bundles, or source control.
- **Public Site (`klido-website`)**: Uses only the public anon/publishable key, constrained exclusively by PostgreSQL RLS.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Resource / Action | Public (`anon`) | `VIEWER` | `EDITOR` | `SUPER_ADMIN` |
| :--- | :--- | :--- | :--- | :--- |
| Read published pages & published revisions | Yes | Yes | Yes | Yes |
| Read draft pages & draft revisions | **No** | Yes | Yes | Yes |
| Create / edit drafts (`save_page_draft`) | **No** | **No** | Yes | Yes |
| Publish / restore revisions | **No** | **No** | **No** | Yes |
| Manage Services, Projects, Brands, Testimonials, Nav | Read visible only | Read all | Create / Edit | Full CRUD |
| Upload media (`klido-media`) | **No** | **No** | Yes | Yes |
| Delete media assets | **No** | **No** | **No** | Yes (usage-checked) |
| Manage `site_settings` & `profiles` roles | Public keys only | Read | Read | Full (non-self-service) |
| View `audit_logs` | **No** | Yes | Yes | Yes |

### Anti-Escalation Safeguards
- New Supabase Auth users automatically receive `'VIEWER'` via `handle_new_user()`.
- `trg_protect_profile_role_columns` rejects direct `UPDATE` attempts on `profiles.role` or `profiles.is_active` unless executed via `assign_user_role()` (`SUPER_ADMIN` only) or database superuser.
- `assign_user_role()` blocks demoting or deactivating the final active `SUPER_ADMIN`.

---

## 3. Content, Media & XSS Protections

- **No Arbitrary HTML or JS Execution**: CMS blocks use structured JSON validated by Zod schemas (`src/schemas/`). Raw `<script>` injection and `dangerouslySetInnerHTML` are prohibited.
- **Protocol Allowlist (`isSafeUrl`)**: All CMS links, CTAs, canonical URLs, and media references permit only relative paths (`/`, `#`) or `https:`, `http:`, `mailto:`, `tel:`. `javascript:`, `data:`, and `//` protocol-relative URLs are rejected.
- **Media Upload Hardening**:
  - Client & Storage bucket enforce a **10 MB** file size limit.
  - Only safe raster & video MIME types are allowed (`image/png`, `image/jpeg`, `image/webp`, `image/avif`, `image/gif`, `video/mp4`, `video/webm`). SVG uploads are excluded to prevent stored SVG script execution.
  - Filenames are sanitized and prefixed with UUIDs; `check_media_asset_usage()` prevents deleting assets referenced by live published pages or content records.

---

## 4. Draft Preview Privacy

- Draft revisions are invisible to the `anon` role under RLS.
- Shareable preview links use `preview_tokens` storing only a **SHA-256 hash** of a high-entropy token and an explicit `expires_at` timestamp, resolved via `resolve_preview_token()`.
- Preview routes must emit `<meta name="robots" content="noindex, nofollow" />`.
