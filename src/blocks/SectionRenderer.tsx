import { useState } from 'react';
import type { BlockNode } from '../schemas/blocks';
import type { ViewportMode } from '../schemas/styles';
import { compileBlockCssProperties } from './styleCompiler';
import { BlockResolver } from './BlockResolver';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

interface SectionRendererProps {
  node: BlockNode;
  viewport?: ViewportMode;
  editorMode?: boolean;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
}

export function SectionRenderer({
  node,
  viewport = 'desktop',
  editorMode = false,
  selectedBlockId = null,
  onSelectBlock,
}: SectionRendererProps) {
  const [hovered, setHovered] = useState(false);

  if (!node.visible && !editorMode) {
    return null;
  }

  const compiledStyle = compileBlockCssProperties(node.styles, node.responsive, viewport);
  const isSelected = editorMode && selectedBlockId === node.id;

  const animationClass =
    node.animations?.preset === 'fade-in'
      ? 'transition-opacity'
      : node.animations?.preset === 'slide-up'
        ? 'transition-transform'
        : '';

  return (
    <div
      data-block-id={node.id}
      data-block-type={node.type}
      style={{
        ...compiledStyle,
        transitionDuration: node.animations?.durationMs
          ? `${node.animations.durationMs}ms`
          : undefined,
      }}
      onClick={
        editorMode && onSelectBlock
          ? (e) => {
              e.stopPropagation();
              onSelectBlock(node.id);
            }
          : undefined
      }
      onMouseEnter={editorMode ? () => setHovered(true) : undefined}
      onMouseLeave={editorMode ? () => setHovered(false) : undefined}
      className={`relative ${animationClass} ${
        !node.visible && editorMode ? 'opacity-45' : ''
      } ${
        editorMode
          ? `cursor-pointer ${
              isSelected
                ? 'outline-2 outline-offset-[-2px] outline-[#123FFF]'
                : hovered
                  ? 'outline-1 outline-dashed outline-[#123FFF]/50'
                  : ''
            }`
          : ''
      }`}
    >
      {editorMode && (isSelected || hovered) ? (
        <div
          className={`pointer-events-none absolute left-2 top-2 z-20 rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white ${
            isSelected ? 'bg-[#123FFF]' : 'bg-[#0D1126]/80'
          }`}
        >
          {node.name}
          {!node.visible ? ' (Hidden)' : ''}
          {node.locked ? ' (Locked)' : ''}
        </div>
      ) : null}

      <ErrorBoundary fallbackTitle={`Section "${node.name}" failed to render`}>
        <BlockResolver
          node={node}
          editorMode={editorMode}
          renderChild={(child) => (
            <SectionRenderer
              key={child.id}
              node={child}
              viewport={viewport}
              editorMode={editorMode}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
        />
      </ErrorBoundary>
    </div>
  );
}
