import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useScrollLock } from "@/hooks/useScrollLock";

interface Props {
  open: boolean;
  onClose: () => void;
  email: string;
  onConfirm: () => Promise<void>;
}

export function Modal14ExcluirConta({ open, onClose, email, onConfirm }: Props) {
  useScrollLock(open);

  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (typed !== email) return;
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface w-full flex flex-col rounded-t-[24px] md:rounded-[16px] md:max-w-md md:border md:border-line md:shadow-[var(--shadow-lg)] md:mx-4 max-h-[85dvh] md:max-h-[90dvh]">
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="text-[17px] font-semibold text-danger" style={{ fontFamily: "var(--font-display)" }}>
            Excluir Conta
          </h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div className="flex gap-3 p-4 rounded-[12px] bg-danger-bg border border-danger/20">
            <AlertTriangle size={20} className="text-danger shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-danger">Ação irreversível</p>
              <p className="text-[13px] text-danger/80 mt-1">
                Todos os seus dados — fazendas, animais, histórico reprodutivo e sanitário — serão permanentemente excluídos. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>

          <div>
            <p className="text-[13px] text-ink-2 mb-2">
              Para confirmar, digite seu e-mail: <strong className="font-mono text-ink">{email}</strong>
            </p>
            <Input
              placeholder={email}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between px-5 py-3 bg-beige border-t border-line shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          <Button
            variant="danger"
            size="sm"
            disabled={typed !== email}
            loading={loading}
            onClick={handleConfirm}
          >
            Excluir minha conta
          </Button>
        </div>
      </div>
    </div>
  );
}
