-- ============================================================================
-- Klido Studio — Migration 0003: Strict RLS Policies & Atomic Security RPCs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Security Helper Functions (SECURITY DEFINER to avoid RLS recursion)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.id = auth.uid() AND p.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND p.role IN ('SUPER_ADMIN', 'EDITOR', 'VIEWER')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_editor_or_above()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND p.role IN ('SUPER_ADMIN', 'EDITOR')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND p.role = 'SUPER_ADMIN'
  );
$$;

-- ----------------------------------------------------------------------------
-- Enable RLS across all tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preview_tokens ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- profiles RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select_staff_or_self ON public.profiles;
CREATE POLICY profiles_select_staff_or_self ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_active_staff());

DROP POLICY IF EXISTS profiles_update_self_metadata ON public.profiles;
CREATE POLICY profiles_update_self_metadata ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_super_admin())
  WITH CHECK (auth.uid() = id OR public.is_super_admin());

-- ----------------------------------------------------------------------------
-- pages RLS (Public sees ONLY published pages; Staff sees all; Editors+ write)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS pages_public_read_published ON public.pages;
CREATE POLICY pages_public_read_published ON public.pages
  FOR SELECT
  USING (
    (status = 'published' AND published_revision_id IS NOT NULL)
    OR public.is_active_staff()
  );

DROP POLICY IF EXISTS pages_editor_insert ON public.pages;
CREATE POLICY pages_editor_insert ON public.pages
  FOR INSERT
  WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS pages_editor_update ON public.pages;
CREATE POLICY pages_editor_update ON public.pages
  FOR UPDATE
  USING (public.is_editor_or_above())
  WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS pages_super_admin_delete ON public.pages;
CREATE POLICY pages_super_admin_delete ON public.pages
  FOR DELETE
  USING (public.is_super_admin());

-- ----------------------------------------------------------------------------
-- page_revisions RLS (Draft revisions are strictly private to active staff)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS revisions_public_read_published_only ON public.page_revisions;
CREATE POLICY revisions_public_read_published_only ON public.page_revisions
  FOR SELECT
  USING (
    public.is_active_staff()
    OR EXISTS (
      SELECT 1
      FROM public.pages p
      WHERE p.id = page_revisions.page_id
        AND p.status = 'published'
        AND p.published_revision_id = page_revisions.id
    )
  );

DROP POLICY IF EXISTS revisions_editor_insert ON public.page_revisions;
CREATE POLICY revisions_editor_insert ON public.page_revisions
  FOR INSERT
  WITH CHECK (public.is_editor_or_above() AND status = 'draft');

DROP POLICY IF EXISTS revisions_editor_update_draft_only ON public.page_revisions;
CREATE POLICY revisions_editor_update_draft_only ON public.page_revisions
  FOR UPDATE
  USING (public.is_editor_or_above() AND status = 'draft')
  WITH CHECK (public.is_editor_or_above() AND status = 'draft');

-- Published revisions are immutable; no direct DELETE by anon or editors
DROP POLICY IF EXISTS revisions_super_admin_delete_draft ON public.page_revisions;
CREATE POLICY revisions_super_admin_delete_draft ON public.page_revisions
  FOR DELETE
  USING (public.is_super_admin() AND status = 'draft');

-- ----------------------------------------------------------------------------
-- site_settings RLS (Public reads is_public=true; SUPER_ADMIN manages settings)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS site_settings_read ON public.site_settings;
CREATE POLICY site_settings_read ON public.site_settings
  FOR SELECT
  USING (is_public = true OR public.is_active_staff());

DROP POLICY IF EXISTS site_settings_super_admin_write ON public.site_settings;
CREATE POLICY site_settings_super_admin_write ON public.site_settings
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ----------------------------------------------------------------------------
-- media_assets RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS media_assets_read ON public.media_assets;
CREATE POLICY media_assets_read ON public.media_assets
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS media_assets_editor_insert ON public.media_assets;
CREATE POLICY media_assets_editor_insert ON public.media_assets
  FOR INSERT
  WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS media_assets_editor_update ON public.media_assets;
CREATE POLICY media_assets_editor_update ON public.media_assets
  FOR UPDATE
  USING (public.is_editor_or_above())
  WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS media_assets_super_admin_delete ON public.media_assets;
CREATE POLICY media_assets_super_admin_delete ON public.media_assets
  FOR DELETE
  USING (public.is_super_admin());

-- ----------------------------------------------------------------------------
-- Structured Content Collections RLS (services, projects, brands, testimonials, navigation_items, redirects)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS services_read ON public.services;
CREATE POLICY services_read ON public.services
  FOR SELECT USING (is_visible = true OR public.is_active_staff());
