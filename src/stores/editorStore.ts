import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { createBlockNode, getBlockDefinition } from '../blocks/registry';
import type { BlockNode, PageContentTree } from '../schemas/blocks';
import type { AnimationConfig, BlockStyles, ViewportMode } from '../schemas/styles';
import type { PageRecord } from '../types/database';
import { cloneContentTree, useHistoryStore } from './historyStore';

export type ZoomLevel = 0.5 | 0.75 | 1;

function cloneWithFreshIds(node: BlockNode, renameSuffix = ''): BlockNode {
  const cloned = structuredClone(node) as BlockNode;
  const assignIds = (item: BlockNode, isRoot: boolean): BlockNode => ({
    ...item,
    id: crypto.randomUUID(),
    name: isRoot && renameSuffix ? `${item.name}${renameSuffix}` : item.name,
    children: item.children ? item.children.map((c) => assignIds(c, false)) : undefined,
  });
  return assignIds(cloned, true);
}

export function findBlockById(nodes: BlockNode[], targetId: string | null): BlockNode | null {
  if (!targetId) return null;
  for (const node of nodes) {
    if (node.id === targetId) return node;
    if (node.children?.length) {
      const found = findBlockById(node.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

export function findParentId(
  nodes: BlockNode[],
  targetId: string,
  parentId: string | null = null
): string | null | undefined {
  for (const node of nodes) {
    if (node.id === targetId) return parentId;
    if (node.children?.length) {
      const found = findParentId(node.children, targetId, node.id);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

function updateNodeRecursive(
  nodes: BlockNode[],
  targetId: string,
  updater: (node: BlockNode) => BlockNode
): BlockNode[] {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return updater(node);
    }
    if (node.children?.length) {
      return {
        ...node,
        children: updateNodeRecursive(node.children, targetId, updater),
      };
    }
    return node;
  });
}

function removeNodeRecursive(
  nodes: BlockNode[],
  targetId: string
): { remaining: BlockNode[]; removed: BlockNode | null } {
  let removed: BlockNode | null = null;
  const remaining: BlockNode[] = [];

  for (const node of nodes) {
    if (node.id === targetId) {
      removed = node;
      continue;
    }
    if (node.children?.length) {
      const res = removeNodeRecursive(node.children, targetId);
      if (res.removed) {
        removed = res.removed;
        remaining.push({ ...node, children: res.remaining });
        continue;
      }
    }
    remaining.push(node);
  }

  return { remaining, removed };
}

function insertIntoParent(
  nodes: BlockNode[],
  parentId: string | null,
  newNode: BlockNode,
  index?: number
): BlockNode[] {
  if (!parentId) {
    const copy = [...nodes];
    if (typeof index === 'number' && index >= 0 && index <= copy.length) {
      copy.splice(index, 0, newNode);
    } else {
      copy.push(newNode);
    }
    return copy;
  }

  return nodes.map((node) => {
    if (node.id === parentId) {
      const def = getBlockDefinition(node.type);
      if (!def?.supportsChildren) return node;
      const children = [...(node.children ?? [])];
      if (typeof index === 'number' && index >= 0 && index <= children.length) {
        children.splice(index, 0, newNode);
      } else {
        children.push(newNode);
      }
      return { ...node, children };
    }
    if (node.children?.length) {
      return {
        ...node,
        children: insertIntoParent(node.children, parentId, newNode, index),
      };
    }
    return node;
  });
}

interface EditorState {
  pageId: string | null;
  pageMeta: PageRecord | null;
  draftRevisionId: string | null;
  content: PageContentTree;
  savedSnapshotJson: string;
  selectedBlockId: string | null;
  viewport: ViewportMode;
  zoom: ZoomLevel;
  fullPreview: boolean;
  isDirty: boolean;
  conflictDetected: boolean;

  loadPage: (
    page: PageRecord,
    tree: PageContentTree,
    draftRevisionId: string | null
  ) => void;
  resetEditor: () => void;
  selectBlock: (blockId: string | null) => void;
  setViewport: (viewport: ViewportMode) => void;
  setZoom: (zoom: ZoomLevel) => void;
  toggleFullPreview: () => void;
  setFullPreview: (value: boolean) => void;

  addBlock: (type: string, parentId?: string | null, index?: number) => BlockNode;
  insertBlockNode: (block: BlockNode, parentId?: string | null, index?: number) => BlockNode;
  duplicateBlock: (blockId: string) => void;
  deleteBlock: (blockId: string) => void;
  reorderSections: (activeId: string, overId: string) => void;
  reorderChildBlocks: (parentId: string, activeId: string, overId: string) => void;
  moveBlockToContainer: (blockId: string, targetParentId: string | null) => void;
  toggleVisibility: (blockId: string) => void;
  toggleLock: (blockId: string) => void;
  renameBlock: (blockId: string, name: string) => void;
  updateBlockProp: (blockId: string, key: string, value: unknown) => void;
  updateBlockStyles: (
    blockId: string,
    viewport: ViewportMode,
    patch: Partial<BlockStyles>
  ) => void;
  clearViewportStyleOverrides: (blockId: string, viewport: 'tablet' | 'mobile') => void;
  updateBlockAnimations: (blockId: string, patch: Partial<AnimationConfig>) => void;

  undo: () => void;
  redo: () => void;
  markSaved: (newDraftRevisionId: string) => void;
  setConflictDetected: (conflict: boolean) => void;
  updatePageMeta: (page: PageRecord) => void;
}

const EMPTY_TREE: PageContentTree = { version: 1, sections: [] };

function applyTreeMutation(
  get: () => EditorState,
  set: (partial: Partial<EditorState>) => void,
  nextTree: PageContentTree,
  nextSelectedId?: string | null
) {
  useHistoryStore.getState().push(nextTree);
  const nextJson = JSON.stringify(nextTree);
  set({
    content: nextTree,
    isDirty: nextJson !== get().savedSnapshotJson,
    ...(nextSelectedId !== undefined ? { selectedBlockId: nextSelectedId } : {}),
  });
}

export const useEditorStore = create<EditorState>((set, get) => ({
  pageId: null,
  pageMeta: null,
  draftRevisionId: null,
  content: EMPTY_TREE,
  savedSnapshotJson: JSON.stringify(EMPTY_TREE),
  selectedBlockId: null,
  viewport: 'desktop',
  zoom: 1,
  fullPreview: false,
  isDirty: false,
  conflictDetected: false,

  loadPage: (page, tree, draftRevisionId) => {
    const cleanTree = cloneContentTree(tree);
    useHistoryStore.getState().init(cleanTree);
    set({
      pageId: page.id,
      pageMeta: page,
      draftRevisionId,
      content: cleanTree,
      savedSnapshotJson: JSON.stringify(cleanTree),
      selectedBlockId: cleanTree.sections[0]?.id ?? null,
      isDirty: false,
      conflictDetected: false,
      fullPreview: false,
    });
  },

  resetEditor: () => {
    useHistoryStore.getState().clear();
    set({
      pageId: null,
      pageMeta: null,
      draftRevisionId: null,
      content: EMPTY_TREE,
      savedSnapshotJson: JSON.stringify(EMPTY_TREE),
      selectedBlockId: null,
      isDirty: false,
      conflictDetected: false,
      fullPreview: false,
    });
  },

  selectBlock: (blockId) => set({ selectedBlockId: blockId }),
  setViewport: (viewport) => set({ viewport }),
  setZoom: (zoom) => set({ zoom }),
  toggleFullPreview: () => set((s) => ({ fullPreview: !s.fullPreview })),
  setFullPreview: (value) => set({ fullPreview: value }),

  addBlock: (type, parentId = null, index) => {
    const node = createBlockNode(type);
    const { content } = get();
    const nextSections = insertIntoParent(content.sections, parentId, node, index);
    applyTreeMutation(get, set, { ...content, sections: nextSections }, node.id);
    return node;
  },

  insertBlockNode: (block, parentId = null, index) => {
    const freshNode = cloneWithFreshIds(block);
    const { content } = get();
    const nextSections = insertIntoParent(content.sections, parentId, freshNode, index);
    applyTreeMutation(get, set, { ...content, sections: nextSections }, freshNode.id);
    return freshNode;
  },

  duplicateBlock: (blockId) => {
    const { content } = get();
    const target = findBlockById(content.sections, blockId);
    if (!target) return;

    const parentId = findParentId(content.sections, blockId) ?? null;
    const siblings = parentId
      ? findBlockById(content.sections, parentId)?.children ?? []
      : content.sections;
    const idx = siblings.findIndex((s) => s.id === blockId);
    const duplicate = cloneWithFreshIds(target, ' Copy');

    const nextSections = insertIntoParent(
      content.sections,
      parentId,
      duplicate,
      idx >= 0 ? idx + 1 : undefined
    );
    applyTreeMutation(get, set, { ...content, sections: nextSections }, duplicate.id);
  },

  deleteBlock: (blockId) => {
    const { content, selectedBlockId } = get();
    const target = findBlockById(content.sections, blockId);
    if (!target || target.locked) return;

    const { remaining } = removeNodeRecursive(content.sections, blockId);
    const nextSelected =
      selectedBlockId === blockId ? (remaining[0]?.id ?? null) : selectedBlockId;
    applyTreeMutation(get, set, { ...content, sections: remaining }, nextSelected);
  },

  reorderSections: (activeId, overId) => {
    if (activeId === overId) return;
    const { content } = get();
    const oldIndex = content.sections.findIndex((s) => s.id === activeId);
    const newIndex = content.sections.findIndex((s) => s.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(content.sections, oldIndex, newIndex);
    applyTreeMutation(get, set, { ...content, sections: reordered });
  },

  reorderChildBlocks: (parentId, activeId, overId) => {
    if (activeId === overId) return;
    const { content } = get();
    const nextSections = updateNodeRecursive(content.sections, parentId, (parent) => {
      const children = parent.children ?? [];
      const oldIndex = children.findIndex((c) => c.id === activeId);
      const newIndex = children.findIndex((c) => c.id === overId);
      if (oldIndex < 0 || newIndex < 0) return parent;
      return {
        ...parent,
        children: arrayMove(children, oldIndex, newIndex),
      };
    });
    applyTreeMutation(get, set, { ...content, sections: nextSections });
  },

  moveBlockToContainer: (blockId, targetParentId) => {
    if (blockId === targetParentId) return;
    const { content } = get();
    const moving = findBlockById(content.sections, blockId);
    if (!moving || moving.locked) return;

    // Prevent dropping a container inside itself or its descendant
    if (targetParentId && findBlockById([moving], targetParentId)) {
      return;
    }

    const { remaining, removed } = removeNodeRecursive(content.sections, blockId);
    if (!removed) return;

    const nextSections = insertIntoParent(remaining, targetParentId, removed);
    applyTreeMutation(get, set, { ...content, sections: nextSections }, removed.id);
  },

  toggleVisibility: (blockId) => {
    const { content } = get();
    const nextSections = updateNodeRecursive(content.sections, blockId, (node) => ({
      ...node,
      visible: !node.visible,
    }));
    applyTreeMutation(get, set, { ...content, sections: nextSections });
  },

  toggleLock: (blockId) => {
    const { content } = get();
    const nextSections = updateNodeRecursive(content.sections, blockId, (node) => ({
      ...node,
      locked: !node.locked,
    }));
    applyTreeMutation(get, set, { ...content, sections: nextSections });
  },

  renameBlock: (blockId, name) => {
    const { content } = get();
    const target = findBlockById(content.sections, blockId);
    if (!target || target.locked) return;
    const nextSections = updateNodeRecursive(content.sections, blockId, (node) => ({
      ...node,
      name: name.slice(0, 120) || node.name,
    }));
    applyTreeMutation(get, set, { ...content, sections: nextSections });
  },

  updateBlockProp: (blockId, key, value) => {
    const { content } = get();
    const target = findBlockById(content.sections, blockId);
    if (!target || target.locked) return;

    const nextSections = updateNodeRecursive(content.sections, blockId, (node) => ({
      ...node,
      props: {
        ...node.props,
        [key]: value,
      },
    }));
    applyTreeMutation(get, set, { ...content, sections: nextSections });
  },

  updateBlockStyles: (blockId, viewport, patch) => {
    const { content } = get();
    const target = findBlockById(content.sections, blockId);
    if (!target || target.locked) return;

    const cleanPatch = (existing: BlockStyles | undefined): BlockStyles => {
      const merged: Record<string, unknown> = { ...(existing ?? {}) };
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '') {
          delete merged[k];
        } else {
          merged[k] = v;
        }
      }
      return merged as BlockStyles;
    };

    const nextSections = updateNodeRecursive(content.sections, blockId, (node) => {
      if (viewport === 'desktop') {
        return {
          ...node,
          styles: cleanPatch(node.styles),
        };
      }
      return {
        ...node,
        responsive: {
          ...node.responsive,
          [viewport]: cleanPatch(node.responsive?.[viewport]),
        },
      };
    });

    applyTreeMutation(get, set, { ...content, sections: nextSections });
  },

  clearViewportStyleOverrides: (blockId, viewport) => {
    const { content } = get();
    const target = findBlockById(content.sections, blockId);
    if (!target || target.locked) return;

    const nextSections = updateNodeRecursive(content.sections, blockId, (node) => {
      const nextResponsive = { ...(node.responsive ?? {}) };
      delete nextResponsive[viewport];
      return {
        ...node,
        responsive: nextResponsive,
      };
    });

    applyTreeMutation(get, set, { ...content, sections: nextSections });
  },

  updateBlockAnimations: (blockId, patch) => {
    const { content } = get();
    const target = findBlockById(content.sections, blockId);
    if (!target || target.locked) return;

    const nextSections = updateNodeRecursive(content.sections, blockId, (node) => ({
      ...node,
      animations: {
        ...node.animations,
        ...patch,
      },
    }));

    applyTreeMutation(get, set, { ...content, sections: nextSections });
  },

  undo: () => {
    const restored = useHistoryStore.getState().undo();
    if (!restored) return;
    const { selectedBlockId, savedSnapshotJson } = get();
    const stillExists = selectedBlockId && findBlockById(restored.sections, selectedBlockId);
    set({
      content: restored,
      isDirty: JSON.stringify(restored) !== savedSnapshotJson,
      selectedBlockId: stillExists ? selectedBlockId : (restored.sections[0]?.id ?? null),
    });
  },

  redo: () => {
    const restored = useHistoryStore.getState().redo();
    if (!restored) return;
    const { selectedBlockId, savedSnapshotJson } = get();
    const stillExists = selectedBlockId && findBlockById(restored.sections, selectedBlockId);
    set({
      content: restored,
      isDirty: JSON.stringify(restored) !== savedSnapshotJson,
      selectedBlockId: stillExists ? selectedBlockId : (restored.sections[0]?.id ?? null),
    });
  },

  markSaved: (newDraftRevisionId) => {
    const { content } = get();
    set({
      draftRevisionId: newDraftRevisionId,
      savedSnapshotJson: JSON.stringify(content),
      isDirty: false,
      conflictDetected: false,
    });
  },

  setConflictDetected: (conflict) => set({ conflictDetected: conflict }),
  updatePageMeta: (pageMeta) => set({ pageMeta }),
}));
