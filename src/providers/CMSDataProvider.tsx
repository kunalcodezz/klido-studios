import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type {
  BrandRecord,
  MediaAsset,
  ProjectRecord,
  ServiceRecord,
  TestimonialRecord,
} from '../types/database';

interface CMSDataContextValue {
  services: ServiceRecord[];
  projects: ProjectRecord[];
  brands: BrandRecord[];
  testimonials: TestimonialRecord[];
  mediaMap: Record<string, MediaAsset>;
  isLoading: boolean;
  usingFallback: boolean;
}

const FALLBACK_SERVICES: ServiceRecord[] = [
  {
    id: 'svc-meta-ads',
    slug: 'meta-ads',
    title: 'Meta Ads',
    subtitle: 'Run, optimize & scale paid campaigns on Meta',
    description: 'Campaign strategy, ad setup, creative testing, audience targeting, and monthly reporting.',
    service_kind: 'plan',
    price_display: '₹9,999',
    original_price_display: '₹12,999',
    discount_label: '23% OFF',
    billing_period: '/month',
    image_asset_id: null,
    features: [
      'Campaign Setup & Management',
      'Creative Testing (A/B)',
      'Audience Targeting & Refinement',
      'Budget Optimization',
      'Monthly Performance Report',
    ],
    deliverables: [],
    tooling: ['Meta Ads Manager'],
    mapped_disciplines: ['Meta Ads'],
    cadence: 'Weekly optimization',
    cta_label: 'Select Meta Ads',
    cta_url: '/contact',
    is_featured: false,
    is_visible: true,
    display_order: 1,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'svc-influencer',
    slug: 'influencer-marketing',
    title: 'Influencer Marketing',
    subtitle: 'Collaborate with the right creators for real reach',
    description: 'Creator shortlisting, outreach, campaign execution, and ROI tracking.',
    service_kind: 'plan',
    price_display: '₹6,999',
    original_price_display: '₹9,999',
    discount_label: '30% OFF',
    billing_period: '/month',
    image_asset_id: null,
    features: [
      'Creator Research & Shortlisting',
      'Outreach & Collaboration',
      'Campaign Execution',
      'Content Review & Approval',
      'Performance & ROI Report',
    ],
    deliverables: [],
    tooling: [],
    mapped_disciplines: ['Influencer Marketing'],
    cadence: 'Monthly sprint',
    cta_label: 'Select Influencer',
    cta_url: '/contact',
    is_featured: false,
    is_visible: true,
    display_order: 2,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'svc-social',
    slug: 'social-media',
    title: 'Social Media',
    subtitle: 'Build a strong and active brand presence',
    description: 'Content calendar, graphics & reels production, multi-platform management.',
    service_kind: 'plan',
    price_display: '₹6,999',
    original_price_display: '₹9,999',
    discount_label: '30% OFF',
    billing_period: '/month',
    image_asset_id: null,
    features: [
      'Content Strategy & Calendar',
      'Post Creation (Graphics & Reels)',
      'Multi-Platform Management',
      'Community Engagement',
      'Monthly Growth Report',
    ],
    deliverables: [],
    tooling: [],
    mapped_disciplines: ['Social Media'],
    cadence: 'Weekly calendar',
    cta_label: 'Select Social Media',
    cta_url: '/contact',
    is_featured: false,
    is_visible: true,
    display_order: 3,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'svc-ops',
    slug: 'business-operations',
    title: 'Business Operations',
    subtitle: 'Streamline, manage and scale your business',
    description: 'SOP setup, workflow automation, team & task coordination.',
    service_kind: 'plan',
    price_display: '₹6,999',
    original_price_display: '₹9,999',
    discount_label: '30% OFF',
    billing_period: '/month',
    image_asset_id: null,
    features: [
      'Process Setup & Optimization',
      'Operations & Workflow Management',
      'Tool & Automation Setup',
      'Team & Task Coordination',
      'Performance & Efficiency Report',
    ],
    deliverables: [],
    tooling: [],
    mapped_disciplines: ['Business Operations'],
    cadence: 'Weekly ops review',
    cta_label: 'Select Operations',
    cta_url: '/contact',
    is_featured: false,
    is_visible: true,
    display_order: 4,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'svc-growth-bundle',
    slug: 'growth-bundle',
    title: 'Growth Bundle',
    subtitle: 'All-in-one growth plan for maximum impact',
    description: 'Unified Meta Ads, Influencer Campaigns, Social Media, and Business Operations.',
    service_kind: 'plan',
    price_display: '₹28,999',
    original_price_display: '₹39,999',
    discount_label: '28% OFF',
    billing_period: '/month',
    image_asset_id: null,
    features: [
      'Meta Ads Management',
      'Influencer Campaigns',
      'Social Media Management',
      'Business Operations Support',
      'Unified Growth Report',
    ],
    deliverables: [],
    tooling: [],
    mapped_disciplines: ['Meta Ads', 'Social Media', 'Influencer Marketing', 'Business Operations'],
    cadence: 'Weekly executive review',
    cta_label: 'Select Growth Bundle',
    cta_url: '/contact',
    is_featured: true,
    is_visible: true,
    display_order: 5,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'pa-paid-acquisition',
    slug: 'paid-search-social-acquisition',
    title: 'Paid Search & Social Acquisition',
    subtitle: 'Structured campaign architecture, creative testing, and bid governance.',
    description:
      'We build and manage search, shopping, and paid social accounts with clean campaign segmentation, disciplined negative keyword lists, and weekly creative iteration tied directly to qualified pipeline.',
    service_kind: 'practice_area',
    price_display: '',
    original_price_display: '',
    discount_label: '',
    billing_period: '',
    image_asset_id: null,
    features: [],
    deliverables: [
      'Account restructuring by intent tier and margin profile',
      'Weekly ad copy and static/motion creative test batches',
      'Search term mining, exclusion governance, and budget pacing',
      'Plain-language weekly performance memo with next-step actions',
    ],
    tooling: ['Google Ads', 'Meta Ads Manager', 'LinkedIn Campaign Manager', 'Looker Studio'],
    mapped_disciplines: ['Meta Ads'],
    cadence: 'Weekly optimization & creative review',
    cta_label: 'Discuss Paid scope',
    cta_url: '/contact',
    is_featured: false,
    is_visible: true,
    display_order: 1,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'pa-technical-seo',
    slug: 'technical-editorial-seo',
    title: 'Technical & Editorial SEO',
    subtitle: 'Crawl architecture, search intent mapping, and durable organic content.',
    description:
      'Instead of publishing high-volume filler posts, we fix structural crawl bottlenecks, align landing pages to commercial search intent, and produce thorough editorial resources built to earn sustained visibility.',
    service_kind: 'practice_area',
    price_display: '',
    original_price_display: '',
    discount_label: '',
    billing_period: '',
    image_asset_id: null,
    features: [],
    deliverables: [
      'Technical crawl audit, indexation cleanup, and schema markup',
      'Commercial and comparison keyword architecture mapped to URLs',
      'Editorial briefs and long-form product-led content production',
      'Internal linking architecture and search console monitoring',
    ],
    tooling: ['Google Search Console', 'Screaming Frog', 'Ahrefs', 'Schema.org'],
    mapped_disciplines: ['Technical SEO'],
    cadence: 'Bi-weekly editorial sprints & technical QA',
    cta_label: 'Discuss Technical scope',
    cta_url: '/contact',
    is_featured: false,
    is_visible: true,
    display_order: 2,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'pa-conversion',
    slug: 'conversion-architecture',
    title: 'Conversion Architecture & Landing Systems',
    subtitle: 'Dedicated acquisition landing pages, messaging hierarchy, and UX tests.',
    description:
      'Ad spend underperforms when traffic lands on generic homepages. We design and ship focused landing systems, interactive calculators, and friction-free lead flows engineered to clarify value in seconds.',
    service_kind: 'practice_area',
    price_display: '',
    original_price_display: '',
    discount_label: '',
    billing_period: '',
    image_asset_id: null,
    features: [],
    deliverables: [
      'Message-match landing pages tailored by campaign intent',
      'Form friction audits, multi-step qualification, and routing UX',
      'Wireframes, copywriting, and production frontend implementation',
      'Controlled A/B split testing with documented hypotheses',
    ],
    tooling: ['Figma', 'React & Tailwind', 'PostHog', 'VWO / Optimizely'],
    mapped_disciplines: ['Conversion Design'],
    cadence: 'Two-week design-to-ship cycles',
    cta_label: 'Discuss Conversion scope',
    cta_url: '/contact',
    is_featured: false,
    is_visible: true,
    display_order: 3,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'pa-measurement',
    slug: 'measurement-attribution',
    title: 'Measurement & Attribution Infrastructure',
    subtitle: 'Server-side tracking, CRM sync, and trustworthy source-of-truth reporting.',
    description:
      'Platform dashboards consistently over-report their own impact. We configure server-side event pipelines, strict UTM taxonomy, and CRM-backed conversion tracking so budget decisions rely on verified revenue signals.',
    service_kind: 'practice_area',
    price_display: '',
    original_price_display: '',
    discount_label: '',
    billing_period: '',
    image_asset_id: null,
    features: [],
    deliverables: [
      'Server-side Google Tag Manager and Conversion API setup',
      'Standardized UTM governance and naming conventions across teams',
      'CRM lifecycle stage sync (lead to qualified opportunity)',
      'Executive reporting workbook focused on unit economics',
    ],
    tooling: ['GA4', 'Server-Side GTM', 'HubSpot / Salesforce', 'BigQuery'],
    mapped_disciplines: ['Business Operations'],
    cadence: 'Monthly telemetry audit & continuous monitoring',
    cta_label: 'Discuss Measurement scope',
    cta_url: '/contact',
    is_featured: false,
    is_visible: true,
    display_order: 4,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null,
  },
];