DROP POLICY IF EXISTS services_write ON public.services;
CREATE POLICY services_write ON public.services
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS projects_read ON public.projects;
CREATE POLICY projects_read ON public.projects
  FOR SELECT USING (is_visible = true OR public.is_active_staff());
DROP POLICY IF EXISTS projects_write ON public.projects;
CREATE POLICY projects_write ON public.projects
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS brands_read ON public.brands;
CREATE POLICY brands_read ON public.brands
  FOR SELECT USING (is_visible = true OR public.is_active_staff());
DROP POLICY IF EXISTS brands_write ON public.brands;
CREATE POLICY brands_write ON public.brands
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS testimonials_read ON public.testimonials;
CREATE POLICY testimonials_read ON public.testimonials
  FOR SELECT USING (is_visible = true OR public.is_active_staff());
DROP POLICY IF EXISTS testimonials_write ON public.testimonials;
CREATE POLICY testimonials_write ON public.testimonials
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS navigation_items_read ON public.navigation_items;
CREATE POLICY navigation_items_read ON public.navigation_items
  FOR SELECT USING (is_visible = true OR public.is_active_staff());
DROP POLICY IF EXISTS navigation_items_write ON public.navigation_items;
CREATE POLICY navigation_items_write ON public.navigation_items
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

DROP POLICY IF EXISTS redirects_read ON public.redirects;
CREATE POLICY redirects_read ON public.redirects
  FOR SELECT USING (is_active = true OR public.is_active_staff());
DROP POLICY IF EXISTS redirects_write ON public.redirects;
CREATE POLICY redirects_write ON public.redirects
  FOR ALL USING (public.is_editor_or_above()) WITH CHECK (public.is_editor_or_above());

-- ----------------------------------------------------------------------------
-- audit_logs RLS (Active staff can read; authenticated staff can append; no update/delete)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS audit_logs_staff_read ON public.audit_logs;
CREATE POLICY audit_logs_staff_read ON public.audit_logs
  FOR SELECT
  USING (public.is_active_staff());

DROP POLICY IF EXISTS audit_logs_staff_insert ON public.audit_logs;
CREATE POLICY audit_logs_staff_insert ON public.audit_logs
  FOR INSERT
  WITH CHECK (public.is_active_staff() AND actor_id = auth.uid());

-- ----------------------------------------------------------------------------
-- preview_tokens RLS (Only staff can view/create; resolution happens via SECURITY DEFINER RPC)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS preview_tokens_staff_read ON public.preview_tokens;
CREATE POLICY preview_tokens_staff_read ON public.preview_tokens
  FOR SELECT
  USING (public.is_active_staff());

DROP POLICY IF EXISTS preview_tokens_editor_insert ON public.preview_tokens;
CREATE POLICY preview_tokens_editor_insert ON public.preview_tokens
  FOR INSERT
  WITH CHECK (public.is_editor_or_above() AND created_by = auth.uid());

DROP POLICY IF EXISTS preview_tokens_editor_delete ON public.preview_tokens;
CREATE POLICY preview_tokens_editor_delete ON public.preview_tokens
  FOR DELETE
  USING (public.is_editor_or_above());

-- ============================================================================
-- Atomic Database Functions (RPCs)
-- ============================================================================

-- Internal audit helper
CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_role public.app_role;
BEGIN
  SELECT email, role INTO v_email, v_role
  FROM public.profiles
  WHERE id = auth.uid();

  INSERT INTO public.audit_logs (actor_id, actor_email, actor_role, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), COALESCE(v_email, ''), v_role, p_action, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb));
END;
$$;

-- 1. Save Draft with Optimistic Concurrency
CREATE OR REPLACE FUNCTION public.save_page_draft(
  p_page_id uuid,
  p_expected_draft_revision_id uuid,
  p_content_json jsonb,
  p_change_summary text DEFAULT 'Draft autosave'
)
RETURNS public.page_revisions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_page public.pages;
  v_next_rev integer;
  v_revision public.page_revisions;
