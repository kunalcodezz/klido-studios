-- ============================================================================
-- Klido Studio — Migration 0006: Enforce Strict 5-Page CMS Registry
-- Non-destructively archives any obsolete, duplicate, or experimental pages
-- outside the five approved Klido routes:
--   1. Home (/)
--   2. Services (/services)
--   3. Approach (/approach)
--   4. Contact (/contact)
--   5. About (/about)
-- ============================================================================

-- 1. Archive non-approved CMS pages safely (preserving all historical revisions)
UPDATE public.pages
SET
  status = 'archived',
  published_revision_id = NULL,
  updated_at = timezone('utc', now())
WHERE slug NOT IN ('/', '/services', '/approach', '/contact', '/about')
  AND status <> 'archived';

-- 2. Enforce at DB constraint level that only the 5 approved slugs can be active (draft/published)
ALTER TABLE public.pages
  DROP CONSTRAINT IF EXISTS chk_pages_approved_active_slug;

ALTER TABLE public.pages
  ADD CONSTRAINT chk_pages_approved_active_slug
  CHECK (
    slug IN ('/', '/services', '/approach', '/contact', '/about')
    OR status = 'archived'
  );
