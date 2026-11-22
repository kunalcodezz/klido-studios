import { create } from 'zustand';
import type { PageContentTree } from '../schemas/blocks';

const MAX_HISTORY_ENTRIES = 50;

export function cloneContentTree(tree: PageContentTree): PageContentTree {
  if (typeof structuredClone === 'function') {
    return structuredClone(tree);
  }
  return JSON.parse(JSON.stringify(tree)) as PageContentTree;
}

interface HistoryState {
  past: PageContentTree[];
  present: PageContentTree | null;
  future: PageContentTree[];
  init: (initialTree: PageContentTree) => void;
  push: (nextTree: PageContentTree) => void;
  undo: () => PageContentTree | null;
  redo: () => PageContentTree | null;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  present: null,
  future: [],

  init: (initialTree) => {
    set({
      past: [],
      present: cloneContentTree(initialTree),
      future: [],
    });
  },

  push: (nextTree) => {
    const { present, past } = get();
    const clonedNext = cloneContentTree(nextTree);
    if (!present) {
      set({ past: [], present: clonedNext, future: [] });
      return;
    }

    // Skip duplicate snapshots
    if (JSON.stringify(present) === JSON.stringify(clonedNext)) {
      return;
    }

    const updatedPast = [...past, cloneContentTree(present)];
    if (updatedPast.length > MAX_HISTORY_ENTRIES) {
      updatedPast.shift();
    }

    set({
      past: updatedPast,
      present: clonedNext,
      future: [],
    });
  },

  undo: () => {
    const { past, present, future } = get();
    if (past.length === 0 || !present) return null;

    const previous = past[past.length - 1];
    const nextPast = past.slice(0, -1);

    set({
      past: nextPast,
      present: cloneContentTree(previous),
      future: [cloneContentTree(present), ...future].slice(0, MAX_HISTORY_ENTRIES),
    });

    return cloneContentTree(previous);
  },

  redo: () => {
    const { past, present, future } = get();
    if (future.length === 0 || !present) return null;

    const next = future[0];
    const nextFuture = future.slice(1);

    set({
      past: [...past, cloneContentTree(present)].slice(-MAX_HISTORY_ENTRIES),
      present: cloneContentTree(next),
      future: nextFuture,
    });

    return cloneContentTree(next);
  },

  clear: () => set({ past: [], present: null, future: [] }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
