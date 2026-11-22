import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { validatePageContentTree } from './schemaValidator';
import { isSafeUrl } from '../schemas/validation';
import { DEFAULT_KLIDO_DESIGN_TOKENS, type DesignSystemTokens } from '../schemas/styles';
import {
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_SEO_GLOBAL,
  type FooterConfig,
  type SeoGlobalConfig,
} from '../providers/GlobalSettingsProvider';
import type { PageContentTree } from '../schemas/blocks';
import type {
  BrandRecord,
  NavigationItemRecord,
  PageRecord,
  ProjectRecord,
  RedirectRecord,
  ServiceRecord,
  TestimonialRecord,
} from '../types/database';

export interface PublishedPagePayload {
  page: PageRecord;
  tree: PageContentTree;
  seo: ResolvedPublicSeo;
}

export interface ResolvedPublicSeo {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  robotsContent: string;
}

export interface PublicSiteBundle {
  designTokens: DesignSystemTokens;
  footerConfig: FooterConfig;
  seoGlobal: SeoGlobalConfig;
  navigationItems: NavigationItemRecord[];
  redirects: RedirectRecord[];
  services: ServiceRecord[];
  projects: ProjectRecord[];
  brands: BrandRecord[];
  testimonials: TestimonialRecord[];
}

export function normalizePublicPath(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === '/') return '/';
  const withoutHash = trimmed.split('#')[0] ?? '/';
  const withoutQuery = withoutHash.split('?')[0] ?? '/';
  const withLeading = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return withLeading.length > 1 ? withLeading.replace(/\/+$/, '') : '/';
}

/**
 * Defensive public-site guard: ensures unpublished pages or pages without
 * a published revision pointer are never rendered on klido-website.
 */
export function filterPublishedPublicPages(pages: PageRecord[]): PageRecord[] {
  return pages.filter(
    (page) => page.status === 'published' && Boolean(page.published_revision_id)
  );
}

/**
 * Matches an incoming pathname against active redirects while ensuring
 * destination URLs pass the strict safe-protocol allowlist.
 */
export function resolveActiveRedirect(
  pathname: string,
  redirects: RedirectRecord[]
): { destination: string; statusCode: 301 | 302 | 307 | 308 } | null {
  const normalized = normalizePublicPath(pathname);
  const match = redirects.find(
    (r) =>
      r.is_active &&
      normalizePublicPath(r.source_path) === normalized &&
      isSafeUrl(r.destination_path)
  );

  if (!match) return null;
  return {
    destination: match.destination_path,
    statusCode: match.status_code,
  };
}

/**
 * Computes safe document <head> SEO attributes for a published public page.
 * Strips legacy hash URLs from canonical/OG URLs.
 */
export function resolvePublicPageSeo(
  page: PageRecord,
  seoGlobal: SeoGlobalConfig = DEFAULT_SEO_GLOBAL
): ResolvedPublicSeo {
  const baseUrl = seoGlobal.siteUrl.replace(/\/+$/, '');
  const slugPath = page.slug === '/' ? '' : normalizePublicPath(page.slug);
  const defaultCanonical = `${baseUrl}${slugPath}`;

  const rawCanonical = page.seo_metadata?.canonicalUrl?.trim() ?? '';
  const canonicalUrl =
    rawCanonical && isSafeUrl(rawCanonical) && !rawCanonical.includes('#')
      ? rawCanonical
      : defaultCanonical;

  const rawOgImage = page.seo_metadata?.ogImage?.trim() ?? '';
  const ogImage =
    rawOgImage && isSafeUrl(rawOgImage) ? rawOgImage : seoGlobal.defaultOgImage;

  const title = page.seo_metadata?.seoTitle?.trim() || `${page.title} | ${seoGlobal.siteName}`;
  const description =
    page.seo_metadata?.metaDescription?.trim() || seoGlobal.defaultMetaDescription;

  const indexDirective = page.seo_metadata?.robotsIndex === false ? 'noindex' : 'index';
  const followDirective = page.seo_metadata?.robotsFollow === false ? 'nofollow' : 'follow';

  return {
    title,
    description,
    canonicalUrl,
    ogTitle: page.seo_metadata?.ogTitle?.trim() || title,
    ogDescription: page.seo_metadata?.ogDescription?.trim() || description,
    ogImage,
    robotsContent: `${indexDirective}, ${followDirective}`,
  };
}

