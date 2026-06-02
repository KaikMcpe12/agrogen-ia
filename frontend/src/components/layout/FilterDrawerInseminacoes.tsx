import { useState } from "react";
import { Drawer } from "./Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { ResultadoInseminacao, TipoInseminacao } from "@/types";

interface Filters {
  resultado?: ResultadoInseminacao | undefined;
  tipo?: TipoInseminacao | undefined;
  data_inicio?: string | undefined;
  data_fim?: string | undefined;
  tecnico?: string | undefined;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
}

const resultadoOptions = [
  { value: "", label: "Todos" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "PRENHA", label: "Prenha" },
  { value: "VAZIA", label: "Vazia" },
  { value: "CANCELADA", label: "Cancelada" },
];

const tipoOptions = [
  { value: "", label: "Todos" },
  { value: "IA_CONVENCIONAL", label: "IA Convencional" },
  { value: "IATF", label: "IATF" },
  { value: "TE", label: "TE" },
];

// Spec seção 5.4 — atalhos obrigatórios
function getDateRange(atalho: string): { inicio: string; fim: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0]!;
  const todayStr = fmt(today);

  if (atalho === "hoje") return { inicio: todayStr, fim: todayStr };
  if (atalho === "7d") {
    const d = new Date(today); d.setDate(d.getDate() - 7);
    return { inicio: fmt(d), fim: todayStr };
  }
  if (atalho === "mes") {
    return { inicio: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), fim: todayStr };
  }
  if (atalho === "trimestre") {
    const d = new Date(today); d.setMonth(d.getMonth() - 3);
    return { inicio: fmt(d), fim: todayStr };
  }
  if (atalho === "ano") {
    return { inicio: `${today.getFullYear()}-01-01`, fim: todayStr };
  }
  return { inicio: "", fim: "" };
}

const ATALHOS = [
  { key: "hoje", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "mes", label: "Este mês" },
  { key: "trimestre", label: "Último trimestre" },
  { key: "ano", label: "Este ano" },
  { key: "tudo", label: "Tudo" },
];

export function FilterDrawerInseminacoes({ open, onClose, onApply }: Props) {
  const [resultado, setResultado] = useState("");
  const [tipo, setTipo] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [atalhoAtivo, setAtalhoAtivo] = useState("");

  const handleAtalho = (key: string) => {
    setAtalhoAtivo(key);
    if (key === "tudo") {
      setDataInicio(""); setDataFim("");
    } else {
      const { inicio, fim } = getDateRange(key);
      setDataInicio(inicio); setDataFim(fim);
    }
  };

  const handleApply = () => {
    onApply({
      resultado: (resultado as ResultadoInseminacao) || undefined,
      tipo: (tipo as TipoInseminacao) || undefined,
      data_inicio: dataInicio || undefined,
      data_fim: dataFim || undefined,
      tecnico: tecnico || undefined,
    });
    onClose();
  };

  const handleClear = () => {
    setResultado(""); setTipo(""); setDataInicio(""); setDataFim("");
    setTecnico(""); setAtalhoAtivo("");
    onApply({});
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Filtros de Inseminação">
      <div className="flex flex-col gap-5">
        <Select
          label="Resultado"
          options={resultadoOptions}
          value={resultado}
          onChange={(e) => setResultado(e.target.value)}
        />
        <Select
          label="Tipo de IA"
          options={tipoOptions}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        />

        {/* Período com atalhos — spec seção 5.4 */}
        <div>
          <p className="text-[13px] font-medium text-ink-2 mb-2">Período</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {ATALHOS.map((a) => (
              <button
                key={a.key}
                onClick={() => handleAtalho(a.key)}
                className={[
                  "px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors",
                  atalhoAtivo === a.key
                    ? "bg-green-900 text-white border-green-900"
                    : "bg-surface text-ink-3 border-line hover:bg-beige",
                ].join(" ")}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="De"
              type="date"
              value={dataInicio}
              onChange={(e) => { setDataInicio(e.target.value); setAtalhoAtivo(""); }}
            />
            <Input
              label="Até"
              type="date"
              value={dataFim}
              onChange={(e) => { setDataFim(e.target.value); setAtalhoAtivo(""); }}
            />
          </div>
        </div>

        <Input
          label="Técnico responsável"
          placeholder="Nome do técnico"
          value={tecnico}
          onChange={(e) => setTecnico(e.target.value)}
        />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={handleClear}>Limpar tudo</Button>
          <Button variant="primary" className="flex-1" onClick={handleApply}>Aplicar</Button>
        </div>
      </div>
    </Drawer>
  );
}