BEGIN
  IF NOT public.is_editor_or_above() THEN
    RAISE EXCEPTION 'Insufficient permissions to save drafts.';
  END IF;

  SELECT * INTO v_page FROM public.pages WHERE id = p_page_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Page not found.';
  END IF;

  IF v_page.draft_revision_id IS DISTINCT FROM p_expected_draft_revision_id THEN
    RAISE EXCEPTION 'CONFLICT: Page draft was modified in another session. Reload to avoid overwriting.';
  END IF;

  IF v_page.draft_revision_id IS NOT NULL THEN
    UPDATE public.page_revisions
    SET content_json = p_content_json,
        change_summary = COALESCE(p_change_summary, change_summary),
        created_by = auth.uid(),
        created_at = timezone('utc', now())
    WHERE id = v_page.draft_revision_id
      AND status = 'draft'
    RETURNING * INTO v_revision;

    IF FOUND THEN
      UPDATE public.pages
      SET updated_by = auth.uid()
      WHERE id = p_page_id;
      RETURN v_revision;
    END IF;
  END IF;

  SELECT COALESCE(MAX(revision_number), 0) + 1
  INTO v_next_rev
  FROM public.page_revisions
  WHERE page_id = p_page_id;

  INSERT INTO public.page_revisions (page_id, revision_number, content_json, status, created_by, change_summary)
  VALUES (p_page_id, v_next_rev, p_content_json, 'draft', auth.uid(), COALESCE(p_change_summary, 'Initial draft'))
  RETURNING * INTO v_revision;

  UPDATE public.pages
  SET draft_revision_id = v_revision.id,
      updated_by = auth.uid()
  WHERE id = p_page_id;

  RETURN v_revision;
END;
$$;

-- 2. Atomic Publish Revision (SUPER_ADMIN only; creates immutable published snapshot)
CREATE OR REPLACE FUNCTION public.publish_page_revision(
  p_page_id uuid,
  p_expected_draft_revision_id uuid,
  p_change_summary text DEFAULT 'Published update'
)
RETURNS public.page_revisions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_page public.pages;
  v_draft public.page_revisions;
  v_next_rev integer;
  v_published public.page_revisions;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Publishing requires SUPER_ADMIN privileges.';
  END IF;

  SELECT * INTO v_page FROM public.pages WHERE id = p_page_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Page not found.';
  END IF;

  IF v_page.draft_revision_id IS NULL THEN
    RAISE EXCEPTION 'No draft revision exists to publish.';
  END IF;

  IF p_expected_draft_revision_id IS NOT NULL AND v_page.draft_revision_id IS DISTINCT FROM p_expected_draft_revision_id THEN
    RAISE EXCEPTION 'CONFLICT: A newer draft was saved before publishing. Review latest draft first.';
  END IF;

  SELECT * INTO v_draft FROM public.page_revisions WHERE id = v_page.draft_revision_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft revision record missing.';
  END IF;

  -- Mark previous published revision as superseded (immutable history preserved)
  IF v_page.published_revision_id IS NOT NULL THEN
    UPDATE public.page_revisions
    SET status = 'superseded'
    WHERE id = v_page.published_revision_id AND status = 'published';
  END IF;

  SELECT COALESCE(MAX(revision_number), 0) + 1
  INTO v_next_rev
  FROM public.page_revisions
  WHERE page_id = p_page_id;

  -- Create immutable published revision snapshot
  INSERT INTO public.page_revisions (
    page_id, revision_number, content_json, status, created_by, published_at, change_summary
  )
  VALUES (
    p_page_id,
    v_next_rev,
    v_draft.content_json,
    'published',
    auth.uid(),
    timezone('utc', now()),
    COALESCE(NULLIF(trim(p_change_summary), ''), v_draft.change_summary, 'Published update')
  )
  RETURNING * INTO v_published;

  UPDATE public.pages
  SET status = 'published',
      published_revision_id = v_published.id,
      published_at = v_published.published_at,
      updated_by = auth.uid()
  WHERE id = p_page_id;

  PERFORM public.write_audit_log(
    'page.publish',
    'pages',
    p_page_id,
    jsonb_build_object('revision_id', v_published.id, 'revision_number', v_published.revision_number, 'slug', v_page.slug)
  );

  RETURN v_published;
END;
$$;

-- 3. Restore Historical Revision into Draft (SUPER_ADMIN only)
CREATE OR REPLACE FUNCTION public.restore_page_revision(
  p_page_id uuid,
  p_source_revision_id uuid
)
RETURNS public.page_revisions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_source public.page_revisions;
  v_page public.pages;
  v_restored public.page_revisions;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Restoring revisions requires SUPER_ADMIN privileges.';
  END IF;

  SELECT * INTO v_page FROM public.pages WHERE id = p_page_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Page not found.';
  END IF;

  SELECT * INTO v_source FROM public.page_revisions WHERE id = p_source_revision_id AND page_id = p_page_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source revision not found for this page.';
  END IF;

  SELECT * INTO v_restored
  FROM public.save_page_draft(
    p_page_id,
    v_page.draft_revision_id,
    v_source.content_json,
    format('Restored from revision #%s', v_source.revision_number)
  );

  PERFORM public.write_audit_log(
    'page.restore_revision',
    'pages',
    p_page_id,
    jsonb_build_object('source_revision_id', p_source_revision_id, 'source_revision_number', v_source.revision_number)
  );

  RETURN v_restored;
