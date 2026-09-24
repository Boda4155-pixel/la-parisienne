import { create } from "zustand";

type AdminState = {
  sidebarCollapsed: boolean;
  activeDateRange: "today" | "week" | "month" | "custom";
  refreshTrigger: number;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDateRange: (range: AdminState["activeDateRange"]) => void;
  refresh: () => void;
};

export const useAdminStore = create<AdminState>((set, get) => ({
  sidebarCollapsed: false,
  activeDateRange: "month",
  refreshTrigger: 0,

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },

  setDateRange: (range) => {
    set({ activeDateRange: range });
  },

  refresh: () => {
    set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
  },
}));