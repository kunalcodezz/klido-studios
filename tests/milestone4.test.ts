import { describe, expect, it } from 'vitest';
import {
  BlockRegistry,
  createBlockNode,
  getAllBlockDefinitions,
} from '../src/blocks/registry';
import {
  compileBlockCssProperties,
  resolveBlockStylesForViewport,
} from '../src/blocks/styleCompiler';
import { KLIDO_SEED_PAGES } from '../src/data/klidoSeedPages';
import { validatePageContentTree } from '../src/lib/schemaValidator';
import { blockStyleSchema } from '../src/schemas/styles';
import { createTiptapParagraph, tiptapDocSchema, tiptapDocToPlainText } from '../src/schemas/tiptap';

describe('Milestone 4 — Block Registry, Schema Validation & Rendering Engine', () => {
  it('registers all 18 expected Klido and layout blocks with valid defaultProps', () => {
    const definitions = getAllBlockDefinitions();
    const expectedTypes = [
      'hero',
      'senior-studio',
      'text',
      'image',
      'video',
      'services-grid',
      'portfolio-grid',
      'brands',
      'testimonials',
      'statistics',
      'cta',
      'contact',
      'faq',
      'audit-matrix',
      'footer',
      'container',
      'columns',
      'grid',
    ];

    expect(definitions.map((d) => d.type).sort()).toEqual([...expectedTypes].sort());

    for (const def of definitions) {
      const parsed = def.propsSchema.safeParse(def.defaultProps);
      expect(parsed.success, `Default props invalid for block "${def.type}"`).toBe(true);
    }
  });

  it('validates Tiptap structured JSON nodes and blocks unsafe javascript:/data: links', () => {
    const validDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Read our ' },
            {
              type: 'text',
              text: 'approach',
              marks: [
                {
                  type: 'link',
                  attrs: { href: 'https://www.klido.in/approach', target: '_blank' },
                },
              ],
            },
          ],
        },
      ],
    };

    expect(tiptapDocSchema.safeParse(validDoc).success).toBe(true);
    expect(tiptapDocToPlainText(createTiptapParagraph('Clean Klido growth'))).toBe(
      'Clean Klido growth'
    );

    const maliciousDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Click',
              marks: [
                {
                  type: 'link',
                  attrs: { href: 'javascript:alert(1)' },
                },
              ],
            },
          ],
        },
      ],
    };

    expect(tiptapDocSchema.safeParse(maliciousDoc).success).toBe(false);
  });

  it('validates nested layout trees and surfaces diagnostics for unknown or invalid blocks', () => {
    const nestedTree = {
      version: 1,
      sections: [
        createBlockNode('container', {
          children: [
            createBlockNode('columns', {
              children: [createBlockNode('text'), createBlockNode('image')],
            }),
          ],
        }),
      ],
    };

    const validResult = validatePageContentTree(nestedTree);
    expect(validResult.valid).toBe(true);
    expect(validResult.diagnostics).toHaveLength(0);

    const unknownTree = {
      version: 1,
      sections: [
        {
          id: 'unknown-1',
          type: 'legacy-widget',
          name: 'Legacy Widget',
          visible: true,
          locked: false,
          props: {},
          styles: {},
          responsive: {},
          animations: {
            preset: 'none',
            durationMs: 250,
            delayMs: 0,
            trigger: 'on-scroll',
            disableOnMobile: true,
          },
        },
      ],
    };

    const unknownResult = validatePageContentTree(unknownTree);
    expect(unknownResult.valid).toBe(false);
    expect(unknownResult.diagnostics[0]?.blockType).toBe('legacy-widget');
    expect(unknownResult.tree.sections).toHaveLength(1);
  });

  it('compiles responsive styles with desktop -> tablet -> mobile inheritance and blocks unsafe style URLs', () => {
    const desktop = {
      paddingTop: '80px',
      paddingLeft: '32px',
      textAlign: 'left' as const,
      backgroundColor: '#FFFFFF',
    };
    const responsive = {
      tablet: { paddingTop: '56px', textAlign: 'center' as const },
      mobile: { paddingTop: '36px' },
    };

    expect(resolveBlockStylesForViewport(desktop, responsive, 'desktop')).toEqual(desktop);
    expect(resolveBlockStylesForViewport(desktop, responsive, 'tablet')).toEqual({
      paddingTop: '56px',
      paddingLeft: '32px',
      textAlign: 'center',
      backgroundColor: '#FFFFFF',
    });
    expect(resolveBlockStylesForViewport(desktop, responsive, 'mobile')).toEqual({
      paddingTop: '36px',
      paddingLeft: '32px',
      textAlign: 'center',
      backgroundColor: '#FFFFFF',
    });

    const compiledMobile = compileBlockCssProperties(desktop, responsive, 'mobile');
    expect(compiledMobile.paddingTop).toBe('36px');
    expect(compiledMobile.textAlign).toBe('center');
    expect(compiledMobile.paddingLeft).toBe('32px');

    expect(
      blockStyleSchema.safeParse({ backgroundImageUrl: 'javascript:alert(1)' }).success
    ).toBe(false);
    expect(
      blockStyleSchema.safeParse({ paddingTop: '80px; background: red' }).success
    ).toBe(false);
  });

  it('validates all 5 seeded Klido public pages with zero schema errors', () => {
    expect(KLIDO_SEED_PAGES.map((p) => p.slug)).toEqual([
      '/',
      '/services',
      '/approach',
      '/contact',
      '/about',
    ]);

    for (const seedPage of KLIDO_SEED_PAGES) {
      const validation = validatePageContentTree(seedPage.tree);
      expect(
        validation.valid,
        `Seed page "${seedPage.slug}" failed validation: ${validation.diagnostics
          .map((d) => d.message)
          .join(', ')}`
      ).toBe(true);
      expect(seedPage.tree.sections.length).toBeGreaterThan(0);
    }

    expect(Object.keys(BlockRegistry).length).toBe(18);
  });
});
