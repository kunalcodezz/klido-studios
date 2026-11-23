import { z } from 'zod';
import { getSupabaseClient } from './supabase';
import {
  designSystemTokensSchema,
  type DesignSystemTokens,
} from '../schemas/styles';
import {
  optionalSafeUrlSchema,
  safeUrlSchema,
  slugSchema,
} from '../schemas/validation';
import { filterAndSortApprovedPages } from '../data/pageRegistry';
import type {
  BrandRecord,
  MediaAsset,
  NavigationItemRecord,
  PageRecord,
  ProjectRecord,
  RedirectRecord,
  ServiceRecord,
  TestimonialRecord,
} from '../types/database';
import type { FooterConfig, SeoGlobalConfig } from '../providers/GlobalSettingsProvider';

const itemSlugRegex = /^[a-z0-9-]+$/;

export const serviceInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).regex(itemSlugRegex, 'Slug must be lowercase letters, numbers, and hyphens.'),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(240).default(''),
  description: z.string().trim().max(2000).default(''),
  service_kind: z.enum(['plan', 'practice_area']).default('plan'),
  price_display: z.string().trim().max(40).default(''),
  original_price_display: z.string().trim().max(40).default(''),
  discount_label: z.string().trim().max(40).default(''),
  billing_period: z.string().trim().max(30).default('/month'),
  image_asset_id: z.string().uuid().nullable().default(null),
  features: z.array(z.string().trim().min(1)).default([]),
  deliverables: z.array(z.string().trim().min(1)).default([]),
  tooling: z.array(z.string().trim().min(1)).default([]),
  mapped_disciplines: z.array(z.string().trim().min(1)).default([]),
  cadence: z.string().trim().max(120).default(''),
  cta_label: z.string().trim().max(60).default('Get Started'),
  cta_url: safeUrlSchema.default('/contact'),
  is_featured: z.boolean().default(false),
  is_visible: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
});

export const projectInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).regex(itemSlugRegex, 'Slug must be lowercase letters, numbers, and hyphens.'),
  title: z.string().trim().min(1).max(140),
  client_name: z.string().trim().max(120).default(''),
  summary: z.string().trim().max(320).default(''),
  description: z.string().trim().max(3000).default(''),
  category: z.string().trim().max(80).default('Growth'),
  cover_asset_id: z.string().uuid().nullable().default(null),
  external_url: optionalSafeUrlSchema.default(''),
  metrics: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(60),
        value: z.string().trim().min(1).max(60),
      })
    )
    .default([]),
  is_featured: z.boolean().default(false),
  is_visible: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
});

export const brandInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).regex(itemSlugRegex, 'Slug must be lowercase letters, numbers, and hyphens.'),
  name: z.string().trim().min(1).max(120),
  logo_asset_id: z.string().uuid().nullable().default(null),
  preview_asset_id: z.string().uuid().nullable().default(null),
  description: z.string().trim().max(1000).default(''),
  scopes: z.array(z.string().trim().min(1)).default([]),
  filter_keys: z.array(z.string().trim().min(1)).default([]),
  website_url: optionalSafeUrlSchema.default(''),
  instagram_url: optionalSafeUrlSchema.default(''),
  layout_variant: z.enum(['card', 'wide']).default('card'),
  display_order: z.number().int().min(0).default(0),
  is_visible: z.boolean().default(true),
});

export const testimonialInputSchema = z.object({
  id: z.string().uuid().optional(),
  author_name: z.string().trim().min(1).max(100),
  author_designation: z.string().trim().max(120).default(''),
  company_name: z.string().trim().max(120).default(''),
  quote: z.string().trim().min(1).max(1500),
  avatar_asset_id: z.string().uuid().nullable().default(null),
  project_id: z.string().uuid().nullable().default(null),
  service_id: z.string().uuid().nullable().default(null),
  is_featured: z.boolean().default(false),
  is_visible: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
});

export const navigationItemInputSchema = z.object({
  id: z.string().uuid().optional(),
  location: z.enum(['header', 'footer_practice', 'footer_engage', 'footer_legal']),
  parent_id: z.string().uuid().nullable().default(null),
  label: z.string().trim().min(1).max(80),
  href: safeUrlSchema,
  is_external: z.boolean().default(false),
  is_cta: z.boolean().default(false),
  display_order: z.number().int().min(0).default(0),
  is_visible: z.boolean().default(true),
});

export const redirectInputSchema = z.object({
  id: z.string().uuid().optional(),
  source_path: slugSchema,
  destination_path: safeUrlSchema,
  status_code: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]).default(301),
  is_active: z.boolean().default(true),
  notes: z.string().trim().max(240).default(''),
});

export const seoGlobalSchema = z.object({
  siteName: z.string().trim().min(1).max(100),
  siteUrl: safeUrlSchema,
  defaultTitle: z.string().trim().min(1).max(160),
  defaultMetaDescription: z.string().trim().max(320),
  defaultOgImage: optionalSafeUrlSchema.default(''),
  faviconUrl: optionalSafeUrlSchema.default(''),
  robotsTxt: z.string().max(4000).default(''),
});

export const footerConfigSchema = z.object({
  description: z.string().trim().max(400),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40),
  instagramHandle: z.string().trim().max(60),
  instagramUrl: optionalSafeUrlSchema.default(''),
  hours: z.string().trim().max(80),
  location: z.string().trim().max(80),
  copyrightText: z.string().trim().max(120),
  tagline: z.string().trim().max(160),
});

