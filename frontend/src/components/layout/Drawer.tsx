import type { ReactNode } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "left" | "right" | "bottom";
}

export function Drawer({ open, onClose, title, children, side = "right" }: DrawerProps) {
  if (side === "bottom") {
    return (
      <>
        {open && (
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={[
            "fixed bottom-0 left-0 right-0 z-50 bg-surface",
            "rounded-t-[24px] border-t border-line shadow-[var(--shadow-lg)]",
            "flex flex-col max-h-[70vh] transition-transform duration-300 ease-out",
            open ? "translate-y-0" : "translate-y-full",
          ].join(" ")}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-line rounded-full" />
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-b border-line shrink-0">
            <h2
              className="text-[17px] font-semibold text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige transition-colors"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={[
          "fixed top-0 bottom-0 z-50 w-[min(360px,90vw)] bg-surface",
          "flex flex-col shadow-[var(--shadow-lg)] transition-transform duration-300",
          side === "right" ? "right-0" : "left-0",
          open
            ? "translate-x-0"
            : side === "right"
            ? "translate-x-full"
            : "-translate-x-full",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h2
            className="text-[17px] font-semibold text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </>
  );
}
