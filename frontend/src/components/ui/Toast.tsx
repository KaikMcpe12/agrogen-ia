import { createContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { registerToastFn } from "./toast";
import { X, CheckCircle, AlertCircle } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
  ariaLive: "polite" | "assertive";
}

interface ToastContextValue {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: "success" | "error") => {
    const id = ++nextId;
    const ariaLive: "polite" | "assertive" = type === "success" ? "polite" : "assertive";
    const duration = type === "error" ? 6000 : 4000;
    setToasts((prev) => [...prev.slice(-2), { id, message, type, ariaLive }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const toast = {
    success: (msg: string) => add(msg, "success"),
    error: (msg: string) => add(msg, "error"),
  };

  useEffect(() => {
    registerToastFn((msg, type) => add(msg, type));
  }, [add]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Spec seção 10.6: role=region + aria-label, cada toast com role=status/alert */}
      <div
        className="fixed bottom-24 md:bottom-6 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none"
        role="region"
        aria-label="Notificações"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            aria-live={t.ariaLive}
            className={[
              "flex items-center gap-3 px-4 py-3 rounded-[12px] shadow-[var(--shadow-md)] border text-[14px] font-medium pointer-events-auto",
              "animate-in slide-in-from-right-4 duration-200",
              t.type === "success"
                ? "bg-ok-bg text-ok border-green-200"
                : "bg-danger-bg text-danger border-red-200",
            ].join(" ")}
          >
            {t.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Fechar notificação"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

