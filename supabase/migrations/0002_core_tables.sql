-- ============================================================================
-- Klido Studio — Migration 0002: Core CMS Tables, Constraints, Indexes & Triggers
-- ============================================================================

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 1. profiles (Admin users & RBAC roles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  role public.app_role NOT NULL DEFAULT 'VIEWER',
  is_active boolean NOT NULL DEFAULT true,
  last_sign_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Prevent self-service role or active-status escalation outside trusted RPCs / SQL superuser
CREATE OR REPLACE FUNCTION public.protect_profile_role_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF current_setting('klido.allow_role_change', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Role and activation changes must be performed by a SUPER_ADMIN via assign_user_role.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_role_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role_columns();

-- Auto-create VIEWER profile on Auth signup (never self-service SUPER_ADMIN)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    'VIEWER',
    true
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. media_assets (Supabase Storage backed assets)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL CHECK (char_length(trim(file_name)) > 0),
  file_type text NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
  mime_type text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'klido-media',
  storage_path text NOT NULL UNIQUE,
  public_url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  file_size bigint NOT NULL CHECK (file_size > 0 AND file_size <= 52428800),
  dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_media_assets_file_type ON public.media_assets(file_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON public.media_assets(created_at DESC);

DROP TRIGGER IF EXISTS trg_media_assets_updated_at ON public.media_assets;
CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. pages & 4. page_revisions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^(/[a-z0-9\-/]*|home)$' OR slug ~ '^/[a-z0-9\-/]*$'),
  page_type text NOT NULL DEFAULT 'standard' CHECK (page_type IN ('home', 'services', 'approach', 'about', 'contact', 'landing', 'standard')),
  status public.page_status NOT NULL DEFAULT 'draft',
  seo_metadata jsonb NOT NULL DEFAULT '{
    "seoTitle": "",
    "metaDescription": "",
    "canonicalUrl": "",
    "ogTitle": "",
    "ogDescription": "",
    "ogImage": "",
    "robotsIndex": true,
    "robotsFollow": true
  }'::jsonb,
  published_revision_id uuid,
  draft_revision_id uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.page_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  revision_number integer NOT NULL CHECK (revision_number >= 1),
  content_json jsonb NOT NULL DEFAULT '{"version": 1, "sections": []}'::jsonb,
  status public.revision_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at timestamptz,
  change_summary text NOT NULL DEFAULT '',
  UNIQUE (page_id, revision_number)
);

ALTER TABLE public.pages
  DROP CONSTRAINT IF EXISTS fk_pages_published_revision,
  ADD CONSTRAINT fk_pages_published_revision
    FOREIGN KEY (published_revision_id) REFERENCES public.page_revisions(id) ON DELETE SET NULL;

ALTER TABLE public.pages
  DROP CONSTRAINT IF EXISTS fk_pages_draft_revision,
  ADD CONSTRAINT fk_pages_draft_revision
    FOREIGN KEY (draft_revision_id) REFERENCES public.page_revisions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);
CREATE INDEX IF NOT EXISTS idx_page_revisions_page_rev ON public.page_revisions(page_id, revision_number DESC);
CREATE INDEX IF NOT EXISTS idx_page_revisions_status ON public.page_revisions(status);

DROP TRIGGER IF EXISTS trg_pages_updated_at ON public.pages;
CREATE TRIGGER trg_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. site_settings (Design System, Global SEO, Footer, Contact, Integrations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE CHECK (char_length(trim(setting_key)) > 0),
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT true,
  description text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(setting_key);

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. services (Plans + Practice Areas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  subtitle text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  service_kind text NOT NULL DEFAULT 'plan' CHECK (service_kind IN ('plan', 'practice_area')),
  price_display text NOT NULL DEFAULT '',
  original_price_display text NOT NULL DEFAULT '',
  discount_label text NOT NULL DEFAULT '',
  billing_period text NOT NULL DEFAULT '/month',
  image_asset_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  deliverables jsonb NOT NULL DEFAULT '[]'::jsonb,
  tooling jsonb NOT NULL DEFAULT '[]'::jsonb,
  mapped_disciplines jsonb NOT NULL DEFAULT '[]'::jsonb,
  cadence text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT 'Get Started',
  cta_url text NOT NULL DEFAULT '/contact',
  is_featured boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_services_visible_order ON public.services(is_visible, display_order);

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. projects (Portfolio / Case Studies)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  client_name text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Growth',
  cover_asset_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  gallery_asset_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  external_url text NOT NULL DEFAULT '',
  metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_featured boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_visible_order ON public.projects(is_visible, display_order);

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 8. brands (Brands & Clients)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  logo_asset_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  preview_asset_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  filter_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  website_url text NOT NULL DEFAULT '',
  instagram_url text NOT NULL DEFAULT '',
  layout_variant text NOT NULL DEFAULT 'card' CHECK (layout_variant IN ('card', 'wide')),
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_brands_visible_order ON public.brands(is_visible, display_order);

DROP TRIGGER IF EXISTS trg_brands_updated_at ON public.brands;
CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 9. testimonials
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL CHECK (char_length(trim(author_name)) > 0),
  author_designation text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  quote text NOT NULL CHECK (char_length(trim(quote)) > 0),
  avatar_asset_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_testimonials_visible_order ON public.testimonials(is_visible, display_order);

DROP TRIGGER IF EXISTS trg_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER trg_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 10. navigation_items (Header & Footer links with optional parent nesting)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.navigation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL CHECK (location IN ('header', 'footer_practice', 'footer_engage', 'footer_legal')),
  parent_id uuid REFERENCES public.navigation_items(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(trim(label)) > 0),
  href text NOT NULL CHECK (char_length(trim(href)) > 0),
  is_external boolean NOT NULL DEFAULT false,
  is_cta boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_navigation_location_order ON public.navigation_items(location, display_order);

DROP TRIGGER IF EXISTS trg_navigation_items_updated_at ON public.navigation_items;
CREATE TRIGGER trg_navigation_items_updated_at
  BEFORE UPDATE ON public.navigation_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 11. redirects
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path text NOT NULL UNIQUE CHECK (source_path ~ '^/'),
  destination_path text NOT NULL CHECK (char_length(trim(destination_path)) > 0),
  status_code integer NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302, 307, 308)),
  is_active boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_redirects_active_source ON public.redirects(is_active, source_path);

DROP TRIGGER IF EXISTS trg_redirects_updated_at ON public.redirects;
CREATE TRIGGER trg_redirects_updated_at
  BEFORE UPDATE ON public.redirects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 12. audit_logs (Append-only administrative activity trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email text NOT NULL DEFAULT '',
  actor_role public.app_role,
  action text NOT NULL CHECK (char_length(trim(action)) > 0),
  entity_type text NOT NULL CHECK (char_length(trim(entity_type)) > 0),
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);

-- ----------------------------------------------------------------------------
-- 13. preview_tokens (Short-lived expiring tokens for draft preview access)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.preview_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  revision_id uuid NOT NULL REFERENCES public.page_revisions(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_preview_tokens_expires ON public.preview_tokens(expires_at);
