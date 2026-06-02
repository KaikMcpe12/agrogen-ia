import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { listQueue, removeFromQueue, markFailed } from "./mutationQueue";
import { showInfoToast, showWarningToast } from "@/components/ui/toast";
import apiClient from "@/lib/api/client";

export function useQueueSync() {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isOnline || syncing) return;

    async function processQueue() {
      setSyncing(true);
      const items = await listQueue();
      const pending = items.filter((i) => i.status !== "syncing");

      if (pending.length === 0) {
        setSyncing(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const item of pending) {
        try {
          await apiClient.request({
            url: item.endpoint,
            method: item.method,
            data: item.payload,
          });
          await removeFromQueue(item.id);
          for (const key of item.invalidateKeys) {
            await queryClient.invalidateQueries({ queryKey: key as readonly unknown[] });
          }
          successCount++;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status !== undefined && status >= 400 && status < 500) {
            // Erro definitivo do servidor (4xx) — não tenta de novo
            await markFailed(item.id, errMsg);
            showWarningToast(`Uma ação falhou ao sincronizar: ${item.endpoint}`);
            failCount++;
          }
          // 5xx e network errors: tenta na próxima vez que ficar online
        }
      }

      if (successCount > 0) {
        showInfoToast(`Sincronização concluída. ${successCount} ação${successCount > 1 ? "ões" : ""} enviada${successCount > 1 ? "s" : ""}.`);
      }
      if (failCount > 0) {
        showWarningToast(`Não conseguimos sincronizar ${failCount} ação${failCount > 1 ? "ões" : ""}. [Ver detalhes]`);
      }

      setSyncing(false);
    }

    void processQueue();
  }, [isOnline, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  return { syncing };
}
