import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { STORAGE_KEYS } from "@/lib/storage-keys";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());

export function InstallPWAPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const isInstalled = window.matchMedia("(display-mode: standalone)").matches;

  useEffect(() => {
    if (isInstalled) return;

    const stored = localStorage.getItem(STORAGE_KEYS.pwaInstallShown);
    const parsed = stored ? (JSON.parse(stored) as { count: number; dismissed?: boolean }) : { count: 0 };
    if (parsed.dismissed) return;

    const newCount = parsed.count + 1;
    localStorage.setItem(STORAGE_KEYS.pwaInstallShown, JSON.stringify({ count: newCount }));

    // Lê evento capturado globalmente em main.tsx (evita race condition)
    const existing = (window as unknown as Record<string, unknown>).__pwaInstallPrompt;
    if (existing) {
      setDeferredPrompt(existing as BeforeInstallPromptEvent);
    } else if (!isIOS) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }

    const delay = newCount >= 3 ? 0 : 60_000;
    const timer = setTimeout(() => setShow(true), delay);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") dismiss();
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
      <div className="bg-surface border border-line rounded-[16px] shadow-[var(--shadow-lg)] p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-green-100 flex items-center justify-center shrink-0">
            <Download size={18} className="text-green-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-ink">Instalar AgroGen IA</p>
            <p className="text-[12px] text-ink-3 mt-0.5">
              {isIOS && !deferredPrompt
                ? "Acesso rápido direto na tela inicial"
                : "Acesso rápido, funciona offline"}
            </p>
          </div>
          <button
            onClick={() => dismiss()}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] text-ink-4 hover:text-ink hover:bg-beige transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>

        {isIOS && !deferredPrompt && (
          <div className="mt-3 flex items-start gap-2 rounded-[10px] bg-beige px-3 py-2">
            <Share size={14} className="text-ink-3 shrink-0 mt-0.5" />
            <p className="text-[12px] text-ink-3 leading-relaxed">
              Toque em <span className="font-semibold text-ink">Compartilhar</span> e depois em{" "}
              <span className="font-semibold text-ink">Adicionar à Tela Inicial</span>
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          {deferredPrompt && (
            <Button variant="primary" size="sm" onClick={() => void handleInstall()} className="flex-1">
              Instalar
            </Button>
          )}
          {isIOS && !deferredPrompt && (
            <Button variant="primary" size="sm" onClick={() => dismiss()} className="flex-1">
              Entendi
            </Button>
          )}
          <button
            onClick={() => dismiss()}
            className="flex-1 py-2 text-[13px] text-ink-4 hover:text-ink transition-colors text-center rounded-[8px] hover:bg-beige"
            aria-label="Agora não"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
