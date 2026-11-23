import { z } from 'zod';
import type { PageRecord, PageType } from '../types/database';

export interface ApprovedKlidoPageDefinition {
  order: number;
  title: string;
  slug: '/' | '/services' | '/approach' | '/contact' | '/about';
  page_type: Extract<PageType, 'home' | 'services' | 'approach' | 'contact' | 'about'>;
}

/**
 * Centralized Page Registry:
 * ONLY these five approved public routes are managed in Klido Studio CMS,
 * always presented in this exact canonical order.
 */
export const APPROVED_KLIDO_PAGES: readonly ApprovedKlidoPageDefinition[] = [
  { order: 1, title: 'Home', slug: '/', page_type: 'home' },
  { order: 2, title: 'Services', slug: '/services', page_type: 'services' },
  { order: 3, title: 'Approach', slug: '/approach', page_type: 'approach' },
  { order: 4, title: 'Contact', slug: '/contact', page_type: 'contact' },
  { order: 5, title: 'About', slug: '/about', page_type: 'about' },
] as const;

export const APPROVED_PAGE_SLUGS = new Set<string>(
  APPROVED_KLIDO_PAGES.map((p) => p.slug)
);

const ORDER_MAP = new Map<string, number>(
  APPROVED_KLIDO_PAGES.map((p) => [p.slug, p.order])
);

const DEFINITION_MAP = new Map<string, ApprovedKlidoPageDefinition>(
  APPROVED_KLIDO_PAGES.map((p) => [p.slug, p])
);

export function normalizeRegistrySlug(rawSlug: string): string {
  const trimmed = rawSlug.trim().toLowerCase();
  if (!trimmed || trimmed === '/') return '/';
  const withoutHash = trimmed.split('#')[0] ?? '/';
  const withoutQuery = withoutHash.split('?')[0] ?? '/';
  const withLeading = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return withLeading.length > 1 ? withLeading.replace(/\/+$/, '') : '/';
}

export function isApprovedCmsSlug(slug: string): boolean {
  return APPROVED_PAGE_SLUGS.has(normalizeRegistrySlug(slug));
}

export function getApprovedPageDefinition(
  slug: string
): ApprovedKlidoPageDefinition | undefined {
  return DEFINITION_MAP.get(normalizeRegistrySlug(slug));
}

export function getApprovedPageOrder(slug: string): number {
  return ORDER_MAP.get(normalizeRegistrySlug(slug)) ?? 999;
}

export const approvedPageSlugSchema = z
  .string()
  .trim()
  .transform(normalizeRegistrySlug)
  .refine((slug) => isApprovedCmsSlug(slug), {
    message:
      'Only the five approved Klido pages (/, /services, /approach, /contact, /about) are managed in Klido Studio.',
  });

/**
 * Filters a raw pages array strictly to non-archived records matching the
 * 5-page registry, deduplicates by normalized slug, and sorts in canonical order:
 * 1. Home (/), 2. Services (/services), 3. Approach (/approach), 4. Contact (/contact), 5. About (/about).
 */
export function filterAndSortApprovedPages<
  T extends Pick<PageRecord, 'slug' | 'status'>
>(pages: T[]): T[] {
  const deduped = new Map<string, T>();

  for (const page of pages) {
    const normalized = normalizeRegistrySlug(page.slug);
    if (!isApprovedCmsSlug(normalized)) continue;
    if (page.status === 'archived') continue;
    if (!deduped.has(normalized)) {
      deduped.set(normalized, page);
    }
  }

  return Array.from(deduped.values()).sort(
    (a, b) => getApprovedPageOrder(a.slug) - getApprovedPageOrder(b.slug)
  );
}
