import { describe, expect, it } from 'vitest';
import {
  brandInputSchema,
  footerConfigSchema,
  generateSitemapXml,
  navigationItemInputSchema,
  projectInputSchema,
  redirectInputSchema,
  seoGlobalSchema,
  serviceInputSchema,
  testimonialInputSchema,
} from '../src/lib/contentApi';
import type { PageRecord } from '../src/types/database';

function makePage(
  overrides: Omit<Partial<PageRecord>, 'seo_metadata'> & {
    seo_metadata?: Partial<PageRecord['seo_metadata']>;
  }
): PageRecord {
  const { seo_metadata, ...rest } = overrides;
  return {
    id: '11111111-1111-4111-8111-111111111111',
    slug: '/',
    title: 'Home',
    page_type: 'home',
    status: 'published',
    draft_revision_id: null,
    published_revision_id: null,
    created_by: null,
    updated_by: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    published_at: '2026-01-03T00:00:00Z',
    ...rest,
    seo_metadata: {
      seoTitle: 'Klido | Home',
      metaDescription: 'Digital growth and ecommerce ops',
      canonicalUrl: '',
      ogTitle: 'Klido | Home',
      ogDescription: 'Digital growth and ecommerce ops',
      ogImage: '',
      robotsIndex: true,
      robotsFollow: true,
      ...seo_metadata,
    },
  };
}

describe('Milestone 7 — Content Managers, Redirects, SEO & Sitemap Generation', () => {
  it('validates service, project, brand, and testimonial inputs and blocks unsafe URLs', () => {
    expect(
      serviceInputSchema.safeParse({
        slug: 'growth-retainer',
        title: 'Growth Retainer',
        service_kind: 'plan',
        price_display: '₹75,000',
        cta_url: '/contact',
      }).success
    ).toBe(true);

    expect(
      serviceInputSchema.safeParse({
        slug: 'Invalid Slug!',
        title: 'Growth Retainer',
        cta_url: 'javascript:alert(1)',
      }).success
    ).toBe(false);

    expect(
      projectInputSchema.safeParse({
        slug: 'd2c-scale',
        title: 'D2C Scale Sprint',
        external_url: 'https://klido.in/work/d2c-scale',
        metrics: [{ label: 'ROAS', value: '4.2x' }],
      }).success
    ).toBe(true);

    expect(
      projectInputSchema.safeParse({
        slug: 'bad-project',
        title: 'Bad Project',
        external_url: 'data:text/html,<script>alert(1)</script>',
      }).success
    ).toBe(false);

    expect(
      brandInputSchema.safeParse({
        slug: 'acme-brand',
        name: 'Acme Brand',
        website_url: 'https://acme.example',
        instagram_url: '',
      }).success
    ).toBe(true);

    expect(
      brandInputSchema.safeParse({
        slug: 'acme-bad',
        name: 'Acme Bad',
        instagram_url: 'javascript:void(0)',
      }).success
    ).toBe(false);

    expect(
      testimonialInputSchema.safeParse({
        author_name: 'Aarav Mehta',
        quote: 'Klido stabilized our storefront operations in 4 weeks.',
      }).success
    ).toBe(true);
  });

  it('validates navigation items, redirects, global SEO, and footer config', () => {
    expect(
      navigationItemInputSchema.safeParse({
        location: 'header',
        label: 'Services',
        href: '/services',
        display_order: 1,
      }).success
    ).toBe(true);

    expect(
      navigationItemInputSchema.safeParse({
        location: 'header',
        label: 'XSS',
        href: 'javascript:alert(1)',
      }).success
    ).toBe(false);

    expect(
      redirectInputSchema.safeParse({
        source_path: '/old-services',
        destination_path: '/services',
        status_code: 301,
      }).success
    ).toBe(true);

    expect(
      redirectInputSchema.safeParse({
        source_path: 'missing-slash',
        destination_path: '/services',
        status_code: 301,
      }).success
    ).toBe(false);

    expect(
      seoGlobalSchema.safeParse({
        siteName: 'Klido',
        siteUrl: 'https://klido.in',
        defaultTitle: 'Klido — Growth & Operations',
        defaultMetaDescription: 'Agency partner for ecommerce brands.',
        defaultOgImage: '',
        faviconUrl: '',
        robotsTxt: 'User-agent: *\nAllow: /',
      }).success
    ).toBe(true);

    expect(
      footerConfigSchema.safeParse({
        description: 'Growth & Ecommerce Ops Studio',
        email: 'hello@klido.in',
        phone: '+91 9876543210',
        instagramHandle: '@klido.in',
        instagramUrl: 'https://instagram.com/klido.in',
        hours: 'Mon–Fri, 10am–7pm IST',
        location: 'Mumbai, India',
        copyrightText: '© Klido',
        tagline: 'Built for operational clarity.',
      }).success
    ).toBe(true);
  });

  it('generates clean XML sitemap including only published, indexable pages with no hash routes', () => {
    const pages: PageRecord[] = [
      makePage({ id: '1', slug: '/', status: 'published' }),
      makePage({
        id: '2',
        slug: '/services',
        status: 'published',
        seo_metadata: { robotsIndex: true },
      }),
      makePage({
        id: '3',
        slug: '/hidden-landing',
        status: 'published',
        seo_metadata: { robotsIndex: false },
      }),
      makePage({
        id: '4',
        slug: '/draft-page',
        status: 'draft',
        seo_metadata: { robotsIndex: true },
      }),
    ];

    const xml = generateSitemapXml('https://klido.in/', pages);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<loc>https://klido.in</loc>');
    expect(xml).toContain('<loc>https://klido.in/services</loc>');
    expect(xml).toContain('<priority>1.0</priority>');
    expect(xml).toContain('<priority>0.8</priority>');
    expect(xml).not.toContain('/hidden-landing');
    expect(xml).not.toContain('/draft-page');
    expect(xml).not.toContain('#/');
  });
});
