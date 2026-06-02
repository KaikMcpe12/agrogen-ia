import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage-keys";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.theme) as Theme | null;
    if (stored) return stored;
    return "light";
    // Para preferência do sistema no futuro:
    // return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return { theme, toggle, isDark: theme === "dark" };
}
