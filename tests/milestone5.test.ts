import { beforeEach, describe, expect, it } from 'vitest';
import { createBlockNode } from '../src/blocks/registry';
import { findBlockById, useEditorStore } from '../src/stores/editorStore';
import { useHistoryStore } from '../src/stores/historyStore';
import type { PageRecord } from '../src/types/database';

const MOCK_PAGE: PageRecord = {
  id: '00000000-0000-0000-0000-000000000101',
  title: 'Home',
  slug: '/',
  page_type: 'home',
  status: 'draft',
  seo_metadata: {
    seoTitle: 'Klido',
    metaDescription: 'Klido studio',
    canonicalUrl: 'https://www.klido.in/',
    ogTitle: 'Klido',
    ogDescription: 'Klido studio',
    ogImage: '',
    robotsIndex: true,
    robotsFollow: true,
  },
  published_revision_id: null,
  draft_revision_id: 'rev-1',
  published_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: null,
  updated_by: null,
};

describe('Milestone 5 — Visual Editor Store, History & Nested Layout Operations', () => {
  beforeEach(() => {
    const hero = createBlockNode('hero');
    const container = createBlockNode('container', {
      children: [createBlockNode('text'), createBlockNode('image')],
    });
    useEditorStore.getState().loadPage(
      MOCK_PAGE,
      { version: 1, sections: [hero, container] },
      'rev-1'
    );
  });

  it('reorders top-level sections and nested child blocks cleanly', () => {
    const state = useEditorStore.getState();
    const [first, second] = state.content.sections;

    state.reorderSections(first.id, second.id);
    expect(useEditorStore.getState().content.sections.map((s) => s.id)).toEqual([
      second.id,
      first.id,
    ]);

    const container = useEditorStore.getState().content.sections[0];
    const [childA, childB] = container.children ?? [];
    useEditorStore.getState().reorderChildBlocks(container.id, childA.id, childB.id);

    const updatedContainer = findBlockById(
      useEditorStore.getState().content.sections,
      container.id
    );
    expect(updatedContainer?.children?.map((c) => c.id)).toEqual([childB.id, childA.id]);
  });

  it('duplicates nested blocks with unique IDs and prevents self-nesting containers', () => {
    const container = useEditorStore.getState().content.sections[1];
    const originalChildId = container.children?.[0]?.id;

    useEditorStore.getState().duplicateBlock(container.id);
    const sectionsAfterDup = useEditorStore.getState().content.sections;
    expect(sectionsAfterDup).toHaveLength(3);

    const clonedContainer = sectionsAfterDup[2];
    expect(clonedContainer.id).not.toBe(container.id);
    expect(clonedContainer.name).toContain('Copy');
    expect(clonedContainer.children?.[0]?.id).not.toBe(originalChildId);

    // Prevent nesting a container inside itself
    useEditorStore.getState().moveBlockToContainer(container.id, container.id);
    expect(useEditorStore.getState().content.sections).toHaveLength(3);
  });

  it('enforces block lock protection and tracks dirty/saved state', () => {
    const heroId = useEditorStore.getState().content.sections[0].id;
    useEditorStore.getState().toggleLock(heroId);
    expect(useEditorStore.getState().isDirty).toBe(true);

    // Locked blocks cannot be deleted or edited
    useEditorStore.getState().deleteBlock(heroId);
    expect(findBlockById(useEditorStore.getState().content.sections, heroId)).not.toBeNull();

    useEditorStore.getState().updateBlockProp(heroId, 'eyebrow', 'MODIFIED');
    expect(
      findBlockById(useEditorStore.getState().content.sections, heroId)?.props.eyebrow
    ).not.toBe('MODIFIED');

    useEditorStore.getState().toggleLock(heroId);
    useEditorStore.getState().markSaved('rev-2');
    expect(useEditorStore.getState().isDirty).toBe(false);
    expect(useEditorStore.getState().draftRevisionId).toBe('rev-2');
  });

  it('restores props, responsive overrides, and animations accurately via Undo/Redo', () => {
    const heroId = useEditorStore.getState().content.sections[0].id;
    const originalEyebrow = findBlockById(
      useEditorStore.getState().content.sections,
      heroId
    )?.props.eyebrow;

    useEditorStore.getState().updateBlockProp(heroId, 'eyebrow', 'UPDATED EYEBROW');
    useEditorStore
      .getState()
      .updateBlockStyles(heroId, 'mobile', { paddingTop: '24px', textAlign: 'center' });
    useEditorStore
      .getState()
      .updateBlockAnimations(heroId, { preset: 'slide-up', durationMs: 400 });

    expect(useHistoryStore.getState().canUndo()).toBe(true);

    // Undo animation
    useEditorStore.getState().undo();
    expect(
      findBlockById(useEditorStore.getState().content.sections, heroId)?.animations.preset
    ).toBe('none');

    // Undo mobile style override
    useEditorStore.getState().undo();
    expect(
      findBlockById(useEditorStore.getState().content.sections, heroId)?.responsive.mobile
    ).toBeUndefined();

    // Undo eyebrow change
    useEditorStore.getState().undo();
    expect(
      findBlockById(useEditorStore.getState().content.sections, heroId)?.props.eyebrow
    ).toBe(originalEyebrow);

    // Redo eyebrow change
    useEditorStore.getState().redo();
    expect(
      findBlockById(useEditorStore.getState().content.sections, heroId)?.props.eyebrow
    ).toBe('UPDATED EYEBROW');
  });
});
