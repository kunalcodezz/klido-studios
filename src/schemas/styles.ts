import { z } from 'zod';
import { optionalSafeUrlSchema } from './validation';

const safeCssLength = z
  .string()
  .trim()
  .regex(/^(\d+(\.\d+)?(px|rem|em|%|vw|vh)|auto|none|0)$/, 'Invalid CSS dimension')
  .optional();

const safeColor = z
  .string()
  .trim()
  .regex(
    /^(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|var\(--[a-z0-9-]+\)|transparent|inherit)$/,
    'Invalid color token or hex value'
  )
  .optional();

export const blockStyleSchema = z
  .object({
    // Typography
    fontFamily: z.enum(['inherit', 'display', 'body', 'mono', 'editorial']).optional(),
    fontSize: safeCssLength,
    fontWeight: z.enum(['400', '500', '600', '700']).optional(),
    lineHeight: z.string().trim().regex(/^(\d+(\.\d+)?|normal)$/).optional(),
    letterSpacing: z.string().trim().regex(/^-?\d+(\.\d+)?(px|em)$/).optional(),
    textAlign: z.enum(['left', 'center', 'right']).optional(),
    textColor: safeColor,
    textDecoration: z.enum(['none', 'underline']).optional(),
    textTransform: z.enum(['none', 'uppercase', 'capitalize']).optional(),

    // Layout
    width: safeCssLength,
    maxWidth: safeCssLength,
    height: safeCssLength,
    minHeight: safeCssLength,
    display: z.enum(['block', 'flex', 'grid', 'inline-flex', 'none']).optional(),
    flexDirection: z.enum(['row', 'column']).optional(),
    alignItems: z.enum(['stretch', 'flex-start', 'center', 'flex-end']).optional(),
    justifyContent: z
      .enum(['flex-start', 'center', 'flex-end', 'space-between', 'space-around'])
      .optional(),
    gridColumns: z.number().int().min(1).max(12).optional(),
    gap: safeCssLength,
    overflow: z.enum(['visible', 'hidden', 'auto']).optional(),

    // Spacing
    marginTop: safeCssLength,
    marginBottom: safeCssLength,
    paddingTop: safeCssLength,
    paddingBottom: safeCssLength,
    paddingLeft: safeCssLength,
    paddingRight: safeCssLength,

    // Appearance
    backgroundColor: safeColor,
    backgroundImageUrl: optionalSafeUrlSchema.optional(),
    borderWidth: safeCssLength,
    borderColor: safeColor,
    borderRadius: safeCssLength,
    boxShadow: z.enum(['none', 'subtle', 'elevated', 'card']).optional(),
    opacity: z.number().min(0).max(1).optional(),
  })
  .strict();

export type BlockStyles = z.infer<typeof blockStyleSchema>;

export const responsiveOverridesSchema = z
  .object({
    tablet: blockStyleSchema.optional(),
    mobile: blockStyleSchema.optional(),
  })
  .default({});

export type ResponsiveOverrides = z.infer<typeof responsiveOverridesSchema>;

export const animationConfigSchema = z
  .object({
    preset: z.enum(['none', 'fade-in', 'slide-up', 'scale-in']).default('none'),
    durationMs: z.number().int().min(50).max(1500).default(250),
    delayMs: z.number().int().min(0).max(1000).default(0),
    trigger: z.enum(['on-load', 'on-scroll']).default('on-scroll'),
    disableOnMobile: z.boolean().default(true),
  })
  .default({
    preset: 'none',
    durationMs: 250,
    delayMs: 0,
    trigger: 'on-scroll',
    disableOnMobile: true,
  });

export type AnimationConfig = z.infer<typeof animationConfigSchema>;
export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const designSystemTokensSchema = z.object({
  colors: z.object({
    primary: z.string(),
    primaryHover: z.string(),
    secondary: z.string(),
    accent: z.string(),
    text: z.string(),
    mutedText: z.string(),
    background: z.string(),
    surface: z.string(),
    border: z.string(),
  }),
  typography: z.object({
    headingFont: z.string(),
    bodyFont: z.string(),
    monoFont: z.string(),
    baseSizePx: z.number().min(12).max(22),
    headingWeight: z.number().min(400).max(800),
    bodyWeight: z.number().min(300).max(700),
    headingLineHeight: z.number().min(1).max(2),
    bodyLineHeight: z.number().min(1.2).max(2.2),
  }),
  buttons: z.object({
    radiusPx: z.number().min(0).max(32),
    paddingX: z.number().min(8).max(48),
    paddingY: z.number().min(4).max(28),
  }),
  layout: z.object({
    containerMaxWidthPx: z.number().min(800).max(1600),
    sectionSpacingPx: z.number().min(24).max(160),
    gridGapPx: z.number().min(8).max(64),
    globalRadiusPx: z.number().min(0).max(32),
  }),
});

export type DesignSystemTokens = z.infer<typeof designSystemTokensSchema>;

export const DEFAULT_KLIDO_DESIGN_TOKENS: DesignSystemTokens = {
  colors: {
    primary: '#123FFF',
    primaryHover: '#0D31CC',
    secondary: '#0D1126',
    accent: '#C2F81A',
    text: '#0D1126',
    mutedText: '#4A5268',
    background: '#FFFFFF',
    surface: '#F7F9FE',
    border: '#E5E9F2',
  },
  typography: {
    headingFont: 'Plus Jakarta Sans',
    bodyFont: 'DM Sans',
    monoFont: 'JetBrains Mono',
    baseSizePx: 16,
    headingWeight: 700,
    bodyWeight: 400,
    headingLineHeight: 1.1,
    bodyLineHeight: 1.6,
  },
  buttons: {
    radiusPx: 8,
    paddingX: 24,
    paddingY: 12,
  },
  layout: {
    containerMaxWidthPx: 1200,
    sectionSpacingPx: 80,
    gridGapPx: 24,
    globalRadiusPx: 16,
  },
};
