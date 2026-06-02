import { useEffect, useState } from "react";
import { WifiOff, Loader2, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useQueueSync } from "@/lib/offline/useQueueSync";
import { listQueue } from "@/lib/offline/mutationQueue";

type BannerState = "online" | "offline" | "syncing" | "done";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { syncing } = useQueueSync();
  const [pendingCount, setPendingCount] = useState(0);
  const [bannerState, setBannerState] = useState<BannerState>("online");

  // Atualiza contagem de itens na fila
  useEffect(() => {
    void listQueue().then((q) => setPendingCount(q.length));
    const interval = setInterval(() => {
      void listQueue().then((q) => setPendingCount(q.length));
    }, 3000);
    return () => clearInterval(interval);
  }, [isOnline]);

  // Máquina de estados do banner — setState síncrono em efeito é intencional (state machine externa)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!isOnline) {
      setBannerState("offline");
    } else if (syncing) {
      setBannerState("syncing");
    } else if (bannerState === "syncing") {
      // Acabou de sincronizar
      setBannerState("done");
      const t = setTimeout(() => setBannerState("online"), 4000);
      return () => clearTimeout(t);
    } else {
      setBannerState("online");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOnline, syncing]); // eslint-disable-line react-hooks/exhaustive-deps

  if (bannerState === "online") return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        "flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white shrink-0",
        bannerState === "offline" ? "bg-amber-500" : "",
        bannerState === "syncing" ? "bg-blue-600" : "",
        bannerState === "done" ? "bg-ok" : "",
      ].join(" ")}
    >
      {bannerState === "offline" && (
        <>
          <WifiOff size={14} />
          Você está offline. Mudanças serão sincronizadas quando a conexão voltar.
          {pendingCount > 0 && (
            <span className="ml-1 bg-white/20 rounded-full px-2 py-0.5 text-[11px]">
              {pendingCount} ação{pendingCount > 1 ? "ões" : ""} na fila
            </span>
          )}
        </>
      )}
      {bannerState === "syncing" && (
        <>
          <Loader2 size={14} className="animate-spin" />
          Conexão restaurada. Sincronizando {pendingCount} ação{pendingCount > 1 ? "ões" : ""}…
        </>
      )}
      {bannerState === "done" && (
        <>
          <Wifi size={14} />
          Sincronização concluída.
        </>
      )}
    </div>
  );
}
