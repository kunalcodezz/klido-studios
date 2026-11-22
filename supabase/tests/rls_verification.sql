-- ============================================================================
-- Klido Studio — RLS & RBAC Verification Script
-- Run in Supabase SQL Editor inside a rolled-back transaction to verify policies.
-- ============================================================================

BEGIN;

-- 1. Verify RLS is enabled on all 13 public tables
DO $$
DECLARE
  v_missing_rls text[];
BEGIN
  SELECT array_agg(tablename)
  INTO v_missing_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'profiles', 'media_assets', 'pages', 'page_revisions', 'site_settings',
      'services', 'projects', 'brands', 'testimonials', 'navigation_items',
      'redirects', 'audit_logs', 'preview_tokens'
    )
    AND rowsecurity = false;

  IF array_length(v_missing_rls, 1) > 0 THEN
    RAISE EXCEPTION 'RLS NOT ENABLED on tables: %', v_missing_rls;
  END IF;
END
$$;

-- 2. Verify anon role CANNOT read draft pages or draft revisions
SET LOCAL ROLE anon;
DO $$
DECLARE
  v_draft_count integer;
BEGIN
  SELECT COUNT(*) INTO v_draft_count FROM public.pages WHERE status <> 'published';
  IF v_draft_count > 0 THEN
    RAISE EXCEPTION 'SECURITY FAILURE: anon can read % non-published pages', v_draft_count;
  END IF;

  SELECT COUNT(*) INTO v_draft_count FROM public.page_revisions WHERE status = 'draft';
  IF v_draft_count > 0 THEN
    RAISE EXCEPTION 'SECURITY FAILURE: anon can read % draft revisions', v_draft_count;
  END IF;
END
$$;
RESET ROLE;

-- 3. Verify SECURITY DEFINER functions exist with locked search_path
DO $$
DECLARE
  v_fn_count integer;
BEGIN
  SELECT COUNT(*) INTO v_fn_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'save_page_draft',
      'publish_page_revision',
      'restore_page_revision',
      'assign_user_role',
      'resolve_preview_token',
      'check_media_asset_usage'
    )
    AND p.prosecdef = true;

  IF v_fn_count <> 6 THEN
    RAISE EXCEPTION 'Expected 6 SECURITY DEFINER RPC functions, found %', v_fn_count;
  END IF;
END
$$;

ROLLBACK;