const FALLBACK_BRANDS: BrandRecord[] = [
  {
    id: 'brand-hashi',
    slug: 'hashibusiness',
    name: 'HashiBusiness',
    logo_asset_id: null,
    preview_asset_id: null,
    description:
      'Helping businesses streamline their operations with smarter business solutions, efficient workflows, and a focus on sustainable growth.',
    scopes: ['Business ops'],
    filter_keys: ['ops'],
    website_url: '',
    instagram_url: '',
    layout_variant: 'card',
    display_order: 1,
    is_visible: true,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'brand-saanjh',
    slug: 'saanjh-by-riya',
    name: 'Saanjh by Riya',
    logo_asset_id: null,
    preview_asset_id: null,
    description:
      'A creative candle brand bringing warmth and elegance to everyday spaces through thoughtfully crafted candles and meaningful gifting experiences.',
    scopes: ['Social', 'Ops', 'Influencer'],
    filter_keys: ['social', 'ops', 'influencer'],
    website_url: '',
    instagram_url: 'https://www.instagram.com/saanjhbyriya/',
    layout_variant: 'card',
    display_order: 2,
    is_visible: true,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'brand-zegore',
    slug: 'zegore',
    name: 'Zegore',
    logo_asset_id: null,
    preview_asset_id: null,
    description:
      'Building a distinctive brand presence through strategic digital solutions, creative positioning, and a focus on connecting with the right audience.',
    scopes: ['Influencer', 'Social'],
    filter_keys: ['influencer', 'social'],
    website_url: '',
    instagram_url: '',
    layout_variant: 'wide',
    display_order: 3,
    is_visible: true,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null,
  },
];

