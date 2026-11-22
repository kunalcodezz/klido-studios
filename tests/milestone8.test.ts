import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  fetchPublicSiteBundle,
  filterPublishedPublicPages,
  normalizePublicPath,
  resolveActiveRedirect,
  resolvePublicPageSeo,
} from '../src/lib/publicCmsClient';
import { DEFAULT_SEO_GLOBAL } from '../src/providers/GlobalSettingsProvider';
import type { PageRecord, RedirectRecord } from '../src/types/database';

function makePublicPage(
  overrides: Omit<Partial<PageRecord>, 'seo_metadata'> & {
    seo_metadata?: Partial<PageRecord['seo_metadata']>;
  }
): PageRecord {
  const { seo_metadata, ...rest } = overrides;
  return {
    id: '11111111-1111-4111-8111-111111111111',
    slug: '/services',
    title: 'Services',
    page_type: 'services',
    status: 'published',
    draft_revision_id: '22222222-2222-4222-8222-222222222222',
    published_revision_id: '33333333-3333-4333-8333-333333333333',
    created_by: null,
    updated_by: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    published_at: '2026-01-03T00:00:00Z',
    ...rest,
    seo_metadata: {
      seoTitle: 'Klido | Services',
      metaDescription: 'Performance & ecommerce operations',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      robotsIndex: true,
      robotsFollow: true,
      ...seo_metadata,
    },
  };
}

function collectSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

describe('Milestone 8 — Public Site Integration, Security Hygiene & Deployment Readiness', () => {
  it('enforces draft isolation by filtering out unpublished or pointerless pages', () => {
    const pages: PageRecord[] = [
      makePublicPage({ id: 'pub-1', status: 'published', published_revision_id: 'rev-1' }),
      makePublicPage({ id: 'draft-1', status: 'draft', published_revision_id: null }),
      makePublicPage({ id: 'broken-pub', status: 'published', published_revision_id: null }),
      makePublicPage({ id: 'arch-1', status: 'archived', published_revision_id: 'rev-2' }),
    ];

    const safePages = filterPublishedPublicPages(pages);
    expect(safePages.map((p) => p.id)).toEqual(['pub-1']);
  });

  it('normalizes paths, resolves safe active redirects, and blocks unsafe redirect destinations', () => {
    expect(normalizePublicPath('/services/')).toBe('/services');
    expect(normalizePublicPath('services#pricing')).toBe('/services');
    expect(normalizePublicPath('/')).toBe('/');

    const redirects: RedirectRecord[] = [
      {
        id: 'r1',
        source_path: '/old-pricing',
        destination_path: '/services',
        status_code: 301,
        is_active: true,
        notes: '',
        created_at: '',
        updated_at: '',
        created_by: null,
      },
      {
        id: 'r2',
        source_path: '/inactive',
        destination_path: '/about',
        status_code: 302,
        is_active: false,
        notes: '',
        created_at: '',
        updated_at: '',
        created_by: null,
      },
      {
        id: 'r3',
        source_path: '/xss-target',
        destination_path: 'javascript:alert(1)',
        status_code: 301,
        is_active: true,
        notes: '',
        created_at: '',
        updated_at: '',
        created_by: null,
      },
    ];

    expect(resolveActiveRedirect('/old-pricing/', redirects)).toEqual({
      destination: '/services',
      statusCode: 301,
    });
    expect(resolveActiveRedirect('/inactive', redirects)).toBeNull();
    expect(resolveActiveRedirect('/xss-target', redirects)).toBeNull();
  });

  it('resolves clean public SEO tags without hash routes and preserves fallback defaults', () => {
    const page = makePublicPage({
      slug: '/services',
      seo_metadata: {
        seoTitle: 'Services | Klido',
        canonicalUrl: 'https://www.klido.in/#services',
        ogImage: 'javascript:alert(1)',
      },
    });

    const seo = resolvePublicPageSeo(page, DEFAULT_SEO_GLOBAL);
    expect(seo.title).toBe('Services | Klido');
    expect(seo.canonicalUrl).toBe('https://www.klido.in/services');
    expect(seo.ogImage).toBe(DEFAULT_SEO_GLOBAL.defaultOgImage);
    expect(seo.robotsContent).toBe('index, follow');
  });

  it('verifies Vercel SPA + noindex security headers and codebase hygiene (zero dangerouslySetInnerHTML or service_role)', () => {
    const rootDir = process.cwd();
    const vercelRaw = fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8');
    const vercelConfig = JSON.parse(vercelRaw) as {
      framework: string;
      buildCommand: string;
      outputDirectory: string;
      rewrites: Array<{ source: string; destination: string }>;
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };

    expect(vercelConfig.framework).toBe('vite');
    expect(vercelConfig.outputDirectory).toBe('dist');
    expect(vercelConfig.rewrites).toContainEqual({
      source: '/(.*)',
      destination: '/index.html',
    });

    const globalHeaders =
      vercelConfig.headers.find((h) => h.source === '/(.*)')?.headers ?? [];
    expect(globalHeaders).toContainEqual({
      key: 'X-Robots-Tag',
      value: 'noindex, nofollow',
    });
    expect(globalHeaders).toContainEqual({
      key: 'X-Frame-Options',
      value: 'DENY',
    });

    const envExample = fs.readFileSync(path.join(rootDir, '.env.example'), 'utf8');
    expect(envExample).not.toMatch(/^\s*VITE_.*SERVICE_ROLE|sb_secret_/im);

    const srcFiles = collectSourceFiles(path.join(rootDir, 'src'));
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toContain('dangerouslySetInnerHTML');
      expect(content).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/);
    }

    expect(fs.existsSync(path.join(rootDir, 'DEPLOYMENT.md'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'EDITOR.md'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'docs', 'KLIDO_WEBSITE_INTEGRATION.md'))).toBe(true);
  });

  it('verifies live Supabase anon isolation across sensitive tables and public bundle fetch', async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      // Skip live remote check gracefully when running without env vars
      return;
    }

    const anonClient = createClient(url, key, { auth: { persistSession: false } });
    const [profilesRes, auditRes, draftsRes] = await Promise.all([
      anonClient.from('profiles').select('id').limit(1),
      anonClient.from('audit_logs').select('id').limit(1),
      anonClient.from('page_revisions').select('id').eq('status', 'draft').limit(1),
    ]);

    // Anon must see zero rows (or receive permission error) on private/draft resources
    expect(profilesRes.data ?? []).toHaveLength(0);
    expect(auditRes.data ?? []).toHaveLength(0);
    expect(draftsRes.data ?? []).toHaveLength(0);

    const bundle = await fetchPublicSiteBundle();
    expect(bundle.designTokens.colors.primary).toBeTruthy();
    expect(bundle.seoGlobal.siteName).toBeTruthy();
  });
});