export async function listServices(): Promise<ServiceRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ServiceRecord[];
}

export async function upsertService(input: z.input<typeof serviceInputSchema>): Promise<ServiceRecord> {
  const parsed = serviceInputSchema.parse(input);
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const payload = { ...parsed, updated_by: user?.id ?? null };

  if (parsed.id) {
    const { data, error } = await supabase
      .from('services')
      .update(payload)
      .eq('id', parsed.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as ServiceRecord;
  }

  const { data, error } = await supabase
    .from('services')
    .insert({ ...payload, created_by: user?.id ?? null })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as ServiceRecord;
}

export async function deleteService(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectRecord[];
}

export async function upsertProject(input: z.input<typeof projectInputSchema>): Promise<ProjectRecord> {
  const parsed = projectInputSchema.parse(input);
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const payload = { ...parsed, updated_by: user?.id ?? null };

  if (parsed.id) {
    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', parsed.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as ProjectRecord;
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...payload, created_by: user?.id ?? null })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as ProjectRecord;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listBrands(): Promise<BrandRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BrandRecord[];
}

export async function upsertBrand(input: z.input<typeof brandInputSchema>): Promise<BrandRecord> {
  const parsed = brandInputSchema.parse(input);
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const payload = { ...parsed, updated_by: user?.id ?? null };

  if (parsed.id) {
    const { data, error } = await supabase
      .from('brands')
      .update(payload)
      .eq('id', parsed.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as BrandRecord;
  }

  const { data, error } = await supabase
    .from('brands')
    .insert({ ...payload, created_by: user?.id ?? null })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as BrandRecord;
}

export async function deleteBrand(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listTestimonials(): Promise<TestimonialRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TestimonialRecord[];
}

export async function upsertTestimonial(
  input: z.input<typeof testimonialInputSchema>
): Promise<TestimonialRecord> {
  const parsed = testimonialInputSchema.parse(input);
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const payload = { ...parsed, updated_by: user?.id ?? null };

  if (parsed.id) {
    const { data, error } = await supabase
      .from('testimonials')
      .update(payload)
      .eq('id', parsed.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as TestimonialRecord;
  }

  const { data, error } = await supabase
    .from('testimonials')
    .insert({ ...payload, created_by: user?.id ?? null })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as TestimonialRecord;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listNavigationItems(): Promise<NavigationItemRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('navigation_items')
    .select('*')
    .order('location', { ascending: true })
    .order('display_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as NavigationItemRecord[];
}

export async function upsertNavigationItem(
  input: z.input<typeof navigationItemInputSchema>
): Promise<NavigationItemRecord> {
  const parsed = navigationItemInputSchema.parse(input);
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const payload = { ...parsed, updated_by: user?.id ?? null };

  if (parsed.id) {
    const { data, error } = await supabase
      .from('navigation_items')
      .update(payload)
      .eq('id', parsed.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as NavigationItemRecord;
  }

  const { data, error } = await supabase
    .from('navigation_items')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as NavigationItemRecord;
}

export async function deleteNavigationItem(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('navigation_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listRedirects(): Promise<RedirectRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('redirects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RedirectRecord[];
}

export async function upsertRedirect(
  input: z.input<typeof redirectInputSchema>
): Promise<RedirectRecord> {
  const parsed = redirectInputSchema.parse(input);
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (parsed.id) {
    const { data, error } = await supabase
      .from('redirects')
      .update(parsed)
      .eq('id', parsed.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as RedirectRecord;
  }

  const { data, error } = await supabase
    .from('redirects')
    .insert({ ...parsed, created_by: user?.id ?? null })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as RedirectRecord;
}

export async function deleteRedirect(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('redirects').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listMediaAssets(): Promise<MediaAsset[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MediaAsset[];
}

export async function updateMediaAltText(id: string, altText: string): Promise<MediaAsset> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('media_assets')
    .update({ alt_text: altText.trim().slice(0, 300) })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as MediaAsset;
}

export async function saveSiteSetting(
  settingKey: 'design_system' | 'seo_global' | 'footer_config',
  value: DesignSystemTokens | SeoGlobalConfig | FooterConfig
): Promise<void> {
  if (settingKey === 'design_system') {
    designSystemTokensSchema.parse(value);
  } else if (settingKey === 'seo_global') {
    seoGlobalSchema.parse(value);
  } else if (settingKey === 'footer_config') {
    footerConfigSchema.parse(value);
  }

  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('site_settings').upsert(
    {
      setting_key: settingKey,
      setting_value: value as unknown as Record<string, unknown>,
      is_public: true,
      updated_by: user?.id ?? null,
    },
    { onConflict: 'setting_key' }
  );

  if (error) throw new Error(error.message);
}

export function generateSitemapXml(siteUrl: string, pages: PageRecord[]): string {
  const normalizedBase = siteUrl.replace(/\/+$/, '');
  const indexablePages = filterAndSortApprovedPages(pages).filter(
    (p) => p.status === 'published' && p.seo_metadata?.robotsIndex !== false
  );

  const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const urls = indexablePages
    .map((p) => {
      const path = p.slug === '/' ? '' : p.slug;
      const loc = escapeXml(`${normalizedBase}${path}`);
      const lastmod = (p.published_at || p.updated_at || new Date().toISOString()).slice(0, 10);
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${p.slug === '/' ? '1.0' : '0.8'}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}
