import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from 'react';
import {
  DEFAULT_KLIDO_DESIGN_TOKENS,
  designSystemTokensSchema,
  type DesignSystemTokens,
} from '../schemas/styles';

interface DesignTokenContextValue {
  tokens: DesignSystemTokens;
}

const DesignTokenContext = createContext<DesignTokenContextValue>({
  tokens: DEFAULT_KLIDO_DESIGN_TOKENS,
});

interface DesignTokenProviderProps {
  tokens?: Partial<DesignSystemTokens> | Record<string, unknown> | null;
  children: ReactNode;
  className?: string;
}

export function DesignTokenProvider({
  tokens: rawTokens,
  children,
  className = '',
}: DesignTokenProviderProps) {
  const tokens = useMemo<DesignSystemTokens>(() => {
    if (!rawTokens) return DEFAULT_KLIDO_DESIGN_TOKENS;
    const merged = {
      colors: { ...DEFAULT_KLIDO_DESIGN_TOKENS.colors, ...(rawTokens as Partial<DesignSystemTokens>).colors },
      typography: {
        ...DEFAULT_KLIDO_DESIGN_TOKENS.typography,
        ...(rawTokens as Partial<DesignSystemTokens>).typography,
      },
      buttons: {
        ...DEFAULT_KLIDO_DESIGN_TOKENS.buttons,
        ...(rawTokens as Partial<DesignSystemTokens>).buttons,
      },
      layout: {
        ...DEFAULT_KLIDO_DESIGN_TOKENS.layout,
        ...(rawTokens as Partial<DesignSystemTokens>).layout,
      },
    };
    const parsed = designSystemTokensSchema.safeParse(merged);
    return parsed.success ? parsed.data : DEFAULT_KLIDO_DESIGN_TOKENS;
  }, [rawTokens]);

  const cssVars = useMemo(
    () =>
      ({
        '--klido-primary': tokens.colors.primary,
        '--klido-primary-hover': tokens.colors.primaryHover,
        '--klido-secondary': tokens.colors.secondary,
        '--klido-accent': tokens.colors.accent,
        '--klido-text': tokens.colors.text,
        '--klido-muted': tokens.colors.mutedText,
        '--klido-bg': tokens.colors.background,
        '--klido-surface': tokens.colors.surface,
        '--klido-border': tokens.colors.border,
        '--klido-font-heading': `'${tokens.typography.headingFont}', -apple-system, BlinkMacSystemFont, sans-serif`,
        '--klido-font-body': `'${tokens.typography.bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif`,
        '--klido-font-mono': `'${tokens.typography.monoFont}', ui-monospace, monospace`,
        '--klido-btn-radius': `${tokens.buttons.radiusPx}px`,
        '--klido-container-max': `${tokens.layout.containerMaxWidthPx}px`,
        '--klido-section-space': `${tokens.layout.sectionSpacingPx}px`,
        '--klido-radius': `${tokens.layout.globalRadiusPx}px`,
        fontFamily: `var(--klido-font-body)`,
        color: tokens.colors.text,
        backgroundColor: tokens.colors.background,
      }) as CSSProperties,
    [tokens]
  );

  return (
    <DesignTokenContext.Provider value={{ tokens }}>
      <div style={cssVars} className={`klido-canvas-scope ${className}`}>
        {children}
      </div>
    </DesignTokenContext.Provider>
  );
}

export function useDesignTokens(): DesignSystemTokens {
  return useContext(DesignTokenContext).tokens;
}
