import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error:", error, info);

    const isChunkError =
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Importing a module script failed") ||
      error.message.includes("error loading dynamically imported module");

    if (isChunkError) {
      const reloadCount = Number(sessionStorage.getItem("chunk_reload") ?? 0);
      if (reloadCount < 2) {
        sessionStorage.setItem("chunk_reload", String(reloadCount + 1));
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-dvh gap-6 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-danger-bg flex items-center justify-center">
            <AlertTriangle size={28} className="text-danger" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-ink mb-2" style={{ fontFamily: "var(--font-display)" }}>
              Algo deu errado
            </h1>
            <p className="text-[14px] text-ink-3 max-w-sm">
              Ocorreu um erro inesperado. Recarregue a página para continuar.
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-green-700 text-white text-[14px] font-semibold hover:bg-green-800 transition-colors"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={15} />
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
