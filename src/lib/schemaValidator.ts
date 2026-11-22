import { pageContentTreeSchema, type BlockNode, type PageContentTree } from '../schemas/blocks';
import { getBlockDefinition } from '../blocks/registry';

export interface ValidationDiagnostic {
  blockId?: string;
  blockType?: string;
  message: string;
}

export interface PageTreeValidationResult {
  valid: boolean;
  tree: PageContentTree;
  diagnostics: ValidationDiagnostic[];
}

export function validatePageContentTree(raw: unknown): PageTreeValidationResult {
  const diagnostics: ValidationDiagnostic[] = [];
  const parsed = pageContentTreeSchema.safeParse(raw);

  if (!parsed.success) {
    diagnostics.push({
      message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    });
    return {
      valid: false,
      tree: { version: 1, sections: [] },
      diagnostics,
    };
  }

  const validateBlockRecursive = (node: BlockNode) => {
    const def = getBlockDefinition(node.type);
    if (!def) {
      diagnostics.push({
        blockId: node.id,
        blockType: node.type,
        message: `Unknown block type "${node.type}". Safe fallback will render.`,
      });
    } else {
      const propCheck = def.propsSchema.safeParse(node.props);
      if (!propCheck.success) {
        diagnostics.push({
          blockId: node.id,
          blockType: node.type,
          message: `Invalid props for "${node.type}": ${propCheck.error.issues[0]?.message ?? 'Validation error'}`,
        });
      }
    }

    if (node.children) {
      node.children.forEach(validateBlockRecursive);
    }
  };

  parsed.data.sections.forEach(validateBlockRecursive);

  return {
    valid: diagnostics.length === 0,
    tree: parsed.data,
    diagnostics,
  };
}
