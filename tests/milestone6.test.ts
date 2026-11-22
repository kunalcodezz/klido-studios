import { describe, expect, it } from 'vitest';
import { createBlockNode } from '../src/blocks/registry';
import {
  computeRevisionDiffSummary,
  createPageInputSchema,
  generateSecurePreviewToken,
  resolvePreviewPage,
  seoMetadataInputSchema,
  sha256Hex,
} from '../src/lib/revisionsApi';

describe('Milestone 6 — Drafts, Preview Tokens, Publishing & Revision Diffs', () => {
  it('generates high-entropy preview tokens and deterministic 64-char SHA-256 hashes', async () => {
    const t1 = generateSecurePreviewToken();
    const t2 = generateSecurePreviewToken();
    expect(t1.length).toBeGreaterThanOrEqual(48);
    expect(t1).not.toBe(t2);

    const h1 = await sha256Hex(t1);
    const h2 = await sha256Hex(t1);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(t1);
  });

  it('computes accurate structural diff summaries across added, modified, reordered, and removed sections', () => {
    const hero = createBlockNode('hero');
    const services = createBlockNode('services-grid');
    const faq = createBlockNode('faq');
    const cta = createBlockNode('cta');

    const baselineTree = {
      version: 1 as const,
      sections: [hero, services, faq],
    };

    const modifiedHero = {
      ...hero,
      props: { ...hero.props, eyebrow: 'UPDATED EYEBROW' },
    };

    // hero modified, services reordered after faq, faq removed, cta added
    const targetTree = {
      version: 1 as const,
      sections: [cta, modifiedHero, services],
    };

    const diff = computeRevisionDiffSummary(targetTree, baselineTree);
    expect(diff.addedCount).toBe(1);
    expect(diff.modifiedCount).toBe(1);
    expect(diff.reorderedCount).toBe(1);
    expect(diff.removedCount).toBe(1);
  });

  it('validates new page slugs and blocks unsafe SEO canonical/OG URLs', () => {
    expect(
      createPageInputSchema.safeParse({
        title: 'Growth Sprint',
        slug: '/growth-sprint',
        page_type: 'landing',
      }).success
    ).toBe(true);

    expect(
      createPageInputSchema.safeParse({
        title: 'Bad Slug',
        slug: 'no-leading-slash',
        page_type: 'landing',
      }).success
    ).toBe(false);

    expect(
      seoMetadataInputSchema.safeParse({
        seoTitle: 'Klido | Services',
        metaDescription: 'Performance & operations',
        canonicalUrl: 'javascript:alert(1)',
        ogImage: '',
        robotsIndex: true,
        robotsFollow: true,
      }).success
    ).toBe(false);
  });

  it('rejects unauthenticated preview requests lacking a preview token', async () => {
    await expect(
      resolvePreviewPage('00000000-0000-0000-0000-000000000001', null)
    ).rejects.toThrow(/Sign in or provide a valid preview token/i);
  });
});
