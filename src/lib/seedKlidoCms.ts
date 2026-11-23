import { getSupabaseClient } from './supabase';
import { KLIDO_SEED_PAGES } from '../data/klidoSeedPages';
import { isApprovedCmsSlug, normalizeRegistrySlug } from '../data/pageRegistry';

export interface SeedResult {
  pagesInserted: number;
  pagesArchived: number;
  servicesInserted: number;
  brandsInserted: number;
  navInserted: number;
}

export const DEFAULT_KLIDO_SERVICES = [
  {
    slug: 'meta-ads',
    title: 'Meta Ads',
    subtitle: 'Run, optimize & scale paid campaigns on Meta',
    description: 'Campaign strategy, ad setup, creative testing, audience targeting, and monthly reporting.',
    service_kind: 'plan',
    price_display: '₹9,999',
    original_price_display: '₹12,999',
    discount_label: '23% OFF',
    billing_period: '/month',
    features: ['Campaign Setup & Management', 'Creative Testing (A/B)', 'Audience Targeting & Refinement', 'Budget Optimization', 'Monthly Performance Report'],
    deliverables: [] as string[],
    tooling: ['Meta Ads Manager'],
    mapped_disciplines: ['Meta Ads'],
    cadence: 'Weekly optimization',
    cta_label: 'Select Meta Ads',
    cta_url: '/contact',
    display_order: 1,
    is_featured: false,
    is_visible: true,
  },
  {
    slug: 'influencer-marketing',
    title: 'Influencer Marketing',
    subtitle: 'Collaborate with the right creators for real reach',
    description: 'Creator shortlisting, outreach, campaign execution, and ROI tracking.',
    service_kind: 'plan',
    price_display: '₹6,999',
    original_price_display: '₹9,999',
    discount_label: '30% OFF',
    billing_period: '/month',
    features: ['Creator Research & Shortlisting', 'Outreach & Collaboration', 'Campaign Execution', 'Content Review & Approval', 'Performance & ROI Report'],
    deliverables: [] as string[],
    tooling: [] as string[],
    mapped_disciplines: ['Influencer Marketing'],
    cadence: 'Monthly sprint',
    cta_label: 'Select Influencer',
    cta_url: '/contact',
    display_order: 2,
    is_featured: false,
    is_visible: true,
  },
  {
    slug: 'social-media',
    title: 'Social Media',
    subtitle: 'Build a strong and active brand presence',
    description: 'Content calendar, graphics & reels production, multi-platform management.',
    service_kind: 'plan',
    price_display: '₹6,999',
    original_price_display: '₹9,999',
    discount_label: '30% OFF',
    billing_period: '/month',
    features: ['Content Strategy & Calendar', 'Post Creation (Graphics & Reels)', 'Multi-Platform Management', 'Community Engagement', 'Monthly Growth Report'],
    deliverables: [] as string[],
    tooling: [] as string[],
    mapped_disciplines: ['Social Media'],
    cadence: 'Weekly calendar',
    cta_label: 'Select Social Media',
    cta_url: '/contact',
    display_order: 3,
    is_featured: false,
    is_visible: true,
  },
  {
    slug: 'business-operations',
    title: 'Business Operations',
    subtitle: 'Streamline, manage and scale your business',
    description: 'SOP setup, workflow automation, team & task coordination.',
    service_kind: 'plan',
    price_display: '₹6,999',
    original_price_display: '₹9,999',
    discount_label: '30% OFF',
    billing_period: '/month',
    features: ['Process Setup & Optimization', 'Operations & Workflow Management', 'Tool & Automation Setup', 'Team & Task Coordination', 'Performance & Efficiency Report'],
    deliverables: [] as string[],
    tooling: [] as string[],
    mapped_disciplines: ['Business Operations'],
    cadence: 'Weekly ops review',
    cta_label: 'Select Operations',
    cta_url: '/contact',
    display_order: 4,
    is_featured: false,
    is_visible: true,
  },
  {
    slug: 'growth-bundle',
    title: 'Growth Bundle',
    subtitle: 'All-in-one growth plan for maximum impact',
    description: 'Unified Meta Ads, Influencer Campaigns, Social Media, and Business Operations.',
    service_kind: 'plan',
    price_display: '₹28,999',
    original_price_display: '₹39,999',
    discount_label: '28% OFF',
    billing_period: '/month',
    features: ['Meta Ads Management', 'Influencer Campaigns', 'Social Media Management', 'Business Operations Support', 'Unified Growth Report'],
    deliverables: [] as string[],
    tooling: [] as string[],
    mapped_disciplines: ['Meta Ads', 'Social Media', 'Influencer Marketing', 'Business Operations'],
    cadence: 'Weekly executive review',
    cta_label: 'Select Growth Bundle',
    cta_url: '/contact',
    display_order: 5,
    is_featured: true,
    is_visible: true,
  },
  {
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
    features: [] as string[],
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
    display_order: 1,
    is_featured: false,
    is_visible: true,
  },
  {
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
    features: [] as string[],
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
    display_order: 2,
    is_featured: false,
    is_visible: true,
  },
  {
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
    features: [] as string[],
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
    display_order: 3,
    is_featured: false,
    is_visible: true,
  },
  {
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
    features: [] as string[],
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
    display_order: 4,
    is_featured: false,
    is_visible: true,
  },
] as const;

