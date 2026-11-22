import type { ReactNode } from 'react';
import type { z } from 'zod';
import {
  columnsPropsSchema,
  containerPropsSchema,
  gridPropsSchema,
  type BlockNode,
} from '../../schemas/blocks';

type ContainerProps = z.infer<typeof containerPropsSchema>;
type ColumnsProps = z.infer<typeof columnsPropsSchema>;
type GridProps = z.infer<typeof gridPropsSchema>;

export interface LayoutBlockRenderArgs {
  childrenNodes: BlockNode[];
  renderChild: (node: BlockNode) => ReactNode;
}

export function ContainerBlock({
  props,
  childrenNodes,
  renderChild,
}: { props: ContainerProps } & LayoutBlockRenderArgs) {
  const maxWidthClass =
    props.maxWidth === 'narrow'
      ? 'max-w-3xl'
      : props.maxWidth === 'wide'
        ? 'max-w-[1400px]'
        : props.maxWidth === 'full'
          ? 'max-w-none'
          : 'max-w-[1200px]';

  const surfaceClass =
    props.surface === 'white'
      ? 'bg-white'
      : props.surface === 'subtle'
        ? 'bg-[#F7F9FE]'
        : props.surface === 'grid-paper'
          ? 'bg-[#fafbff]'
          : '';

  return (
    <div className={`w-full py-6 ${surfaceClass}`}>
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClass}`}>
        {childrenNodes.length > 0 ? (
          <div className="space-y-6">{childrenNodes.map((child) => renderChild(child))}</div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#CFD6E6] p-6 text-center text-xs text-[#6B7388]">
            Empty Container — nest blocks here inside the Visual Builder
          </div>
        )}
      </div>
    </div>
  );
}

export function ColumnsBlock({
  props,
  childrenNodes,
  renderChild,
}: { props: ColumnsProps } & LayoutBlockRenderArgs) {
  const colsClass =
    props.columnCount === 4
      ? 'md:grid-cols-4'
      : props.columnCount === 3
        ? 'md:grid-cols-3'
        : 'md:grid-cols-2';

  const alignClass =
    props.verticalAlign === 'center'
      ? 'items-center'
      : props.verticalAlign === 'start'
        ? 'items-start'
        : 'items-stretch';

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
      {childrenNodes.length > 0 ? (
        <div className={`grid gap-6 ${colsClass} ${alignClass}`}>
          {childrenNodes.map((child) => (
            <div key={child.id} className="min-w-0">
              {renderChild(child)}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#CFD6E6] p-6 text-center text-xs text-[#6B7388]">
          Empty {props.columnCount}-Column Row — add child blocks
        </div>
      )}
    </div>
  );
}

export function GridBlock({
  props,
  childrenNodes,
  renderChild,
}: { props: GridProps } & LayoutBlockRenderArgs) {
  const mobileCols = props.columnsMobile === 2 ? 'grid-cols-2' : 'grid-cols-1';
  const desktopCols =
    props.columnsDesktop === 4
      ? 'lg:grid-cols-4'
      : props.columnsDesktop === 3
        ? 'lg:grid-cols-3'
        : 'lg:grid-cols-2';

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
      {childrenNodes.length > 0 ? (
        <div className={`grid gap-6 ${mobileCols} ${desktopCols}`}>
          {childrenNodes.map((child) => (
            <div key={child.id} className="min-w-0">
              {renderChild(child)}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#CFD6E6] p-6 text-center text-xs text-[#6B7388]">
          Empty Grid ({props.columnsDesktop} columns) — add child blocks
        </div>
      )}
    </div>
  );
}
