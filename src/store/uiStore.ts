import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  theme: "dark" | "light";
  sidebarCollapsed: boolean;
  assistantOpen: boolean;
  liveConnected: boolean;
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAssistantOpen: (open: boolean) => void;
  setLiveConnected: (connected: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      sidebarCollapsed: false,
      assistantOpen: true,
      liveConnected: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setAssistantOpen: (assistantOpen) => set({ assistantOpen }),
      setLiveConnected: (liveConnected) => set({ liveConnected })
    }),
    {
      name: "helios-ai-soc-ui",
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        assistantOpen: state.assistantOpen
      })
    }
  )
);