export async function seedMissingDefaultServices(explicitUserId?: string): Promise<number> {
  const supabase = getSupabaseClient();
  let userId = explicitUserId ?? null;
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  const { data: existingRows, error: fetchErr } = await supabase
    .from('services')
    .select('slug');

  if (fetchErr) {
    throw new Error(fetchErr.message);
  }

  const existingSlugs = new Set((existingRows ?? []).map((r) => String(r.slug)));
  const missing = DEFAULT_KLIDO_SERVICES.filter((item) => !existingSlugs.has(item.slug));

  if (missing.length === 0) return 0;

  const { error: insertErr } = await supabase.from('services').insert(
    missing.map((item) => ({
      ...item,
      features: [...item.features],
      deliverables: [...item.deliverables],
      tooling: [...item.tooling],
      mapped_disciplines: [...item.mapped_disciplines],
      created_by: userId,
      updated_by: userId,
    }))
  );

  if (insertErr) {
    throw new Error(insertErr.message);
  }

  return missing.length;
}

export async function seedKlidoInitialContent(): Promise<SeedResult> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in as an editor or super admin to seed content.');
  }

  let pagesInserted = 0;
  let pagesArchived = 0;

  // 1. Inspect existing CMS pages: archive any obsolete/unapproved slugs safely (never delete)
  const { data: existingPages } = await supabase
    .from('pages')
    .select('id, slug, status');

  const existingBySlug = new Map<string, { id: string; status: string }>();

  for (const row of existingPages ?? []) {
    const normalized = normalizeRegistrySlug(row.slug as string);
    if (!isApprovedCmsSlug(normalized)) {
      if (row.status !== 'archived') {
        const { error: archiveErr } = await supabase
          .from('pages')
          .update({
            status: 'archived',
            published_revision_id: null,
            updated_by: user.id,
          })
          .eq('id', row.id);
        if (!archiveErr) {
          pagesArchived += 1;
        }
      }
      continue;
    }

    if (!existingBySlug.has(normalized)) {
      existingBySlug.set(normalized, { id: row.id as string, status: row.status as string });
    }
  }

  // Ensure all 5 approved pages exist (un-archiving if previously archived, or inserting cleanly)
  for (const blueprint of KLIDO_SEED_PAGES) {
    const existing = existingBySlug.get(blueprint.slug);
    if (existing) {
      if (existing.status === 'archived') {
        await supabase
          .from('pages')
          .update({ status: 'draft', updated_by: user.id })
          .eq('id', existing.id);
      }
      continue;
    }

    const { data: insertedPage, error: pageErr } = await supabase
      .from('pages')
      .insert({
        title: blueprint.title,
        slug: blueprint.slug,
        page_type: blueprint.page_type,
        status: 'draft',
        seo_metadata: blueprint.seo_metadata,
        created_by: user.id,
        updated_by: user.id,
      })
      .select('id')
      .single();

    if (pageErr || !insertedPage) {
      throw new Error(`Failed seeding page "${blueprint.title}": ${pageErr?.message}`);
    }

    const { error: revErr } = await supabase.rpc('save_page_draft', {
      p_page_id: insertedPage.id,
      p_expected_draft_revision_id: null,
      p_content_json: blueprint.tree,
      p_change_summary: 'Initial Klido website audit seed',
    });

    if (revErr) {
      throw new Error(`Failed creating initial draft for "${blueprint.title}": ${revErr.message}`);
    }

    pagesInserted += 1;
  }

  // 2. Seed missing default Services (5 plans + 4 practice areas), preserving existing edits
  const servicesInserted = await seedMissingDefaultServices(user.id);

  // 3. Seed Brands if empty
  let brandsInserted = 0;
  const { count: brandsCount } = await supabase
    .from('brands')
    .select('id', { count: 'exact', head: true });

  if ((brandsCount ?? 0) === 0) {
    const defaultBrands = [
      {
        slug: 'hashibusiness',
        name: 'HashiBusiness',
        description:
          'Helping businesses streamline their operations with smarter business solutions, efficient workflows, and a focus on sustainable growth.',
        scopes: ['Business ops'],
        filter_keys: ['ops'],
        layout_variant: 'card',
        display_order: 1,
        is_visible: true,
        created_by: user.id,
        updated_by: user.id,
      },
      {
        slug: 'saanjh-by-riya',
        name: 'Saanjh by Riya',
        description:
          'A creative candle brand bringing warmth and elegance to everyday spaces through thoughtfully crafted candles and meaningful gifting experiences.',
        scopes: ['Social', 'Ops', 'Influencer'],
        filter_keys: ['social', 'ops', 'influencer'],
        instagram_url: 'https://www.instagram.com/saanjhbyriya/',
        layout_variant: 'card',
        display_order: 2,
        is_visible: true,
        created_by: user.id,
        updated_by: user.id,
      },
      {
        slug: 'zegore',
        name: 'Zegore',
        description:
          'Building a distinctive brand presence through strategic digital solutions, creative positioning, and a focus on connecting with the right audience.',
        scopes: ['Influencer', 'Social'],
        filter_keys: ['influencer', 'social'],
        layout_variant: 'wide',
        display_order: 3,
        is_visible: true,
        created_by: user.id,
        updated_by: user.id,
      },
    ];
    const { error } = await supabase.from('brands').insert(defaultBrands);
    if (!error) brandsInserted = defaultBrands.length;
  }

  // 4. Seed Navigation items if empty
  let navInserted = 0;
  const { count: navCount } = await supabase
    .from('navigation_items')
    .select('id', { count: 'exact', head: true });

  if ((navCount ?? 0) === 0) {
    const defaultNav = [
      { location: 'header', label: 'Services', href: '/services', display_order: 1, updated_by: user.id },
      { location: 'header', label: 'Approach', href: '/approach', display_order: 2, updated_by: user.id },
      { location: 'header', label: 'Studio', href: '/about', display_order: 3, updated_by: user.id },
      { location: 'header', label: 'Work', href: '/#work', display_order: 4, updated_by: user.id },
      { location: 'header', label: 'Pricing', href: '/#pricing', display_order: 5, updated_by: user.id },
      { location: 'footer_practice', label: 'Services', href: '/services', display_order: 1, updated_by: user.id },
      { location: 'footer_practice', label: 'Approach', href: '/approach', display_order: 2, updated_by: user.id },
      { location: 'footer_practice', label: 'Studio', href: '/about', display_order: 3, updated_by: user.id },
      { location: 'footer_practice', label: 'Work', href: '/#work', display_order: 4, updated_by: user.id },
      { location: 'footer_engage', label: 'Service Plans', href: '/#pricing', display_order: 1, updated_by: user.id },
      { location: 'footer_engage', label: 'FAQ', href: '/#faq', display_order: 2, updated_by: user.id },
      { location: 'footer_engage', label: 'Start a project', href: '/contact', is_cta: true, display_order: 3, updated_by: user.id },
    ];
    const { error } = await supabase.from('navigation_items').insert(defaultNav);
    if (!error) navInserted = defaultNav.length;
  }

  return { pagesInserted, pagesArchived, servicesInserted, brandsInserted, navInserted };
}
