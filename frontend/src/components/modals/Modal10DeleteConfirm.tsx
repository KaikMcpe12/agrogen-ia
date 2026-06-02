import { Button } from "@/components/ui/Button";
import { useScrollLock } from "@/hooks/useScrollLock";

interface Modal10DeleteConfirmProps {
  open: boolean;
  onClose: () => void;
  itemName: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function Modal10DeleteConfirm({ open, onClose, itemName, onConfirm, loading }: Modal10DeleteConfirmProps) {
  useScrollLock(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface w-full flex flex-col rounded-t-[24px] md:rounded-[16px] md:max-w-md md:border md:border-line md:shadow-[var(--shadow-lg)] md:mx-4">
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Confirmar exclusão
          </h3>
        </div>
        <div className="px-5 py-4">
          <p className="text-[14px] text-ink-2">
            Tem certeza que deseja excluir <strong>{itemName}</strong>?
          </p>
          <p className="text-[13px] text-ink-3 mt-2">
            O registro será desativado, mas o histórico de dados será preservado.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 bg-beige border-t border-line shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>
            Confirmar exclusão
          </Button>
        </div>
      </div>
    </div>
  );
}
