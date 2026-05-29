import { useState } from "react";

const STORAGE_KEY = "agrogen_fazenda_id";

export function useFazendaAtiva() {
  const [fazendaId, setFazendaIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  const setFazendaId = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setFazendaIdState(id);
  };

  return { fazendaId, setFazendaId };
}
