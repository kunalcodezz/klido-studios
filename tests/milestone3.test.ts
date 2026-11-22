import { describe, expect, it } from 'vitest';
import { useUiStore } from '../src/stores/uiStore';

describe('Milestone 3 — UI Store & Sidebar State Persistence', () => {
  it('toggles sidebar collapsed state and updates save status cleanly', () => {
    const initial = useUiStore.getState();
    expect(initial.sidebarCollapsed).toBe(false);

    initial.toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);

    initial.setSidebarCollapsed(false);
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);

    initial.setSaveStatus('saving');
    expect(useUiStore.getState().saveStatus).toBe('saving');

    initial.setSaveStatus('saved');
    expect(useUiStore.getState().saveStatus).toBe('saved');
    expect(useUiStore.getState().lastSavedAt).toBeTruthy();
  });
});
