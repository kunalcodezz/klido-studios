import type { ReactNode } from 'react';
import type { PageContentTree } from '../schemas/blocks';
import type { DesignSystemTokens, ViewportMode } from '../schemas/styles';
import { validatePageContentTree } from '../lib/schemaValidator';
import { DesignTokenProvider } from '../providers/DesignTokenProvider';
import { GlobalSettingsProvider, useGlobalSettings } from '../providers/GlobalSettingsProvider';
import { CMSDataProvider } from '../providers/CMSDataProvider';
import { SectionRenderer } from './SectionRenderer';

interface PageRendererProps {
  content: PageContentTree | Record<string, unknown>;
  viewport?: ViewportMode;
  editorMode?: boolean;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
  designTokensOverride?: Partial<DesignSystemTokens> | null;
}

function TokenScopedWrapper({
  designTokensOverride,
  children,
}: {
  designTokensOverride?: Partial<DesignSystemTokens> | null;
  children: ReactNode;
}) {
  const { designTokens } = useGlobalSettings();
  return (
    <DesignTokenProvider tokens={designTokensOverride ?? designTokens}>
      {children}
    </DesignTokenProvider>
  );
}

export function PageRenderer({
  content,
  viewport = 'desktop',
  editorMode = false,
  selectedBlockId = null,
  onSelectBlock,
  designTokensOverride,
}: PageRendererProps) {
  const { tree } = validatePageContentTree(content);

  return (
    <GlobalSettingsProvider>
      <CMSDataProvider>
        <TokenScopedWrapper designTokensOverride={designTokensOverride}>
          {tree.sections.length === 0 ? (
            <div className="mx-auto max-w-[1200px] px-4 py-16 text-center text-sm text-[#4A5268]">
              This page currently has no sections. Add a block from the Sections Library to begin.
            </div>
          ) : (
            <div>
              {tree.sections.map((section) => (
                <SectionRenderer
                  key={section.id}
                  node={section}
                  viewport={viewport}
                  editorMode={editorMode}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={onSelectBlock}
                />
              ))}
            </div>
          )}
        </TokenScopedWrapper>
      </CMSDataProvider>
    </GlobalSettingsProvider>
  );
}
