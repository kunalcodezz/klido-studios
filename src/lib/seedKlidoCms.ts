import { getSupabaseClient } from './supabase';
import { KLIDO_SEED_PAGES } from '../data/klidoSeedPages';

export interface SeedResult {
  pagesInserted: number;
  servicesInserted: number;
  brandsInserted: number;
  navInserted: number;
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

  // 1. Seed missing Klido pages + initial draft revisions
  const { data: existingPages } = await supabase.from('pages').select('slug');
  const existingSlugs = new Set((existingPages ?? []).map((p) => p.slug));

  for (const blueprint of KLIDO_SEED_PAGES) {
    if (existingSlugs.has(blueprint.slug)) continue;

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

  // 2. Seed Services if empty
  let servicesInserted = 0;
  const { count: servicesCount } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true });

  if ((servicesCount ?? 0) === 0) {
    const defaultServices = [
      {
        slug: 'meta-ads',
        title: 'Meta Ads',
        subtitle: 'Run, optimize & scale paid campaigns on Meta',
        service_kind: 'plan',
        price_display: '₹9,999',
        original_price_display: '₹12,999',
        discount_label: '23% OFF',
        billing_period: '/month',
        features: ['Campaign Setup & Management', 'Creative Testing (A/B)', 'Audience Targeting & Refinement', 'Budget Optimization', 'Monthly Performance Report'],
        mapped_disciplines: ['Meta Ads'],
        display_order: 1,
        is_featured: false,
        is_visible: true,
        created_by: user.id,
        updated_by: user.id,
      },
      {
        slug: 'influencer-marketing',
        title: 'Influencer Marketing',
        subtitle: 'Collaborate with the right creators for real reach',
        service_kind: 'plan',
        price_display: '₹6,999',
        original_price_display: '₹9,999',
        discount_label: '30% OFF',
        billing_period: '/month',
        features: ['Creator Research & Shortlisting', 'Outreach & Collaboration', 'Campaign Execution', 'Content Review & Approval', 'Performance & ROI Report'],
        mapped_disciplines: ['Influencer Marketing'],
        display_order: 2,
        is_featured: false,
        is_visible: true,
        created_by: user.id,
        updated_by: user.id,
      },
      {
        slug: 'social-media',
        title: 'Social Media',
        subtitle: 'Build a strong and active brand presence',
        service_kind: 'plan',
        price_display: '₹6,999',
        original_price_display: '₹9,999',
        discount_label: '30% OFF',
        billing_period: '/month',
        features: ['Content Strategy & Calendar', 'Post Creation (Graphics & Reels)', 'Multi-Platform Management', 'Community Engagement', 'Monthly Growth Report'],
        mapped_disciplines: ['Social Media'],
        display_order: 3,
        is_featured: false,
        is_visible: true,
        created_by: user.id,
        updated_by: user.id,
      },
      {
        slug: 'business-operations',
        title: 'Business Operations',
        subtitle: 'Streamline, manage and scale your business',
        service_kind: 'plan',
        price_display: '₹6,999',
        original_price_display: '₹9,999',
        discount_label: '30% OFF',
        billing_period: '/month',
        features: ['Process Setup & Optimization', 'Operations & Workflow Management', 'Tool & Automation Setup', 'Team & Task Coordination', 'Performance & Efficiency Report'],
        mapped_disciplines: ['Business Operations'],
        display_order: 4,
        is_featured: false,
        is_visible: true,
        created_by: user.id,
        updated_by: user.id,
      },
      {
        slug: 'growth-bundle',
        title: 'Growth Bundle',
        subtitle: 'All-in-one growth plan for maximum impact',
        service_kind: 'plan',
        price_display: '₹28,999',
        original_price_display: '₹39,999',
        discount_label: '28% OFF',
        billing_period: '/month',
        features: ['Meta Ads Management', 'Influencer Campaigns', 'Social Media Management', 'Business Operations Support', 'Unified Growth Report'],
        mapped_disciplines: ['Meta Ads', 'Social Media', 'Influencer Marketing', 'Business Operations'],
        display_order: 5,
        is_featured: true,
        is_visible: true,
        created_by: user.id,
        updated_by: user.id,
      },
    ];
    const { error } = await supabase.from('services').insert(defaultServices);
    if (!error) servicesInserted = defaultServices.length;
  }

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

  return { pagesInserted, servicesInserted, brandsInserted, navInserted };
}
