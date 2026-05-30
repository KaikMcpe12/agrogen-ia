import { useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage-keys";

export function useFazendaAtiva() {
  const [fazendaId, setFazendaIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.fazendaAtivaId)
  );

  const setFazendaId = (id: string) => {
    localStorage.setItem(STORAGE_KEYS.fazendaAtivaId, id);
    setFazendaIdState(id);
  };

  const clearFazendaId = () => {
    localStorage.removeItem(STORAGE_KEYS.fazendaAtivaId);
    setFazendaIdState(null);
  };

  return { fazendaId, setFazendaId, clearFazendaId };
}
