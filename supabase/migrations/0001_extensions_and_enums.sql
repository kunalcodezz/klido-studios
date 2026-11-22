-- ============================================================================
-- Klido Studio — Migration 0001: Extensions & Core Enums
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('SUPER_ADMIN', 'EDITOR', 'VIEWER');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'page_status') THEN
    CREATE TYPE public.page_status AS ENUM ('draft', 'published', 'archived');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'revision_status') THEN
    CREATE TYPE public.revision_status AS ENUM ('draft', 'published', 'superseded');
  END IF;
END
$$;
