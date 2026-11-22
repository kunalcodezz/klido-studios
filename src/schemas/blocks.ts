import { z } from 'zod';
import { tiptapDocSchema } from './tiptap';
import {
  animationConfigSchema,
  blockStyleSchema,
  responsiveOverridesSchema,
} from './styles';
import { optionalSafeUrlSchema, safeUrlSchema } from './validation';

export const ctaButtonSchema = z.object({
  label: z.string().trim().min(1).max(80),
  href: safeUrlSchema,
  variant: z.enum(['primary', 'secondary', 'ghost']).default('primary'),
});

export const heroPropsSchema = z.object({
  variant: z.enum(['home-map', 'split-image', 'editorial']).default('home-map'),
  eyebrow: z.string().trim().max(120).default('YOUR PARTNER IN DIGITAL GROWTH'),
  headlinePrefix: z.string().trim().min(1).max(200),
  headlineAccent: z.string().trim().max(120).default(''),
  showLimeUnderline: z.boolean().default(true),
  description: tiptapDocSchema,
  primaryCta: ctaButtonSchema.optional(),
  secondaryCta: ctaButtonSchema.optional(),
  imageUrl: optionalSafeUrlSchema.default(''),
  imageAlt: z.string().trim().max(240).default(''),
  campaignMapTitle: z.string().trim().max(80).default('Campaign system'),
  campaignMapStages: z
    .array(
      z.object({
        id: z.string(),
        kicker: z.string().max(60),
        title: z.string().max(120),
        subtext: z.string().max(160).optional(),
        summary: z.string().max(220),
      })
    )
    .default([]),
});

export const seniorStudioPropsSchema = z.object({
  eyebrow: z.string().trim().max(100).default('A small, senior studio'),
  headlinePrefix: z.string().trim().min(1).max(200),
  headlineAccent: z.string().trim().max(100).default('challenge it.'),
  description: tiptapDocSchema,
  imageUrl: optionalSafeUrlSchema.default(''),
  imageAlt: z.string().trim().max(240).default('Klido studio brand stationery'),
  points: z.array(z.string().trim().min(1).max(160)).default([]),
});

export const textBlockPropsSchema = z.object({
  eyebrow: z.string().trim().max(100).default(''),
  heading: z.string().trim().max(200).default(''),
  headingTag: z.enum(['h1', 'h2', 'h3', 'h4']).default('h2'),
  body: tiptapDocSchema,
});

export const imageBlockPropsSchema = z.object({
  src: optionalSafeUrlSchema.default(''),
  alt: z.string().trim().max(240).default('Studio visual'),
  caption: z.string().trim().max(240).default(''),
  aspectRatio: z.enum(['16:9', '4:3', '1:1', 'auto']).default('16:9'),
});

export const videoBlockPropsSchema = z.object({
  src: optionalSafeUrlSchema.default(''),
  posterUrl: optionalSafeUrlSchema.default(''),
  caption: z.string().trim().max(240).default(''),
  controls: z.boolean().default(true),
  autoplayMutedLoop: z.boolean().default(false),
});

export const servicesGridPropsSchema = z.object({
  mode: z.enum(['pricing-plans', 'practice-areas']).default('pricing-plans'),
  eyebrow: z.string().trim().max(100).default('Our Services'),
  heading: z.string().trim().max(200).default('Service Plans'),
  subtitle: z.string().trim().max(300).default(''),
  highlights: z
    .array(
      z.object({
        title: z.string().max(80),
        detail: z.string().max(120),
      })
    )
    .default([]),
});

export const portfolioGridPropsSchema = z.object({
  eyebrow: z.string().trim().max(100).default('Selected Work'),
  heading: z.string().trim().max(200).default('Case Studies & Outcomes'),
  subtitle: z.string().trim().max(300).default(''),
  featuredOnly: z.boolean().default(false),
  columns: z.union([z.literal(2), z.literal(3)]).default(2),
});

export const brandsPropsSchema = z.object({
  eyebrow: z.string().trim().max(100).default('Brands we work with'),
  headingPrefix: z.string().trim().max(120).default('Partners in'),
  headingAccent: z.string().trim().max(80).default('real growth'),
  subtitle: z.string().trim().max(300).default(''),
  layoutMode: z.enum(['klido-asymmetric', 'uniform-grid']).default('klido-asymmetric'),
});

export const testimonialsPropsSchema = z.object({
  eyebrow: z.string().trim().max(100).default('Client Perspective'),
  heading: z.string().trim().max(200).default('What founders say'),
  featuredOnly: z.boolean().default(false),
});

export const statisticsPropsSchema = z.object({
  variant: z.enum(['process-timeline', 'metrics-row', 'principles']).default('process-timeline'),
  eyebrow: z.string().trim().max(100).default('How We Work'),
  heading: z.string().trim().max(200).default('Our Process'),
  subtitle: z.string().trim().max(300).default(''),
  items: z
    .array(
      z.object({
        index: z.string().max(20),
        title: z.string().max(120),
        description: z.string().max(360),
        imageUrl: optionalSafeUrlSchema.optional(),
        imageAlt: z.string().max(200).optional(),
        metaList: z.array(z.string().max(120)).optional(),
      })
    )
    .default([]),
});

