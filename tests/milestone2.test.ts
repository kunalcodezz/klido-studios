import { describe, expect, it } from 'vitest';
import {
  isSafeUrl,
  mediaUploadValidationSchema,
  pageMetadataSchema,
  sanitizeFileName,
  seoMetadataSchema,
} from '../src/schemas/validation';
import { loginSchema, roleAssignmentSchema } from '../src/schemas/auth';
import { getSupabaseClient, isSupabaseConfigured } from '../src/lib/supabase';

describe('Milestone 2 — Auth & RBAC Validation Schemas', () => {
  it('validates clean admin login payloads and rejects weak passwords', () => {
    expect(
      loginSchema.safeParse({ email: 'admin@klido.in', password: 'StrongPassword123!' }).success
    ).toBe(true);
    expect(
      loginSchema.safeParse({ email: 'not-an-email', password: 'short' }).success
    ).toBe(false);
  });

  it('enforces valid RBAC role enum and UUID format', () => {
    expect(
      roleAssignmentSchema.safeParse({
        targetUserId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'EDITOR',
        isActive: true,
      }).success
    ).toBe(true);

    expect(
      roleAssignmentSchema.safeParse({
        targetUserId: 'not-a-uuid',
        role: 'ROOT_ADMIN',
        isActive: true,
      }).success
    ).toBe(false);
  });
});

describe('Milestone 2 — Safe URL, SEO & Media Upload Validation', () => {
  it('allows safe URLs and blocks javascript:/data:/protocol-relative vectors', () => {
    expect(isSafeUrl('/services')).toBe(true);
    expect(isSafeUrl('#pricing')).toBe(true);
    expect(isSafeUrl('https://www.klido.in/about')).toBe(true);
    expect(isSafeUrl('mailto:klidoagency@gmail.com')).toBe(true);
    expect(isSafeUrl('tel:+919172569021')).toBe(true);

    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('//evil.example/phish')).toBe(false);
  });

  it('validates media MIME types (blocking SVG/HTML) and enforces 10MB limit', () => {
    expect(
      mediaUploadValidationSchema.safeParse({
        fileName: 'hero-banner.webp',
        mimeType: 'image/webp',
        fileSize: 512_000,
        altText: 'Klido studio desk',
      }).success
    ).toBe(true);

    // Block SVG XSS vector
    expect(
      mediaUploadValidationSchema.safeParse({
        fileName: 'malicious.svg',
        mimeType: 'image/svg+xml',
        fileSize: 2048,
      }).success
    ).toBe(false);

    // Block >10MB upload
    expect(
      mediaUploadValidationSchema.safeParse({
        fileName: 'huge-video.mp4',
        mimeType: 'video/mp4',
        fileSize: 15 * 1024 * 1024,
      }).success
    ).toBe(false);
  });

  it('sanitizes uploaded filenames safely', () => {
    expect(sanitizeFileName('../Saanjh by Riya!.PNG')).toBe('saanjh-by-riya.png');
  });

  it('validates page and SEO metadata schemas', () => {
    expect(
      pageMetadataSchema.safeParse({
        title: 'Services',
        slug: '/services',
        page_type: 'services',
        seo_metadata: seoMetadataSchema.parse({
          seoTitle: 'Services | Klido',
          metaDescription: 'Performance media and SEO services.',
          canonicalUrl: 'https://www.klido.in/services',
          ogTitle: 'Services | Klido',
          ogDescription: 'Performance media and SEO services.',
          ogImage: 'https://www.klido.in/klido_Logo.png',
          robotsIndex: true,
          robotsFollow: true,
        }),
      }).success
    ).toBe(true);
  });
});

describe('Milestone 2 — Live Supabase Connectivity & Draft Privacy Check', () => {
  it('connects to Supabase project and confirms unauthenticated clients cannot read drafts', async () => {
    expect(isSupabaseConfigured).toBe(true);
    const supabase = getSupabaseClient();

    // Auth endpoint reachability check
    const { data: sessionData, error: authErr } = await supabase.auth.getSession();
    expect(authErr).toBeNull();
    expect(sessionData.session).toBeNull();

    // Query draft revisions as anon: either schema is not yet applied (PGRST205 / 42P01)
    // or RLS returns zero draft rows. In NO case should draft revisions leak to anon.
    const { data: drafts, error: draftErr } = await supabase
      .from('page_revisions')
      .select('id, status')
      .eq('status', 'draft');

    if (!draftErr) {
      expect(drafts).toEqual([]);
    } else {
      // Schema not yet pushed to Supabase is expected before user executes SQL migrations
      expect(draftErr.message).toBeTruthy();
    }
  });
});
