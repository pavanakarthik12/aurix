import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  assistantOpen: boolean;
  toggleSidebar: () => void;
  setAssistantOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  assistantOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setAssistantOpen: (open) => set({ assistantOpen: open }),
}));
