import { createContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { registerToastFn } from "./toast";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
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

const TOAST_CONFIG = {
  success: { duration: 4000, ariaLive: "polite" as const, icon: CheckCircle, cls: "bg-ok-bg text-ok border-green-200" },
  error:   { duration: 6000, ariaLive: "assertive" as const, icon: AlertCircle, cls: "bg-danger-bg text-danger border-red-200" },
  info:    { duration: 4000, ariaLive: "polite" as const,    icon: Info,        cls: "bg-blue-50 text-blue-700 border-blue-200" },
  warning: { duration: 5000, ariaLive: "assertive" as const, icon: AlertTriangle, cls: "bg-amber-bg text-amber border-amber-200" },
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: "success" | "error" | "info" | "warning") => {
    const id = ++nextId;
    const { duration, ariaLive } = TOAST_CONFIG[type];
    setToasts((prev) => [...prev.slice(-2), { id, message, type, ariaLive }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  useEffect(() => {
    registerToastFn((msg, type) => add(msg, type));
  }, [add]);

  return (
    <ToastContext.Provider value={{ toast: { success: (m) => add(m, "success"), error: (m) => add(m, "error") } }}>
      {children}
      {/* Spec seção 10.5: mobile rodapé acima bottom-nav; desktop canto superior direito */}
      <div
        className="fixed bottom-24 md:top-4 md:bottom-auto right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none"
        role="region"
        aria-label="Notificações"
      >
        {toasts.map((t) => {
          const { icon: Icon, cls } = TOAST_CONFIG[t.type];
          return (
            <div
              key={t.id}
              role={t.type === "error" || t.type === "warning" ? "alert" : "status"}
              aria-live={t.ariaLive}
              className={[
                "flex items-center gap-3 px-4 py-3 rounded-[12px] shadow-[var(--shadow-md)] border text-[14px] font-medium pointer-events-auto",
                "animate-in slide-in-from-right-4 duration-200",
                cls,
              ].join(" ")}
            >
              <Icon size={16} aria-hidden />
              <span>{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Fechar notificação"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
