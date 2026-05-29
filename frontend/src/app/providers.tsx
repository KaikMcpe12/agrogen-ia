import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useEffect } from "react";

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
    const stored = localStorage.getItem("agrogen_theme");
    const theme = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  }, []);
  return null;
}

export function Providers() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInit />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
