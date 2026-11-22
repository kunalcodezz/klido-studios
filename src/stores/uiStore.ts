import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'unsaved' | 'error';

interface UiState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setSaveStatus: (status: SaveStatus) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      saveStatus: 'idle',
      lastSavedAt: null,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setSaveStatus: (status) =>
        set({
          saveStatus: status,
          lastSavedAt: status === 'saved' ? new Date().toISOString() : undefined,
        }),
    }),
    {
      name: 'klido-studio-ui',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
