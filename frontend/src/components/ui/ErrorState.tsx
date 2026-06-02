import { AlertCircle, RefreshCw } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/error-messages";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({ error, onRetry, compact = false }: ErrorStateProps) {
  const message = getApiErrorMessage(error);

  if (compact) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 rounded-[10px] bg-danger-bg text-danger text-[13px]">
        <AlertCircle size={14} className="shrink-0" />
        <span className="flex-1">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-[12px] font-semibold hover:underline shrink-0"
          >
            <RefreshCw size={12} /> Tentar de novo
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-12 gap-4 text-center">
      <div className="w-12 h-12 rounded-full bg-danger-bg flex items-center justify-center">
        <AlertCircle size={22} className="text-danger" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-ink mb-1">Não foi possível carregar</p>
        <p className="text-[13px] text-ink-3 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-surface border border-line text-[13px] font-medium text-ink hover:bg-beige transition-colors"
        >
          <RefreshCw size={14} />
          Tentar de novo
        </button>
      )}
    </div>
  );
}
