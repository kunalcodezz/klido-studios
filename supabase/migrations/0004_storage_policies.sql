-- ============================================================================
-- Klido Studio — Migration 0004: Supabase Storage Bucket & Policies
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'klido-media',
  'klido-media',
  true,
  10485760, -- 10 MB per upload
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/avif',
    'image/gif',
    'video/mp4',
    'video/webm'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read access for published website media
DROP POLICY IF EXISTS klido_media_public_read ON storage.objects;
CREATE POLICY klido_media_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'klido-media');

-- Authenticated EDITOR or SUPER_ADMIN can upload media
DROP POLICY IF EXISTS klido_media_editor_insert ON storage.objects;
CREATE POLICY klido_media_editor_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'klido-media'
    AND public.is_editor_or_above()
  );

-- Authenticated EDITOR or SUPER_ADMIN can replace/update media metadata
DROP POLICY IF EXISTS klido_media_editor_update ON storage.objects;
CREATE POLICY klido_media_editor_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'klido-media'
    AND public.is_editor_or_above()
  )
  WITH CHECK (
    bucket_id = 'klido-media'
    AND public.is_editor_or_above()
  );

-- Only SUPER_ADMIN can delete objects directly from storage
DROP POLICY IF EXISTS klido_media_super_admin_delete ON storage.objects;
CREATE POLICY klido_media_super_admin_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'klido-media'
    AND public.is_super_admin()
  );
