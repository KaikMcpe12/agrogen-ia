import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { Providers } from "./app/providers";
import { router } from "./routes";
import { STORAGE_KEYS } from "@/lib/storage-keys";

function ThemeInit() {
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.theme);
    const theme = stored ?? "light";
    // Para preferência do sistema no futuro (lógica corrigida):
    // const theme = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  }, []);
  return null;
}

export function App() {
  return (
    <Providers>
      <ThemeInit />
      <RouterProvider router={router} />
    </Providers>
  );
}
