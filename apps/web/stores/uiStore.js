import { create } from 'zustand';

export const useUiStore = create((set) => ({
  theme: 'light',
  sidebarOpen: false,

  setTheme(theme) {
    set({ theme });
  },

  setSidebarOpen(sidebarOpen) {
    set({ sidebarOpen });
  },

  toggleSidebar() {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },
}));
