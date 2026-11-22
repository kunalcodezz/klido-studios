import { createElement, type ComponentType, type ReactNode } from 'react';
import type { z } from 'zod';
import {
  auditMatrixPropsSchema,
  brandsPropsSchema,
  columnsPropsSchema,
  contactPropsSchema,
  containerPropsSchema,
  ctaPropsSchema,
  faqPropsSchema,
  footerPropsSchema,
  gridPropsSchema,
  heroPropsSchema,
  imageBlockPropsSchema,
  portfolioGridPropsSchema,
  seniorStudioPropsSchema,
  servicesGridPropsSchema,
  statisticsPropsSchema,
  testimonialsPropsSchema,
  textBlockPropsSchema,
  videoBlockPropsSchema,
  type BlockNode,
} from '../schemas/blocks';
import type { BlockStyles } from '../schemas/styles';
import { createTiptapParagraph } from '../schemas/tiptap';
import { HeroBlock, SeniorStudioBlock } from './components/HeroBlock';
import {
  CtaBlock,
  ImageBlock,
  StatisticsBlock,
  TextBlock,
  VideoBlock,
} from './components/PrimitiveBlocks';
import {
  BrandsBlock,
  PortfolioGridBlock,
  ServicesGridBlock,
  TestimonialsBlock,
} from './components/CollectionBlocks';
import {
  AuditMatrixBlock,
  ContactBlock,
  FaqBlock,
  FooterBlock,
} from './components/InteractiveBlocks';
import { ColumnsBlock, ContainerBlock, GridBlock } from './components/LayoutBlocks';

export type BlockCategory =
  | 'Hero'
  | 'About'
  | 'Services'
  | 'Portfolio'
  | 'Brands'
  | 'Testimonials'
  | 'Statistics'
  | 'CTA'
  | 'Contact'
  | 'FAQ'
  | 'Footer'
  | 'Layout';

export interface InspectorFieldMeta {
  key: string;
  label: string;
  control:
    | 'text'
    | 'textarea'
    | 'tiptap'
    | 'url'
    | 'image'
    | 'video'
    | 'select'
    | 'boolean'
    | 'number'
    | 'list';
  options?: string[];
}

export interface BlockComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any;
  childrenNodes: BlockNode[];
  renderChild: (node: BlockNode) => ReactNode;
}

export interface BlockDefinition {
  type: string;
  displayName: string;
  category: BlockCategory;
  description: string;
  supportsChildren: boolean;
  propsSchema: z.ZodTypeAny;
  defaultProps: Record<string, unknown>;
  defaultStyles: BlockStyles;
  editableFields: InspectorFieldMeta[];
  Component: ComponentType<BlockComponentProps>;
}

