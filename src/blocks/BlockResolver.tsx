import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { BlockNode } from '../schemas/blocks';
import { getBlockDefinition } from './registry';

interface BlockResolverProps {
  node: BlockNode;
  editorMode?: boolean;
  renderChild: (child: BlockNode) => ReactNode;
}

export function BlockResolver({
  node,
  editorMode = false,
  renderChild,
}: BlockResolverProps) {
  const definition = getBlockDefinition(node.type);

  if (!definition) {
    console.warn(`[BlockResolver] Unknown CMS block type "${node.type}" (id: ${node.id}).`);

    if (!editorMode) {
      return null;
    }

    return (
      <div className="mx-auto my-4 max-w-[1200px] rounded-lg border border-amber-200 bg-amber-50 p-5 text-xs text-amber-900">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Unknown block type: {node.type}</p>
            <p className="mt-1 text-amber-800">
              This block is not registered in the current BlockRegistry. It is safely bypassed on
              the public website.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const parsedProps = definition.propsSchema.safeParse({
    ...definition.defaultProps,
    ...node.props,
  });

  if (!parsedProps.success) {
    console.warn(
      `[BlockResolver] Validation failed for block "${node.type}" (${node.id}):`,
      parsedProps.error.issues
    );

    if (!editorMode) {
      return null;
    }

    return (
      <div className="mx-auto my-4 max-w-[1200px] rounded-lg border border-red-200 bg-red-50 p-5 text-xs text-red-800">
        <p className="font-semibold">Invalid configuration for {definition.displayName}</p>
        <p className="mt-1">
          {parsedProps.error.issues[0]?.message ?? 'Block properties failed schema validation.'}
        </p>
      </div>
    );
  }

  const Component = definition.Component;
  return (
    <Component
      props={parsedProps.data}
      childrenNodes={node.children ?? []}
      renderChild={renderChild}
    />
  );
}
