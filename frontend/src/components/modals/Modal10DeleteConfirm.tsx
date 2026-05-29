import { Button } from "@/components/ui/Button";

interface Modal10DeleteConfirmProps {
  open: boolean;
  onClose: () => void;
  itemName: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function Modal10DeleteConfirm({ open, onClose, itemName, onConfirm, loading }: Modal10DeleteConfirmProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface rounded-[16px] border border-line overflow-hidden shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
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
        <div className="flex justify-end gap-2 px-5 py-3 bg-beige border-t border-line">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>
            Confirmar exclusão
          </Button>
        </div>
      </div>
    </div>
  );
}