export const ctaPropsSchema = z.object({
  heading: z.string().trim().min(1).max(200),
  description: z.string().trim().max(320).default(''),
  primaryCta: ctaButtonSchema,
  secondaryCta: ctaButtonSchema.optional(),
});

export const contactPropsSchema = z.object({
  eyebrow: z.string().trim().max(80).default('Contact Us'),
  heading: z.string().trim().max(160).default("Let's Build Something Great Together."),
  subtitle: z.string().trim().max(300).default(''),
  email: z.string().trim().email().default('klidoagency@gmail.com'),
  phone: z.string().trim().max(40).default('+91 9172569021'),
  instagramHandle: z.string().trim().max(60).default('@klidoagency'),
  instagramUrl: optionalSafeUrlSchema.default('https://www.instagram.com/klidoagency'),
  showGlobe: z.boolean().default(true),
  formHeading: z.string().trim().max(120).default('Send us a message'),
  formSubtitle: z.string().trim().max(240).default("Fill out the form and we'll get back to you within one business day."),
  submitLabel: z.string().trim().max(60).default('Send Message'),
});

export const faqPropsSchema = z.object({
  eyebrow: z.string().trim().max(80).default('FAQ'),
  heading: z.string().trim().max(160).default('Questions & answers'),
  subtitle: z.string().trim().max(300).default(''),
  supportTitle: z.string().trim().max(120).default('Still have questions?'),
  supportText: z.string().trim().max(240).default('Reach out directly and a senior partner will respond within one business day.'),
  supportCtaLabel: z.string().trim().max(60).default('Contact us'),
  supportCtaUrl: safeUrlSchema.default('/contact'),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        question: z.string().min(1).max(220),
        answer: z.string().min(1).max(1200),
      })
    )
    .default([]),
});

export const auditMatrixPropsSchema = z.object({
  eyebrow: z.string().trim().max(80).default('Onboarding Diagnostics'),
  heading: z.string().trim().max(160).default('What we inspect in Weeks 1–2'),
  subtitle: z.string().trim().max(300).default(''),
  domains: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        summary: z.string(),
        checks: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            detail: z.string(),
            artifact: z.string(),
          })
        ),
      })
    )
    .default([]),
  boundariesHeading: z.string().trim().max(160).default('How Klido operates vs. standard agency habits'),
  boundaries: z
    .array(
      z.object({
        aspect: z.string(),
        klidoStandard: z.string(),
        industryHabit: z.string(),
      })
    )
    .default([]),
});

export const footerPropsSchema = z.object({
  showBranding: z.boolean().default(true),
  overrideDescription: z.string().trim().max(300).default(''),
});

export const containerPropsSchema = z.object({
  maxWidth: z.enum(['narrow', 'standard', 'wide', 'full']).default('standard'),
  surface: z.enum(['transparent', 'white', 'subtle', 'grid-paper']).default('transparent'),
});

export const columnsPropsSchema = z.object({
  columnCount: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2),
  verticalAlign: z.enum(['start', 'center', 'stretch']).default('stretch'),
});

export const gridPropsSchema = z.object({
  columnsDesktop: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  columnsMobile: z.union([z.literal(1), z.literal(2)]).default(1),
});

export type BlockType =
  | 'hero'
  | 'senior-studio'
  | 'text'
  | 'image'
  | 'video'
  | 'services-grid'
  | 'portfolio-grid'
  | 'brands'
  | 'testimonials'
  | 'statistics'
  | 'cta'
  | 'contact'
  | 'faq'
  | 'audit-matrix'
  | 'footer'
  | 'container'
  | 'columns'
  | 'grid';

export interface BlockNode {
  id: string;
  type: BlockType | string;
  name: string;
  visible: boolean;
  locked: boolean;
  props: Record<string, unknown>;
  styles: BlockStylesFallback;
  responsive: {
    tablet?: BlockStylesFallback;
    mobile?: BlockStylesFallback;
  };
  animations: {
    preset: 'none' | 'fade-in' | 'slide-up' | 'scale-in';
    durationMs: number;
    delayMs: number;
    trigger: 'on-load' | 'on-scroll';
    disableOnMobile: boolean;
  };
  children?: BlockNode[];
}

type BlockStylesFallback = z.infer<typeof blockStyleSchema>;

export const blockNodeSchema: z.ZodType<BlockNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    name: z.string().min(1).max(120),
    visible: z.boolean().default(true),
    locked: z.boolean().default(false),
    props: z.record(z.string(), z.unknown()).default({}),
    styles: blockStyleSchema.default({}),
    responsive: responsiveOverridesSchema,
    animations: animationConfigSchema,
    children: z.array(blockNodeSchema).optional(),
  })
);

export const pageContentTreeSchema = z.object({
  version: z.literal(1).default(1),
  sections: z.array(blockNodeSchema).default([]),
});

export type PageContentTree = z.infer<typeof pageContentTreeSchema>;
