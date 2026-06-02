import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

// Captura o evento antes do React renderizar para evitar race condition
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  (window as unknown as Record<string, unknown>).__pwaInstallPrompt = e;
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
