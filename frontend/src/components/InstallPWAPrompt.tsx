import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "agrogen_visit_count";
const DISMISS_KEY = "agrogen_pwa_dismissed";

export function InstallPWAPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    const visits = Number(localStorage.getItem(STORAGE_KEY) ?? "0") + 1;
    localStorage.setItem(STORAGE_KEY, String(visits));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show after 3 visits or 60s
    if (visits >= 3) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(true), 60000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      (deferredPrompt as BeforeInstallPromptEvent).prompt();
      const { outcome } = await (deferredPrompt as BeforeInstallPromptEvent).userChoice;
      if (outcome === "accepted") {
        localStorage.setItem(DISMISS_KEY, "1");
        setShow(false);
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-surface border border-line rounded-[16px] shadow-[var(--shadow-lg)] p-4 flex gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-green-100 flex items-center justify-center shrink-0">
          <Download size={18} className="text-green-900" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-ink">Instalar AgroGen IA</p>
          <p className="text-[12px] text-ink-3 mt-0.5">Acesso rápido, funciona offline</p>
        </div>
        <div className="flex flex-col gap-1">
          <Button variant="primary" size="sm" onClick={() => void handleInstall()}>
            Instalar
          </Button>
          <button
            onClick={handleDismiss}
            className="text-ink-4 hover:text-ink transition-colors flex items-center justify-center"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