const REGISTRY: Record<string, BlockDefinition> = {
  hero: {
    type: 'hero',
    displayName: 'Hero Section',
    category: 'Hero',
    description: 'Klido split hero with highlighted accent headline, dual CTAs, and Campaign Map or media.',
    supportsChildren: false,
    propsSchema: heroPropsSchema,
    defaultProps: {
      variant: 'home-map',
      eyebrow: 'YOUR PARTNER IN DIGITAL GROWTH',
      headlinePrefix: 'We turn ambitious brands into',
      headlineAccent: 'brands people remember.',
      showLimeUnderline: true,
      description: createTiptapParagraph(
        'From brand positioning and performance marketing to creative campaigns and business operations, Klido brings everything together to help businesses grow with purpose.'
      ),
      primaryCta: { label: "Tell us what you're building", href: '#start-project', variant: 'primary' },
      secondaryCta: { label: 'See how we work', href: '/approach', variant: 'secondary' },
      imageUrl: '',
      imageAlt: '',
      campaignMapTitle: 'Campaign system',
      campaignMapStages: [
        {
          id: 'starting-point',
          kicker: 'Starting point',
          title: 'What makes the offer worth choosing?',
          subtext: 'Product truth, audience tension, commercial objective',
          summary: 'Product truth, audience tension, and commercial objective framed before spend.',
        },
        {
          id: 'the-argument',
          kicker: 'The argument',
          title: 'A message built around what matters',
          summary: 'Landing page and ad creative share one coherent commercial argument.',
        },
        {
          id: 'in-market',
          kicker: 'In market',
          title: 'Useful signals, read in context',
          summary: 'Verified conversion telemetry informs weekly budget and creative decisions.',
        },
      ],
    },
    defaultStyles: {},
    editableFields: [
      { key: 'variant', label: 'Hero Layout', control: 'select', options: ['home-map', 'split-image', 'editorial'] },
      { key: 'eyebrow', label: 'Eyebrow', control: 'text' },
      { key: 'headlinePrefix', label: 'Headline', control: 'text' },
      { key: 'headlineAccent', label: 'Highlighted Phrase', control: 'text' },
      { key: 'showLimeUnderline', label: 'Lime Underline Accent', control: 'boolean' },
      { key: 'description', label: 'Description', control: 'tiptap' },
      { key: 'imageUrl', label: 'Split / Editorial Image', control: 'image' },
    ],
    Component: ({ props }) => createElement(HeroBlock, { props }),
  },

  'senior-studio': {
    type: 'senior-studio',
    displayName: 'Senior Studio Split',
    category: 'About',
    description: 'Studio positioning split with square desk photography, underline accent, and checklist.',
    supportsChildren: false,
    propsSchema: seniorStudioPropsSchema,
    defaultProps: {
      eyebrow: 'A small, senior studio',
      headlinePrefix: 'Close enough to understand the work. Experienced enough to',
      headlineAccent: 'challenge it.',
      description: createTiptapParagraph(
        'Klido works directly with founders and marketing teams. The people shaping the strategy stay involved through creative development, launch, and review.'
      ),
      imageUrl: '',
      imageAlt: 'Klido studio brand stationery and swatches on desk',
      points: [
        'Senior attention from brief to review',
        'Clear scope, owners, and next decisions',
        'Built to work with your existing team',
      ],
    },
    defaultStyles: {},
    editableFields: [
      { key: 'eyebrow', label: 'Eyebrow', control: 'text' },
      { key: 'headlinePrefix', label: 'Headline', control: 'text' },
      { key: 'headlineAccent', label: 'Accent Phrase', control: 'text' },
      { key: 'description', label: 'Editorial Copy', control: 'tiptap' },
      { key: 'imageUrl', label: 'Studio Image', control: 'image' },
      { key: 'points', label: 'Checklist Items', control: 'list' },
    ],
    Component: ({ props }) => createElement(SeniorStudioBlock, { props }),
  },

  text: {
    type: 'text',
    displayName: 'Rich Text Block',
    category: 'About',
    description: 'Structured heading and Tiptap rich text prose block.',
    supportsChildren: false,
    propsSchema: textBlockPropsSchema,
    defaultProps: {
      eyebrow: '',
      heading: 'Editorial Section Heading',
      headingTag: 'h2',
      body: createTiptapParagraph(
        'Write structured copy with formatted paragraphs, headings, lists, and verified links.'
      ),
    },
    defaultStyles: {},
    editableFields: [
      { key: 'eyebrow', label: 'Eyebrow', control: 'text' },
      { key: 'heading', label: 'Heading', control: 'text' },
      { key: 'headingTag', label: 'Heading Level', control: 'select', options: ['h1', 'h2', 'h3', 'h4'] },
      { key: 'body', label: 'Body Content', control: 'tiptap' },
    ],
    Component: ({ props }) => createElement(TextBlock, { props }),
  },

  image: {
    type: 'image',
    displayName: 'Image Media',
    category: 'About',
    description: 'Responsive image container with alt text, aspect ratio, and caption.',
    supportsChildren: false,
    propsSchema: imageBlockPropsSchema,
    defaultProps: {
      src: '',
      alt: 'Klido studio visual asset',
      caption: '',
      aspectRatio: '16:9',
    },
    defaultStyles: {},
    editableFields: [
      { key: 'src', label: 'Image Asset', control: 'image' },
      { key: 'alt', label: 'Alt Text', control: 'text' },
      { key: 'caption', label: 'Caption', control: 'text' },
      { key: 'aspectRatio', label: 'Aspect Ratio', control: 'select', options: ['16:9', '4:3', '1:1', 'auto'] },
    ],
    Component: ({ props }) => createElement(ImageBlock, { props }),
  },

  video: {
    type: 'video',
    displayName: 'Video Embed',
    category: 'About',
    description: 'HTML5 video player supporting MP4/WebM media assets with optional poster image.',
    supportsChildren: false,
    propsSchema: videoBlockPropsSchema,
    defaultProps: {
      src: '',
      posterUrl: '',
      caption: '',
      controls: true,
      autoplayMutedLoop: false,
    },
    defaultStyles: {},
    editableFields: [
      { key: 'src', label: 'Video URL', control: 'video' },
      { key: 'posterUrl', label: 'Poster Image', control: 'image' },
      { key: 'caption', label: 'Caption', control: 'text' },
      { key: 'controls', label: 'Show Playback Controls', control: 'boolean' },
      { key: 'autoplayMutedLoop', label: 'Autoplay Muted Loop', control: 'boolean' },
    ],
    Component: ({ props }) => createElement(VideoBlock, { props }),
  },

  'services-grid': {
    type: 'services-grid',
    displayName: 'Services & Pricing Grid',
    category: 'Services',
    description: 'Displays live Klido Service Plans (with featured Growth Bundle) or Practice Areas.',
    supportsChildren: false,
    propsSchema: servicesGridPropsSchema,
    defaultProps: {
      mode: 'pricing-plans',
      eyebrow: 'Service Plans',
      heading: 'Transparent monthly growth plans',
      subtitle: 'Select an individual channel scope or combine everything into the Growth Bundle.',
      highlights: [
        { title: 'Transparent Pricing', detail: 'No hidden charges' },
        { title: 'Flexible Plans', detail: 'Upgrade or switch anytime' },
        { title: 'Dedicated Support', detail: 'Quick and reliable' },
      ],
    },
    defaultStyles: {},
    editableFields: [
      { key: 'mode', label: 'Display Mode', control: 'select', options: ['pricing-plans', 'practice-areas'] },
      { key: 'eyebrow', label: 'Eyebrow', control: 'text' },
      { key: 'heading', label: 'Heading', control: 'text' },
      { key: 'subtitle', label: 'Subtitle', control: 'textarea' },
    ],
    Component: ({ props }) => createElement(ServicesGridBlock, { props }),
  },

  'portfolio-grid': {
    type: 'portfolio-grid',
    displayName: 'Portfolio Grid',
    category: 'Portfolio',
    description: 'Dynamic showcase of published case studies and metrics from Portfolio collection.',
    supportsChildren: false,
    propsSchema: portfolioGridPropsSchema,
    defaultProps: {
      eyebrow: 'Selected Work',
      heading: 'Case Studies & Outcomes',
      subtitle: 'Measurable acquisition, SEO, and operational transformations.',
      featuredOnly: false,
      columns: 2,
    },
    defaultStyles: {},
    editableFields: [
      { key: 'eyebrow', label: 'Eyebrow', control: 'text' },
      { key: 'heading', label: 'Heading', control: 'text' },
      { key: 'subtitle', label: 'Subtitle', control: 'textarea' },
      { key: 'featuredOnly', label: 'Featured Only', control: 'boolean' },
    ],
    Component: ({ props }) => createElement(PortfolioGridBlock, { props }),
  },

  brands: {
    type: 'brands',
    displayName: 'Brands & Clients Showcase',
    category: 'Brands',
    description: 'Asymmetric Klido partner showcase pulling live records from Brands collection.',
    supportsChildren: false,
    propsSchema: brandsPropsSchema,
    defaultProps: {
      eyebrow: 'Brands we work with',
      headingPrefix: 'Partners in',
      headingAccent: 'real growth',
      subtitle:
        "A closer look at the brands we're building with — from operations to marketing, we help businesses grow online and beyond.",
      layoutMode: 'klido-asymmetric',
    },
    defaultStyles: {},
    editableFields: [
      { key: 'eyebrow', label: 'Eyebrow', control: 'text' },
      { key: 'headingPrefix', label: 'Heading Prefix', control: 'text' },
      { key: 'headingAccent', label: 'Highlighted Word', control: 'text' },
      { key: 'subtitle', label: 'Subtitle', control: 'textarea' },
      { key: 'layoutMode', label: 'Layout Variant', control: 'select', options: ['klido-asymmetric', 'uniform-grid'] },
    ],
    Component: ({ props }) => createElement(BrandsBlock, { props }),
  },

  testimonials: {
    type: 'testimonials',
    displayName: 'Testimonials Grid',
    category: 'Testimonials',
    description: 'Verified client quotes pulled from Testimonials collection.',
    supportsChildren: false,
    propsSchema: testimonialsPropsSchema,
    defaultProps: {
      eyebrow: 'Client Perspective',
      heading: 'What founders say',
      featuredOnly: false,
    },
    defaultStyles: {},
    editableFields: [
      { key: 'eyebrow', label: 'Eyebrow', control: 'text' },
      { key: 'heading', label: 'Heading', control: 'text' },
      { key: 'featuredOnly', label: 'Featured Only', control: 'boolean' },
    ],
    Component: ({ props }) => createElement(TestimonialsBlock, { props }),
  },

  statistics: {
    type: 'statistics',
    displayName: 'Process Timeline & Milestones',
    category: 'Statistics',
    description: 'Klido numbered timeline (How We Work), 90-day phases, or operating principles.',
    supportsChildren: false,
    propsSchema: statisticsPropsSchema,
    defaultProps: {
      variant: 'process-timeline',
      eyebrow: 'How We Work',
      heading: 'Our Process',
      subtitle: 'A clear, collaborative process that takes you from idea to impact.',
      items: [
        {
          index: '01',
          title: 'Discovery & Audit',
          description: 'We audit current ad accounts, tracking setup, and business goals.',
        },
        {
          index: '02',
          title: 'Strategy & Roadmap',
          description: 'We craft a clear growth plan with the right channels, creatives, and operations.',
        },
        {
          index: '03',
          title: 'Execution & Launch',
          description: 'We get to work, from content and campaigns to operations and setup.',
        },
        {
          index: '04',
          title: 'Tracking & Performance',
          description: 'We monitor results, analyze key metrics, and share clear performance updates.',
        },
        {
          index: '05',
          title: 'Optimization & Growth',
          description: 'We refine, scale, and optimize continuously for better, long-term results.',
        },
      ],
    },
    defaultStyles: {},
    editableFields: [
      { key: 'variant', label: 'Display Variant', control: 'select', options: ['process-timeline', 'principles', 'metrics-row'] },
      { key: 'eyebrow', label: 'Eyebrow', control: 'text' },
      { key: 'heading', label: 'Heading', control: 'text' },
      { key: 'subtitle', label: 'Subtitle', control: 'textarea' },
    ],
    Component: ({ props }) => createElement(StatisticsBlock, { props }),
  },

  cta: {
    type: 'cta',
    displayName: 'Call to Action Banner',
    category: 'CTA',
    description: 'Focused horizontal CTA strip with primary and optional secondary buttons.',
    supportsChildren: false,
    propsSchema: ctaPropsSchema,
    defaultProps: {
      heading: 'Interested in partnering with Klido on your next growth phase?',
      description: 'Share your goals and our senior team will respond within one business day.',
      primaryCta: { label: "Tell us what you're building", href: '/contact', variant: 'primary' },
    },
    defaultStyles: {},
    editableFields: [
      { key: 'heading', label: 'Heading', control: 'text' },
      { key: 'description', label: 'Description', control: 'textarea' },
    ],
    Component: ({ props }) => createElement(CtaBlock, { props }),
  },

  contact: {
    type: 'contact',
    displayName: 'Contact & Interactive Globe',
    category: 'Contact',
    description: 'Klido contact channels, 3D interactive canvas globe, and EmailJS lead intake form.',
    supportsChildren: false,
    propsSchema: contactPropsSchema,
    defaultProps: {
      eyebrow: 'Contact Us',
      heading: "Let's Build Something Great Together.",
      subtitle: "Have a project in mind, a question about our services, or just want to say hello? We'd love to hear from you.",
      email: 'klidoagency@gmail.com',
      phone: '+91 9172569021',
      instagramHandle: '@klidoagency',
      instagramUrl: 'https://www.instagram.com/klidoagency',
      showGlobe: true,
      formHeading: 'Send us a message',
      formSubtitle: "Fill out the form and we'll get back to you within one business day.",
      submitLabel: 'Send Message',
    },
    defaultStyles: {},
    editableFields: [
      { key: 'eyebrow', label: 'Eyebrow', control: 'text' },
      { key: 'heading', label: 'Heading', control: 'text' },
      { key: 'subtitle', label: 'Subtitle', control: 'textarea' },
      { key: 'email', label: 'Contact Email', control: 'text' },
      { key: 'phone', label: 'Phone Number', control: 'text' },
      { key: 'showGlobe', label: 'Show 3D Interactive Globe', control: 'boolean' },
      { key: 'submitLabel', label: 'Submit Button Label', control: 'text' },
    ],
    Component: ({ props }) => createElement(ContactBlock, { props }),
  },

  faq: {
    type: 'faq',
    displayName: 'FAQ Accordion',
    category: 'FAQ',
    description: 'Sticky left support card paired with an interactive accordion list.',
    supportsChildren: false,
    propsSchema: faqPropsSchema,
    defaultProps: {
      eyebrow: 'FAQ',
      heading: 'Questions & answers',
      subtitle: 'Clear answers on pricing, ad budgets, contracts, and onboarding timelines.',
      supportTitle: 'Still have questions?',
      supportText: 'Reach out directly and a senior team member will reply within one business day.',
      supportCtaLabel: 'Start a conversation',
      supportCtaUrl: '/contact',
      items: [
        {
          id: 'meta-ads-included',
          question: 'What is included in ₹9,999/month (Meta Ads)?',
          answer:
            'It includes campaign strategy, ad setup, creative guidance, audience targeting, performance monitoring and monthly reporting. Ad spend is billed separately.',
        },
        {
          id: 'contracts',
          question: 'Do you offer monthly contracts?',
          answer:
            'Yes, we operate on flexible monthly rolling retainers with a 30-day notice period, as well as milestone-based 90-day sprints.',
        },
      ],
    },
    defaultStyles: {},
    editableFields: [
      { key: 'eyebrow', label: 'Eyebrow', control: 'text' },
      { key: 'heading', label: 'Heading', control: 'text' },
      { key: 'subtitle', label: 'Subtitle', control: 'textarea' },
      { key: 'supportTitle', label: 'Support Card Title', control: 'text' },
      { key: 'supportText', label: 'Support Card Body', control: 'textarea' },
    ],
    Component: ({ props }) => createElement(FaqBlock, { props }),
  },

  'audit-matrix': {
    type: 'audit-matrix',
    displayName: 'Audit Matrix & Boundaries',
    category: 'Services',
    description: 'Interactive diagnostic domain tabs and Klido vs. Industry comparison table.',
    supportsChildren: false,
    propsSchema: auditMatrixPropsSchema,
    defaultProps: {
      eyebrow: 'Onboarding Diagnostics',
      heading: 'What we inspect in Weeks 1–2',
      subtitle: 'Select a diagnostic domain to examine concrete technical checks and artifacts.',
      domains: [
        {
          id: 'tracking',
          label: 'Tracking & Analytics',
          summary: 'Verifying every conversion event fires once and reconciles with CRM records.',
          checks: [
            {
              id: 'trk-1',
              title: 'Event deduplication across client and server',
              detail: 'Confirm browser pixels and server-side Conversion APIs share matching event IDs.',
              artifact: 'Tag Manager container export & event ID mapping sheet',
            },
          ],
        },
      ],
      boundariesHeading: 'How Klido operates vs. standard agency habits',
      boundaries: [
        {
          aspect: 'Account Ownership',
          klidoStandard: 'All ad accounts, tag containers, and domains stay 100% under your legal entity.',
          industryHabit: 'Agencies holding ad accounts inside proprietary agency-owned containers.',
        },
      ],
    },
    defaultStyles: {},
    editableFields: [
      { key: 'eyebrow', label: 'Eyebrow', control: 'text' },
      { key: 'heading', label: 'Heading', control: 'text' },
      { key: 'subtitle', label: 'Subtitle', control: 'textarea' },
    ],
    Component: ({ props }) => createElement(AuditMatrixBlock, { props }),
  },

  footer: {
    type: 'footer',
    displayName: 'Site Footer',
    category: 'Footer',
    description: 'Klido footer powered by GlobalSettingsProvider navigation & contact settings.',
    supportsChildren: false,
    propsSchema: footerPropsSchema,
    defaultProps: {
      showBranding: true,
      overrideDescription: '',
    },
    defaultStyles: {},
    editableFields: [
      { key: 'showBranding', label: 'Show Klido Wordmark', control: 'boolean' },
      { key: 'overrideDescription', label: 'Override Footer Description', control: 'textarea' },
    ],
    Component: ({ props }) => createElement(FooterBlock, { props }),
  },

  container: {
    type: 'container',
    displayName: 'Container',
    category: 'Layout',
    description: 'Nested layout wrapper controlling max-width and section surface.',
    supportsChildren: true,
    propsSchema: containerPropsSchema,
    defaultProps: {
      maxWidth: 'standard',
      surface: 'transparent',
    },
    defaultStyles: {},
    editableFields: [
      { key: 'maxWidth', label: 'Max Width', control: 'select', options: ['narrow', 'standard', 'wide', 'full'] },
      { key: 'surface', label: 'Surface Style', control: 'select', options: ['transparent', 'white', 'subtle', 'grid-paper'] },
    ],
    Component: ({ props, childrenNodes, renderChild }) =>
      createElement(ContainerBlock, { props, childrenNodes, renderChild }),
  },

  columns: {
    type: 'columns',
    displayName: 'Columns Row',
    category: 'Layout',
    description: 'Multi-column horizontal layout supporting nested child blocks.',
    supportsChildren: true,
    propsSchema: columnsPropsSchema,
    defaultProps: {
      columnCount: 2,
      verticalAlign: 'stretch',
    },
    defaultStyles: {},
    editableFields: [
      { key: 'verticalAlign', label: 'Vertical Alignment', control: 'select', options: ['start', 'center', 'stretch'] },
    ],
    Component: ({ props, childrenNodes, renderChild }) =>
      createElement(ColumnsBlock, { props, childrenNodes, renderChild }),
  },

  grid: {
    type: 'grid',
    displayName: 'Responsive Grid',
    category: 'Layout',
    description: 'Configurable desktop/mobile CSS grid supporting nested child blocks.',
    supportsChildren: true,
    propsSchema: gridPropsSchema,
    defaultProps: {
      columnsDesktop: 3,
      columnsMobile: 1,
    },
    defaultStyles: {},
    editableFields: [],
    Component: ({ props, childrenNodes, renderChild }) =>
      createElement(GridBlock, { props, childrenNodes, renderChild }),
  },
};

export const BlockRegistry = REGISTRY;

export function getBlockDefinition(type: string): BlockDefinition | null {
  return REGISTRY[type] ?? null;
}

export function getAllBlockDefinitions(): BlockDefinition[] {
  return Object.values(REGISTRY);
}

export function createBlockNode(
  type: string,
  overrides?: Partial<Pick<BlockNode, 'name' | 'props' | 'styles' | 'children'>>
): BlockNode {
  const def = getBlockDefinition(type);
  return {
    id: crypto.randomUUID(),
    type,
    name: overrides?.name ?? def?.displayName ?? type,
    visible: true,
    locked: false,
    props: {
      ...(def?.defaultProps ?? {}),
      ...(overrides?.props ?? {}),
    },
    styles: {
      ...(def?.defaultStyles ?? {}),
      ...(overrides?.styles ?? {}),
    },
    responsive: {},
    animations: {
      preset: 'none',
      durationMs: 250,
      delayMs: 0,
      trigger: 'on-scroll',
      disableOnMobile: true,
    },
    children: overrides?.children ?? (def?.supportsChildren ? [] : undefined),
  };
}
