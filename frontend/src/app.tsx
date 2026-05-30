import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";
import { router } from "./routes";
import { STORAGE_KEYS } from "@/lib/storage-keys";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 1,
    },
  },
});

function ThemeInit() {
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.theme);
    const theme =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    document.documentElement.setAttribute("data-theme", theme);
  }, []);
  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ThemeInit />
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  );
}
