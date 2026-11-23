import { createBlockNode } from '../blocks/registry';
import type { PageContentTree } from '../schemas/blocks';
import { createTiptapParagraph } from '../schemas/tiptap';
import type { PageType, SeoMetadata } from '../types/database';

export interface KlidoSeedPageBlueprint {
  title: string;
  slug: string;
  page_type: PageType;
  seo_metadata: SeoMetadata;
  tree: PageContentTree;
}

export const KLIDO_SEED_PAGES: KlidoSeedPageBlueprint[] = [
  {
    title: 'Home',
    slug: '/',
    page_type: 'home',
    seo_metadata: {
      seoTitle: 'Klido — Independent Digital Marketing & Operations Studio',
      metaDescription:
        'Klido is an independent digital marketing studio building measurable paid acquisition, technical SEO, conversion architecture, and clean attribution systems.',
      canonicalUrl: 'https://www.klido.in/',
      ogTitle: 'Klido — Independent Digital Marketing Studio',
      ogDescription:
        'From brand positioning and performance marketing to creative campaigns and business operations.',
      ogImage: 'https://www.klido.in/klido_Logo.png',
      robotsIndex: true,
      robotsFollow: true,
    },
    tree: {
      version: 1,
      sections: [
        createBlockNode('hero', {
          name: 'Home Hero & Campaign Map',
          props: {
            variant: 'home-map',
            eyebrow: 'YOUR PARTNER IN DIGITAL GROWTH',
            headlinePrefix: 'We turn ambitious brands into',
            headlineAccent: 'brands people remember.',
            showLimeUnderline: true,
            description: createTiptapParagraph(
              'From brand positioning and performance marketing to creative campaigns and business operations, Klido brings everything together to help businesses build a stronger presence and grow with purpose.'
            ),
            primaryCta: {
              label: "Tell us what you're building",
              href: '#start-project',
              variant: 'primary',
            },
            secondaryCta: {
              label: 'See how we work',
              href: '/approach',
              variant: 'secondary',
            },
          },
        }),
        createBlockNode('brands', {
          name: 'Brands We Work With',
          props: {
            eyebrow: 'Brands we work with',
            headingPrefix: 'Partners in',
            headingAccent: 'real growth',
            subtitle:
              "A closer look at the brands we're building with — from operations to marketing, we help businesses grow online and beyond.",
            layoutMode: 'klido-asymmetric',
          },
        }),
        createBlockNode('senior-studio', {
          name: 'Senior Studio Positioning',
        }),
        createBlockNode('services-grid', {
          name: 'Service Plans & Pricing',
          props: {
            mode: 'pricing-plans',
            eyebrow: 'Service Plans',
            heading: 'Transparent monthly growth plans',
            subtitle:
              'Choose individual channel management or combine all four functions inside the Growth Bundle.',
            highlights: [
              { title: 'Transparent Pricing', detail: 'No hidden charges' },
              { title: 'Flexible Plans', detail: 'Upgrade or switch anytime' },
              { title: 'Dedicated Support', detail: 'Quick and reliable' },
            ],
          },
        }),
        createBlockNode('statistics', {
          name: 'How We Work Process',
          props: {
            variant: 'process-timeline',
            eyebrow: 'How We Work',
            heading: 'Our Process',
            subtitle: 'A clear, collaborative process that takes you from idea to impact.',
            items: [
              {
                index: '01',
                title: 'Discovery & Audit',
                description:
                  'We understand your business, goals and audit current marketing and operations.',
              },
              {
                index: '02',
                title: 'Strategy & Roadmap',
                description:
                  'We craft a clear growth plan with the right channels, creatives and operations.',
              },
              {
                index: '03',
                title: 'Execution & Launch',
                description:
                  'We get to work, from content and campaigns to operations and setup.',
              },
              {
                index: '04',
                title: 'Tracking & Performance',
                description:
                  'We monitor results, analyze key metrics and share clear performance updates.',
              },
              {
                index: '05',
                title: 'Optimization & Growth',
                description:
                  'We refine, scale and optimize continuously for better, long-term results.',
              },
            ],
          },
        }),
        createBlockNode('contact', {
          name: 'Contact & Interactive Globe',
        }),
        createBlockNode('faq', {
          name: 'Frequently Asked Questions',
          props: {
            eyebrow: 'FAQ',
            heading: 'Questions & answers',
            subtitle:
              'Everything you need to know about working with Klido, retainers, and timelines.',
            supportTitle: 'Still have questions?',
            supportText:
              'Reach out directly and our senior team will get back to you within one business day.',
            supportCtaLabel: 'Start a conversation',
            supportCtaUrl: '/contact',
            items: [
              {
                id: 'meta-ads-included',
                question: 'What is included in ₹9,999/month (Meta Ads)?',
                answer:
                  'It includes campaign strategy, ad setup, creative guidance, audience targeting, performance monitoring and monthly reporting. The ad spend is separate.',
              },
              {
                id: 'ad-budget',
                question: 'Is the advertising budget included in your pricing?',
                answer:
                  'No, the advertising media spend is billed directly by Meta, Google, or the platform through your own payment method. All ad accounts and pixels remain 100% under your legal ownership.',
              },
              {
                id: 'contracts',
                question: 'Do you offer monthly contracts?',
                answer:
                  'Yes, we operate on flexible monthly rolling retainers with a 30-day notice period, as well as milestone-based 90-day sprints.',
              },
              {
                id: 'timeline-results',
                question: 'How long does it take to see results?',
                answer:
                  'Diagnostic audits and initial campaign launches happen in weeks 1–2. Measurable improvements in CAC, ROAS, and qualified volume typically crystallize over days 30 to 60.',
              },
            ],
          },
        }),
        createBlockNode('footer', { name: 'Site Footer' }),
      ],
    },
  },
  {
    title: 'Services',
    slug: '/services',
    page_type: 'services',
    seo_metadata: {
      seoTitle: 'Services | Klido',
      metaDescription:
        'Paid acquisition, technical SEO, conversion architecture, and measurement infrastructure built by Klido.',
      canonicalUrl: 'https://www.klido.in/services',
      ogTitle: 'Services | Klido',
      ogDescription:
        'Explore Klido practice areas, deliverables, tooling stack, and monthly retainers.',
      ogImage: 'https://www.klido.in/klido_Logo.png',
      robotsIndex: true,
      robotsFollow: true,
    },
    tree: {
      version: 1,
      sections: [
        createBlockNode('hero', {
          name: 'Services Split Header',
          props: {
            variant: 'split-image',
            eyebrow: 'YOUR PARTNER IN DIGITAL GROWTH',
            headlinePrefix: 'We turn ambitious brands into',
            headlineAccent: 'brands people remember.',
            showLimeUnderline: false,
            description: createTiptapParagraph(
              'From brand positioning and performance marketing to creative campaigns and business operations, Klido brings everything together to help businesses build a stronger presence and grow with purpose.'
            ),
            primaryCta: { label: 'Build Your Scope Outline', href: '/contact', variant: 'primary' },
            secondaryCta: { label: 'See Operating Standards', href: '/approach', variant: 'secondary' },
            imageUrl: '',
            imageAlt: 'Strategist desk with layout sketchpad and swatches',
          },
        }),
        createBlockNode('services-grid', {
          name: 'Practice Areas Breakdown',
          props: {
            mode: 'practice-areas',
            eyebrow: 'Core Disciplines',
            heading: 'Four integrated growth practices',
            subtitle: 'Structured deliverables, tooling ownership, and weekly operating cadence.',
          },
        }),
        createBlockNode('cta', {
          name: 'Services Bottom CTA',
          props: {
            heading: 'Need a tailored channel and operations scope?',
            description: 'Share your current growth bottlenecks and we will respond with a concrete 90-day scope.',
            primaryCta: { label: 'Start a project brief', href: '/contact', variant: 'primary' },
          },
        }),
        createBlockNode('footer', { name: 'Site Footer' }),
      ],
    },
  },
  {
    title: 'Approach',
    slug: '/approach',
    page_type: 'approach',
    seo_metadata: {
      seoTitle: 'Operating Approach | Klido',
      metaDescription:
        'Clear sequences, verifiable tracking, onboarding diagnostics, and transparent agency operating boundaries.',
      canonicalUrl: 'https://www.klido.in/approach',
      ogTitle: 'Operating Approach | Klido',
      ogDescription: 'First 90 days in three stages plus Week 1–2 diagnostic checks.',
      ogImage: 'https://www.klido.in/klido_Logo.png',
      robotsIndex: true,
      robotsFollow: true,
    },
    tree: {
      version: 1,
      sections: [
        createBlockNode('hero', {
          name: 'Approach Header',
          props: {
            variant: 'editorial',
            eyebrow: 'Operating Approach',
            headlinePrefix: 'Clear sequences, verifiable tracking, and',
            headlineAccent: 'zero black-box management.',
            showLimeUnderline: false,
            description: createTiptapParagraph(
              'Good marketing operations feel calm and predictable. Here is how Klido onboards accounts, inspects diagnostic hygiene, and collaborates week to week.'
            ),
          },
        }),
        createBlockNode('statistics', {
          name: 'First 90 Days Phases',
          props: {
            variant: 'principles',
            eyebrow: 'Cadence',
            heading: 'First 90 days in three stages',
            items: [
              {
                index: 'Weeks 01–02',
                title: 'Measurement Baseline & Diagnostic Audit',
                description:
                  'Before altering bids or rewriting pages, we verify tracking integrity, audit historical queries, and align qualified lead definitions.',
                metaList: [
                  'Server-side GTM & CRM conversion trace',
                  'Paid spend waste & search term audit',
                  'Technical SEO crawl & template UX teardown',
                ],
              },
              {
                index: 'Weeks 03–04',
                title: 'System Architecture & Launch Preparation',
                description:
                  'We rebuild campaign hierarchies around commercial intent tiers and ship dedicated landing templates calibrated to each traffic source.',
                metaList: [
                  'Intent-tiered ad account structure',
                  'Message-matched campaign landing pages',
                  '90-day editorial & experiment roadmap',
                ],
              },
              {
                index: 'Month 02 Onward',
                title: 'Weekly Operating Cadence & Controlled Testing',
                description:
                  'Execution settles into a predictable weekly rhythm: Monday operating memos, bi-weekly creative tests, and monthly unit-economics reviews.',
                metaList: [
                  'Monday plain-English operating ledger',
                  'Bi-weekly creative & CRO test cycles',
                  'Monthly unit economics & channel review',
                ],
              },
            ],
          },
        }),
        createBlockNode('audit-matrix', {
          name: 'Diagnostic Audit Matrix & Boundaries',
        }),
        createBlockNode('footer', { name: 'Site Footer' }),
      ],
    },
  },
  {
    title: 'Contact',
    slug: '/contact',
    page_type: 'contact',
    seo_metadata: {
      seoTitle: 'Contact | Klido',
      metaDescription: 'Start a project with Klido or ask about paid media, social, influencer, or operations retainers.',
      canonicalUrl: 'https://www.klido.in/contact',
      ogTitle: 'Contact | Klido',
      ogDescription: "Let's build something great together.",
      ogImage: 'https://www.klido.in/klido_Logo.png',
      robotsIndex: true,
      robotsFollow: true,
    },
    tree: {
      version: 1,
      sections: [
        createBlockNode('contact', { name: 'Contact Section' }),
        createBlockNode('footer', { name: 'Site Footer' }),
      ],
    },
  },
  {
    title: 'About',
    slug: '/about',
    page_type: 'about',
    seo_metadata: {
      seoTitle: 'About Klido Studio | Klido',
      metaDescription:
        'An independent studio built to connect analytical media with clear design and business operations.',
      canonicalUrl: 'https://www.klido.in/about',
      ogTitle: 'About Klido Studio',
      ogDescription: 'Three operating principles and four core studio disciplines.',
      ogImage: 'https://www.klido.in/klido_Logo.png',
      robotsIndex: true,
      robotsFollow: true,
    },
    tree: {
      version: 1,
      sections: [
        createBlockNode('hero', {
          name: 'Studio Intro',
          props: {
            variant: 'editorial',
            eyebrow: 'About Klido Studio',
            headlinePrefix: 'An independent studio built to connect analytical media with',
            headlineAccent: 'clear design.',
            showLimeUnderline: false,
            description: createTiptapParagraph(
              'Klido was founded around a straightforward observation: most companies split paid acquisition, social, influencer campaigns, operations, and analytics across disconnected vendors. We operate as one compact studio so strategy, operations, creative, and measurement move together.'
            ),
            imageUrl: '',
            imageAlt: 'Klido studio workspace in natural daylight',
          },
        }),
        createBlockNode('statistics', {
          name: 'Three Operating Principles',
          props: {
            variant: 'principles',
            eyebrow: 'Principles',
            heading: 'Three principles guiding our work',
            items: [
              {
                index: '01.',
                title: 'Measurement precedes spend',
                description:
                  'Scaling media budget on broken conversion tracking hides wasted spend. Every engagement validates event accuracy and CRM alignment first.',
              },
              {
                index: '02.',
                title: 'Design is part of acquisition',
                description:
                  'Ads do half the job; the landing experience closes the loop. Our strategists and designers work in the same sprint rather than separate silos.',
              },
              {
                index: '03.',
                title: 'Plain language over jargon',
                description:
                  'Marketing reports should explain what changed, why it moved, and what we are testing next—without hiding behind vanity metrics.',
              },
            ],
          },
        }),
        createBlockNode('brands', { name: 'Brands We Work With' }),
        createBlockNode('cta', {
          name: 'About Bottom CTA',
          props: {
            heading: 'Interested in partnering with Klido on your next growth phase?',
            primaryCta: { label: "Tell us what you're building", href: '/contact', variant: 'primary' },
          },
        }),
        createBlockNode('footer', { name: 'Site Footer' }),
      ],
    },
  },
];