const CMSDataContext = createContext<CMSDataContextValue>({
  services: FALLBACK_SERVICES,
  projects: [],
  brands: FALLBACK_BRANDS,
  testimonials: [],
  mediaMap: {},
  isLoading: false,
  usingFallback: true,
});

async function fetchCmsCollections() {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseClient();

  const [servicesRes, projectsRes, brandsRes, testimonialsRes, mediaRes] = await Promise.all([
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
    supabase.from('media_assets').select('*'),
  ]);

  if (servicesRes.error || projectsRes.error || brandsRes.error || testimonialsRes.error) {
    return null;
  }

  return {
    services: (servicesRes.data ?? []) as ServiceRecord[],
    projects: (projectsRes.data ?? []) as ProjectRecord[],
    brands: (brandsRes.data ?? []) as BrandRecord[],
    testimonials: (testimonialsRes.data ?? []) as TestimonialRecord[],
    media: (mediaRes.data ?? []) as MediaAsset[],
  };
}

export function CMSDataProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['cms-collections-public'],
    queryFn: fetchCmsCollections,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const value = useMemo<CMSDataContextValue>(() => {
    const mediaMap: Record<string, MediaAsset> = {};
    for (const m of data?.media ?? []) {
      mediaMap[m.id] = m;
    }

    const dbPlans = (data?.services ?? []).filter((s) => s.service_kind === 'plan');
    const dbPracticeAreas = (data?.services ?? []).filter(
      (s) => s.service_kind === 'practice_area'
    );
    const fallbackPlans = FALLBACK_SERVICES.filter((s) => s.service_kind === 'plan');
    const fallbackPracticeAreas = FALLBACK_SERVICES.filter(
      (s) => s.service_kind === 'practice_area'
    );

    const hasDbPlans = dbPlans.length > 0;
    const hasDbPracticeAreas = dbPracticeAreas.length > 0;
    const hasDbBrands = Boolean(data && data.brands.length > 0);

    return {
      services: [
        ...(hasDbPlans ? dbPlans : fallbackPlans),
        ...(hasDbPracticeAreas ? dbPracticeAreas : fallbackPracticeAreas),
      ],
      projects: data?.projects ?? [],
      brands: hasDbBrands ? data!.brands : FALLBACK_BRANDS,
      testimonials: data?.testimonials ?? [],
      mediaMap,
      isLoading,
      usingFallback: !data || (!hasDbPlans && !hasDbPracticeAreas && !hasDbBrands),
    };
  }, [data, isLoading]);

  return <CMSDataContext.Provider value={value}>{children}</CMSDataContext.Provider>;
}

export function useCMSData() {
  return useContext(CMSDataContext);
}
