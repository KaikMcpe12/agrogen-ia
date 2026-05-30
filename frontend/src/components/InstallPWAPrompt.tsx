import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { STORAGE_KEYS } from "@/lib/storage-keys";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWAPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Não exibir se já instalado (standalone)
  const isInstalled = window.matchMedia("(display-mode: standalone)").matches;

  useEffect(() => {
    if (isInstalled) return;

    const stored = localStorage.getItem(STORAGE_KEYS.pwaInstallShown);
    const parsed = stored ? (JSON.parse(stored) as { count: number; dismissed?: boolean }) : { count: 0 };
    if (parsed.dismissed) return;

    const newCount = parsed.count + 1;
    localStorage.setItem(STORAGE_KEYS.pwaInstallShown, JSON.stringify({ count: newCount }));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (newCount >= 3) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(true), 60_000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        dismiss();
      }
    }
  };

  const dismiss = (forever = true) => {
    if (forever) {
      const stored = localStorage.getItem(STORAGE_KEYS.pwaInstallShown);
      const parsed = stored ? (JSON.parse(stored) as { count: number }) : { count: 0 };
      localStorage.setItem(STORAGE_KEYS.pwaInstallShown, JSON.stringify({ ...parsed, dismissed: true }));
    }
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
          <p className="text-[14px] font-semibold text-ink">Instalar AgroGen IA no seu celular</p>
          <p className="text-[12px] text-ink-3 mt-0.5">Acesso rápido, funciona offline</p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <Button variant="primary" size="sm" onClick={() => void handleInstall()}>
            Instalar
          </Button>
          <button
            onClick={() => dismiss()}
            className="text-[11px] text-ink-4 hover:text-ink transition-colors text-center"
            aria-label="Agora não"
          >
            Agora não
          </button>
        </div>
        <button
          onClick={() => dismiss()}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-ink-4 hover:text-ink"
          aria-label="Fechar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