END;
$$;

-- 4. Role Management RPC (SUPER_ADMIN only; non-self-service)
CREATE OR REPLACE FUNCTION public.assign_user_role(
  p_target_user_id uuid,
  p_new_role public.app_role,
  p_is_active boolean DEFAULT true
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_target public.profiles;
  v_super_count integer;
  v_updated public.profiles;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only SUPER_ADMIN may manage administrator roles.';
  END IF;

  SELECT * INTO v_target FROM public.profiles WHERE id = p_target_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target profile not found.';
  END IF;

  IF v_target.role = 'SUPER_ADMIN' AND (p_new_role <> 'SUPER_ADMIN' OR p_is_active = false) THEN
    SELECT COUNT(*) INTO v_super_count
    FROM public.profiles
    WHERE role = 'SUPER_ADMIN' AND is_active = true AND id <> p_target_user_id;

    IF v_super_count < 1 THEN
      RAISE EXCEPTION 'Cannot demote or deactivate the last active SUPER_ADMIN.';
    END IF;
  END IF;

  PERFORM set_config('klido.allow_role_change', 'true', true);

  UPDATE public.profiles
  SET role = p_new_role,
      is_active = p_is_active
  WHERE id = p_target_user_id
  RETURNING * INTO v_updated;

  PERFORM set_config('klido.allow_role_change', 'false', true);

  PERFORM public.write_audit_log(
    'user.role_updated',
    'profiles',
    p_target_user_id,
    jsonb_build_object('new_role', p_new_role, 'is_active', p_is_active, 'target_email', v_updated.email)
  );

  RETURN v_updated;
END;
$$;

-- 5. Resolve Expiring Preview Token (returns draft content only for valid unexpired token)
CREATE OR REPLACE FUNCTION public.resolve_preview_token(p_raw_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_hash text;
  v_token public.preview_tokens;
  v_page public.pages;
  v_revision public.page_revisions;
BEGIN
  IF p_raw_token IS NULL OR char_length(trim(p_raw_token)) < 16 THEN
    RAISE EXCEPTION 'Invalid preview token.';
  END IF;

  v_hash := encode(extensions.digest(p_raw_token, 'sha256'), 'hex');

  SELECT * INTO v_token
  FROM public.preview_tokens
  WHERE token_hash = v_hash AND expires_at > timezone('utc', now());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Preview token expired or invalid.';
  END IF;

  SELECT * INTO v_page FROM public.pages WHERE id = v_token.page_id;
  SELECT * INTO v_revision FROM public.page_revisions WHERE id = v_token.revision_id;

  RETURN jsonb_build_object(
    'page', to_jsonb(v_page),
    'revision', to_jsonb(v_revision),
    'expires_at', v_token.expires_at
  );
END;
$$;

-- 6. Safe Media Asset Deletion Check (prevents deleting assets referenced in published pages or visible items)
CREATE OR REPLACE FUNCTION public.check_media_asset_usage(p_asset_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset public.media_assets;
  v_published_refs integer;
  v_collection_refs integer;
BEGIN
  SELECT * INTO v_asset FROM public.media_assets WHERE id = p_asset_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('exists', false, 'published_refs', 0, 'collection_refs', 0);
  END IF;

  SELECT COUNT(*) INTO v_published_refs
  FROM public.pages p
  JOIN public.page_revisions r ON r.id = p.published_revision_id
  WHERE r.content_json::text LIKE '%' || v_asset.id::text || '%'
     OR r.content_json::text LIKE '%' || v_asset.public_url || '%';

  SELECT (
    (SELECT COUNT(*) FROM public.services WHERE image_asset_id = p_asset_id) +
    (SELECT COUNT(*) FROM public.projects WHERE cover_asset_id = p_asset_id) +
    (SELECT COUNT(*) FROM public.brands WHERE logo_asset_id = p_asset_id OR preview_asset_id = p_asset_id) +
    (SELECT COUNT(*) FROM public.testimonials WHERE avatar_asset_id = p_asset_id)
  ) INTO v_collection_refs;

  RETURN jsonb_build_object(
    'exists', true,
    'published_refs', v_published_refs,
    'collection_refs', v_collection_refs,
    'in_use', (v_published_refs > 0 OR v_collection_refs > 0)
  );
END;
$$;