/**
 * Fetches a single published page and its immutable published revision
 * for klido-website. Never queries or exposes draft revisions.
 */
export async function fetchPublishedPageBySlug(
  rawSlug: string,
  seoGlobal: SeoGlobalConfig = DEFAULT_SEO_GLOBAL
): Promise<PublishedPagePayload | null> {
  if (!isSupabaseConfigured) return null;
  const slug = normalizePublicPath(rawSlug);
  const supabase = getSupabaseClient();

  const { data: pageData, error: pageError } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .not('published_revision_id', 'is', null)
    .maybeSingle();

  if (pageError || !pageData) return null;
  const page = pageData as PageRecord;

  if (!page.published_revision_id) return null;

  const { data: revData, error: revError } = await supabase
    .from('page_revisions')
    .select('id, content_json, status')
    .eq('id', page.published_revision_id)
    .eq('status', 'published')
    .maybeSingle();

  if (revError || !revData) return null;

  const validation = validatePageContentTree(revData.content_json);
  return {
    page,
    tree: validation.tree,
    seo: resolvePublicPageSeo(page, seoGlobal),
  };
}

/**
 * Loads public site settings, navigation, redirects, and visible collections
 * in parallel for klido-website hydration.
 */
export async function fetchPublicSiteBundle(): Promise<PublicSiteBundle> {
  if (!isSupabaseConfigured) {
    return {
      designTokens: DEFAULT_KLIDO_DESIGN_TOKENS,
      footerConfig: DEFAULT_FOOTER_CONFIG,
      seoGlobal: DEFAULT_SEO_GLOBAL,
      navigationItems: [],
      redirects: [],
      services: [],
      projects: [],
      brands: [],
      testimonials: [],
    };
  }

  const supabase = getSupabaseClient();
  const [
    settingsRes,
    navRes,
    redirectsRes,
    servicesRes,
    projectsRes,
    brandsRes,
    testimonialsRes,
  ] = await Promise.all([
    supabase.from('site_settings').select('setting_key, setting_value').eq('is_public', true),
    supabase
      .from('navigation_items')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true }),
    supabase.from('redirects').select('*').eq('is_active', true),
    supabase
      .from('services')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('projects')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('brands')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('testimonials')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true }),
  ]);

  const settingsMap = new Map<string, Record<string, unknown>>();
  for (const row of settingsRes.data ?? []) {
    settingsMap.set(
      row.setting_key as string,
      (row.setting_value as Record<string, unknown>) ?? {}
    );
  }

  return {
    designTokens: {
      ...DEFAULT_KLIDO_DESIGN_TOKENS,
      ...(settingsMap.get('design_system') as Partial<DesignSystemTokens> | undefined),
    },
    footerConfig: {
      ...DEFAULT_FOOTER_CONFIG,
      ...(settingsMap.get('footer_config') as Partial<FooterConfig> | undefined),
    },
    seoGlobal: {
      ...DEFAULT_SEO_GLOBAL,
      ...(settingsMap.get('seo_global') as Partial<SeoGlobalConfig> | undefined),
    },
    navigationItems: (navRes.data ?? []) as NavigationItemRecord[],
    redirects: (redirectsRes.data ?? []) as RedirectRecord[],
    services: (servicesRes.data ?? []) as ServiceRecord[],
    projects: (projectsRes.data ?? []) as ProjectRecord[],
    brands: (brandsRes.data ?? []) as BrandRecord[],
    testimonials: (testimonialsRes.data ?? []) as TestimonialRecord[],
  };
}
