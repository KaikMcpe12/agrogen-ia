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

export function FilterDrawerInseminacoes({ open, onClose, onApply }: Props) {
  const [resultado, setResultado] = useState("");
  const [tipo, setTipo] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tecnico, setTecnico] = useState("");

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
    setResultado(""); setTipo(""); setDataInicio(""); setDataFim(""); setTecnico("");
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

        <div>
          <p className="text-[13px] font-medium text-ink-2 mb-2">Período</p>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="De" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            <Input placeholder="Até" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </div>

        <Input label="Técnico responsável" placeholder="Nome do técnico" value={tecnico} onChange={(e) => setTecnico(e.target.value)} />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={handleClear}>Limpar tudo</Button>
          <Button variant="primary" className="flex-1" onClick={handleApply}>Aplicar</Button>
        </div>
      </div>
    </Drawer>
  );
}
