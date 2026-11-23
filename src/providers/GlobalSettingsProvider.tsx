import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { DEFAULT_KLIDO_DESIGN_TOKENS, type DesignSystemTokens } from '../schemas/styles';
import type { NavigationItemRecord, SiteSetting } from '../types/database';

export interface FooterConfig {
  description: string;
  email: string;
  phone: string;
  instagramHandle: string;
  instagramUrl: string;
  hours: string;
  location: string;
  copyrightText: string;
  tagline: string;
}

export interface SeoGlobalConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultMetaDescription: string;
  defaultOgImage: string;
  faviconUrl: string;
  robotsTxt: string;
}

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  description:
    'Independent digital marketing studio turning strong offers into clear positioning, considered campaigns, and practical systems for growth.',
  email: 'klidoagency@gmail.com',
  phone: '+91 9172569021',
  instagramHandle: '@klidoagency',
  instagramUrl: 'https://www.instagram.com/klidoagency',
  hours: 'Mon–Fri, 09:00–18:00',
  location: 'Remote Worldwide',
  copyrightText: 'Klido. All rights reserved.',
  tagline: 'Client-owned accounts · Transparent weekly reporting',
};

export const DEFAULT_SEO_GLOBAL: SeoGlobalConfig = {
  siteName: 'Klido',
  siteUrl: 'https://www.klido.in',
  defaultTitle: 'Klido — Digital Growth & E-Commerce Operations Studio',
  defaultMetaDescription:
    'Klido is an independent digital marketing studio building measurable paid acquisition, technical SEO, conversion architecture, and clean attribution systems.',
  defaultOgImage: 'https://www.klido.in/klido_Logo.png',
  faviconUrl: '/favicon-48x48.png',
  robotsTxt: 'User-agent: *\nAllow: /\nSitemap: https://www.klido.in/sitemap.xml',
};

const FALLBACK_NAV_ITEMS: NavigationItemRecord[] = [
  { id: 'nav-1', location: 'header', parent_id: null, label: 'Services', href: '/services', is_external: false, is_cta: false, display_order: 1, is_visible: true, created_at: '', updated_at: '', updated_by: null },
  { id: 'nav-2', location: 'header', parent_id: null, label: 'Approach', href: '/approach', is_external: false, is_cta: false, display_order: 2, is_visible: true, created_at: '', updated_at: '', updated_by: null },
  { id: 'nav-3', location: 'header', parent_id: null, label: 'Studio', href: '/about', is_external: false, is_cta: false, display_order: 3, is_visible: true, created_at: '', updated_at: '', updated_by: null },
  { id: 'nav-4', location: 'header', parent_id: null, label: 'Work', href: '/#work', is_external: false, is_cta: false, display_order: 4, is_visible: true, created_at: '', updated_at: '', updated_by: null },
  { id: 'nav-5', location: 'header', parent_id: null, label: 'Pricing', href: '/#pricing', is_external: false, is_cta: false, display_order: 5, is_visible: true, created_at: '', updated_at: '', updated_by: null },
  { id: 'nav-f1', location: 'footer_practice', parent_id: null, label: 'Services', href: '/services', is_external: false, is_cta: false, display_order: 1, is_visible: true, created_at: '', updated_at: '', updated_by: null },
  { id: 'nav-f2', location: 'footer_practice', parent_id: null, label: 'Approach', href: '/approach', is_external: false, is_cta: false, display_order: 2, is_visible: true, created_at: '', updated_at: '', updated_by: null },
  { id: 'nav-f3', location: 'footer_practice', parent_id: null, label: 'Studio', href: '/about', is_external: false, is_cta: false, display_order: 3, is_visible: true, created_at: '', updated_at: '', updated_by: null },
  { id: 'nav-f4', location: 'footer_practice', parent_id: null, label: 'Work', href: '/#work', is_external: false, is_cta: false, display_order: 4, is_visible: true, created_at: '', updated_at: '', updated_by: null },
  { id: 'nav-e1', location: 'footer_engage', parent_id: null, label: 'Service Plans', href: '/#pricing', is_external: false, is_cta: false, display_order: 1, is_visible: true, created_at: '', updated_at: '', updated_by: null },
  { id: 'nav-e2', location: 'footer_engage', parent_id: null, label: 'FAQ', href: '/#faq', is_external: false, is_cta: false, display_order: 2, is_visible: true, created_at: '', updated_at: '', updated_by: null },
  { id: 'nav-e3', location: 'footer_engage', parent_id: null, label: 'Start a project', href: '/contact', is_external: false, is_cta: true, display_order: 3, is_visible: true, created_at: '', updated_at: '', updated_by: null },
];

interface GlobalSettingsContextValue {
  designTokens: DesignSystemTokens;
  footerConfig: FooterConfig;
  seoGlobal: SeoGlobalConfig;
  navigationItems: NavigationItemRecord[];
  isLoading: boolean;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextValue>({
  designTokens: DEFAULT_KLIDO_DESIGN_TOKENS,
  footerConfig: DEFAULT_FOOTER_CONFIG,
  seoGlobal: DEFAULT_SEO_GLOBAL,
  navigationItems: FALLBACK_NAV_ITEMS,
  isLoading: false,
});

async function fetchGlobalSettingsFromDb() {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseClient();
  const [settingsRes, navRes] = await Promise.all([
    supabase.from('site_settings').select('*'),
    supabase
      .from('navigation_items')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true }),
  ]);

  if (settingsRes.error || navRes.error) {
    return null;
  }

  return {
    settings: (settingsRes.data ?? []) as SiteSetting[],
    navigation: (navRes.data ?? []) as NavigationItemRecord[],
  };
}

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['cms-global-settings'],
    queryFn: fetchGlobalSettingsFromDb,
    staleTime: 10_000,
    refetchOnMount: 'always',
  });

  const value = useMemo<GlobalSettingsContextValue>(() => {
    const map = new Map<string, Record<string, unknown>>();
    for (const row of data?.settings ?? []) {
      map.set(row.setting_key, row.setting_value);
    }

    const designTokens = {
      ...DEFAULT_KLIDO_DESIGN_TOKENS,
      ...(map.get('design_system') as Partial<DesignSystemTokens> | undefined),
    };
    const footerConfig = {
      ...DEFAULT_FOOTER_CONFIG,
      ...(map.get('footer_config') as Partial<FooterConfig> | undefined),
    };
    const seoGlobal = {
      ...DEFAULT_SEO_GLOBAL,
      ...(map.get('seo_global') as Partial<SeoGlobalConfig> | undefined),
    };

    const navigationItems =
      data?.navigation && data.navigation.length > 0 ? data.navigation : FALLBACK_NAV_ITEMS;

    return {
      designTokens,
      footerConfig,
      seoGlobal,
      navigationItems,
      isLoading,
    };
  }, [data, isLoading]);

  return (
    <GlobalSettingsContext.Provider value={value}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export function useGlobalSettings() {
  return useContext(GlobalSettingsContext);
}
