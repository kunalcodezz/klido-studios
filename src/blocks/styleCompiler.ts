import type { CSSProperties } from 'react';
import type { BlockStyles, ResponsiveOverrides, ViewportMode } from '../schemas/styles';
import { isSafeUrl } from '../schemas/validation';

const SHADOW_MAP: Record<NonNullable<BlockStyles['boxShadow']>, string> = {
  none: 'none',
  subtle: '0 6px 18px -8px rgba(13, 17, 38, 0.06)',
  elevated: '0 18px 45px -20px rgba(13, 17, 38, 0.08)',
  card: '0 24px 60px -18px rgba(13, 17, 38, 0.1)',
};

const FONT_FAMILY_MAP: Record<NonNullable<BlockStyles['fontFamily']>, string> = {
  inherit: 'inherit',
  display: 'var(--klido-font-heading, "Plus Jakarta Sans", sans-serif)',
  body: 'var(--klido-font-body, "DM Sans", sans-serif)',
  mono: 'var(--klido-font-mono, "JetBrains Mono", monospace)',
  editorial: '"Playfair Display", Georgia, serif',
};

export function resolveBlockStylesForViewport(
  desktopStyles: BlockStyles | undefined,
  responsive: ResponsiveOverrides | undefined,
  viewport: ViewportMode
): BlockStyles {
  const base = desktopStyles ?? {};
  if (viewport === 'desktop') return base;
  if (viewport === 'tablet') {
    return { ...base, ...(responsive?.tablet ?? {}) };
  }
  return { ...base, ...(responsive?.tablet ?? {}), ...(responsive?.mobile ?? {}) };
}

export function compileBlockCssProperties(
  desktopStyles: BlockStyles | undefined,
  responsive: ResponsiveOverrides | undefined,
  viewport: ViewportMode
): CSSProperties {
  const s = resolveBlockStylesForViewport(desktopStyles, responsive, viewport);
  const css: CSSProperties = {};

  if (s.fontFamily) css.fontFamily = FONT_FAMILY_MAP[s.fontFamily];
  if (s.fontSize) css.fontSize = s.fontSize;
  if (s.fontWeight) css.fontWeight = Number(s.fontWeight);
  if (s.lineHeight) css.lineHeight = s.lineHeight;
  if (s.letterSpacing) css.letterSpacing = s.letterSpacing;
  if (s.textAlign) css.textAlign = s.textAlign;
  if (s.textColor) css.color = s.textColor;
  if (s.textDecoration) css.textDecoration = s.textDecoration;
  if (s.textTransform) css.textTransform = s.textTransform;

  if (s.width) css.width = s.width;
  if (s.maxWidth) css.maxWidth = s.maxWidth;
  if (s.height) css.height = s.height;
  if (s.minHeight) css.minHeight = s.minHeight;
  if (s.display) css.display = s.display;
  if (s.flexDirection) css.flexDirection = s.flexDirection;
  if (s.alignItems) css.alignItems = s.alignItems;
  if (s.justifyContent) css.justifyContent = s.justifyContent;
  if (s.gridColumns && s.display === 'grid') {
    css.gridTemplateColumns = `repeat(${s.gridColumns}, minmax(0, 1fr))`;
  }
  if (s.gap) css.gap = s.gap;
  if (s.overflow) css.overflow = s.overflow;

  if (s.marginTop) css.marginTop = s.marginTop;
  if (s.marginBottom) css.marginBottom = s.marginBottom;
  if (s.paddingTop) css.paddingTop = s.paddingTop;
  if (s.paddingBottom) css.paddingBottom = s.paddingBottom;
  if (s.paddingLeft) css.paddingLeft = s.paddingLeft;
  if (s.paddingRight) css.paddingRight = s.paddingRight;

  if (s.backgroundColor) css.backgroundColor = s.backgroundColor;
  if (s.backgroundImageUrl && isSafeUrl(s.backgroundImageUrl)) {
    css.backgroundImage = `url("${s.backgroundImageUrl.replace(/"/g, '%22')}")`;
    css.backgroundSize = 'cover';
    css.backgroundPosition = 'center';
  }
  if (s.borderWidth) {
    css.borderWidth = s.borderWidth;
    css.borderStyle = 'solid';
  }
  if (s.borderColor) css.borderColor = s.borderColor;
  if (s.borderRadius) css.borderRadius = s.borderRadius;
  if (s.boxShadow) css.boxShadow = SHADOW_MAP[s.boxShadow];
  if (typeof s.opacity === 'number') css.opacity = s.opacity;

  return css;
}
