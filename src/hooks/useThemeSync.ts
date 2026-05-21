import { useEffect } from "react";
import { useUiStore } from "@/store/uiStore";

export function useThemeSync() {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
}
