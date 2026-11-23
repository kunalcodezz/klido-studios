import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { KLIDO_SEED_PAGES } from '../src/data/klidoSeedPages';
import {
  APPROVED_KLIDO_PAGES,
  approvedPageSlugSchema,
  filterAndSortApprovedPages,
  isApprovedCmsSlug,
} from '../src/data/pageRegistry';
import { filterPublishedPublicPages } from '../src/lib/publicCmsClient';
import type { PageRecord } from '../src/types/database';

function makeRecord(slug: string, status: PageRecord['status'] = 'published'): PageRecord {
  return {
    id: `id-${slug}`,
    slug,
    title: slug === '/' ? 'Home' : slug.slice(1),
    page_type: 'standard',
    status,
    published_revision_id: status === 'published' ? `rev-${slug}` : null,
    draft_revision_id: `draft-${slug}`,
    published_at: status === 'published' ? '2026-01-01T00:00:00Z' : null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    created_by: null,
    updated_by: null,
    seo_metadata: {
      seoTitle: 'Klido',
      metaDescription: 'Klido',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      robotsIndex: true,
      robotsFollow: true,
    },
  };
}

describe('Strict 5-Page Management Registry & Dashboard Isolation', () => {
  it('defines strictly five approved Klido pages in exact canonical order', () => {
    expect(APPROVED_KLIDO_PAGES).toHaveLength(5);
    expect(APPROVED_KLIDO_PAGES.map((p) => `${p.title}:${p.slug}`)).toEqual([
      'Home:/',
      'Services:/services',
      'Approach:/approach',
      'Contact:/contact',
      'About:/about',
    ]);

    expect(KLIDO_SEED_PAGES.map((p) => `${p.title}:${p.slug}`)).toEqual([
      'Home:/',
      'Services:/services',
      'Approach:/approach',
      'Contact:/contact',
      'About:/about',
    ]);
  });

  it('filters out internal, auth, preview, test, duplicate, and archived routes and preserves canonical ordering', () => {
    const noisyRows: PageRecord[] = [
      makeRecord('/about', 'published'),
      makeRecord('/login', 'published'),
      makeRecord('/dashboard/users', 'published'),
      makeRecord('/preview/1234', 'draft'),
      makeRecord('/test-landing', 'published'),
      makeRecord('/contact', 'draft'),
      makeRecord('/services', 'published'),
      makeRecord('/services', 'draft'), // duplicate slug should be deduped
      makeRecord('/approach', 'published'),
      makeRecord('/', 'published'),
      makeRecord('/old-experimental', 'archived'),
    ];

    const cleaned = filterAndSortApprovedPages(noisyRows);
    expect(cleaned).toHaveLength(5);
    expect(cleaned.map((p) => p.slug)).toEqual([
      '/',
      '/services',
      '/approach',
      '/contact',
      '/about',
    ]);
  });

  it('rejects unapproved slugs at schema validation boundary while preserving internal system routes in App.tsx', () => {
    expect(isApprovedCmsSlug('/services/')).toBe(true);
    expect(isApprovedCmsSlug('/login')).toBe(false);
    expect(isApprovedCmsSlug('/preview/abc')).toBe(false);
    expect(isApprovedCmsSlug('/test-page')).toBe(false);

    expect(approvedPageSlugSchema.safeParse('/approach').success).toBe(true);
    expect(approvedPageSlugSchema.safeParse('/experimental').success).toBe(false);

    // Ensure technical/system routes still exist in App.tsx outside CMS page listing
    const appSource = fs.readFileSync(path.join(process.cwd(), 'src', 'App.tsx'), 'utf8');
    expect(appSource).toContain('path="/login"');
    expect(appSource).toContain('path="/preview/:pageId"');
    expect(appSource).toContain('path="*"');
  });

  it('restricts public website page synchronization strictly to published approved routes', () => {
    const rows: PageRecord[] = [
      makeRecord('/', 'published'),
      makeRecord('/contact', 'draft'),
      makeRecord('/internal-test', 'published'),
      makeRecord('/about', 'published'),
    ];

    const publicPages = filterPublishedPublicPages(rows);
    expect(publicPages.map((p) => p.slug)).toEqual(['/', '/about']);
  });
});
