import { z } from 'zod';
import { isSafeUrl } from './validation';

export const tiptapMarkSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bold') }),
  z.object({ type: z.literal('italic') }),
  z.object({ type: z.literal('underline') }),
  z.object({ type: z.literal('strike') }),
  z.object({ type: z.literal('code') }),
  z.object({
    type: z.literal('link'),
    attrs: z.object({
      href: z.string().refine(isSafeUrl, 'Link URL must use a safe protocol or relative path.'),
      target: z.enum(['_self', '_blank']).optional(),
      rel: z.string().optional(),
    }),
  }),
]);

export interface TiptapTextNode {
  type: 'text';
  text: string;
  marks?: z.infer<typeof tiptapMarkSchema>[];
}

export interface TiptapNode {
  type:
    | 'doc'
    | 'paragraph'
    | 'heading'
    | 'bulletList'
    | 'orderedList'
    | 'listItem'
    | 'blockquote'
    | 'hardBreak'
    | 'text';
  attrs?: Record<string, string | number | boolean | null>;
  content?: TiptapNode[];
  text?: string;
  marks?: z.infer<typeof tiptapMarkSchema>[];
}

export const tiptapNodeSchema: z.ZodType<TiptapNode> = z.lazy(() =>
  z.object({
    type: z.enum([
      'doc',
      'paragraph',
      'heading',
      'bulletList',
      'orderedList',
      'listItem',
      'blockquote',
      'hardBreak',
      'text',
    ]),
    attrs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
    content: z.array(tiptapNodeSchema).optional(),
    text: z.string().optional(),
    marks: z.array(tiptapMarkSchema).optional(),
  })
);

export const tiptapDocSchema = z.object({
  type: z.literal('doc'),
  content: z.array(tiptapNodeSchema).default([]),
});

export type TiptapDoc = z.infer<typeof tiptapDocSchema>;

export function createTiptapParagraph(text: string): TiptapDoc {
  return {
    type: 'doc',
    content: text
      ? [
          {
            type: 'paragraph',
            content: [{ type: 'text', text }],
          },
        ]
      : [],
  };
}

export function tiptapDocToPlainText(doc: TiptapDoc | undefined | null): string {
  if (!doc || !Array.isArray(doc.content)) return '';

  const walk = (nodes: TiptapNode[]): string =>
    nodes
      .map((node) => {
        if (node.type === 'text') return node.text ?? '';
        if (node.type === 'hardBreak') return '\n';
        if (node.content) return walk(node.content);
        return '';
      })
      .join(doc.content.length > 1 ? '\n' : '');

  return walk(doc.content).trim();
}
