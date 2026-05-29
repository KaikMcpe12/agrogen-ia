import { useState } from "react";
import { Drawer } from "./Drawer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Filters {
  raca?: string | undefined;
  peso_min?: number | undefined;
  peso_max?: number | undefined;
  cc_min?: number | undefined;
  cc_max?: number | undefined;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
}

export function FilterDrawerAnimais({ open, onClose, onApply }: Props) {
  const [raca, setRaca] = useState("");
  const [pesoMin, setPesoMin] = useState("");
  const [pesoMax, setPesoMax] = useState("");
  const [ccMin, setCcMin] = useState("");
  const [ccMax, setCcMax] = useState("");

  const handleApply = () => {
    onApply({
      raca: raca || undefined,
      peso_min: pesoMin ? Number(pesoMin) : undefined,
      peso_max: pesoMax ? Number(pesoMax) : undefined,
      cc_min: ccMin ? Number(ccMin) : undefined,
      cc_max: ccMax ? Number(ccMax) : undefined,
    });
    onClose();
  };

  const handleClear = () => {
    setRaca(""); setPesoMin(""); setPesoMax(""); setCcMin(""); setCcMax("");
    onApply({});
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Filtros Avançados">
      <div className="flex flex-col gap-5">
        <Input label="Raça específica" placeholder="Ex: Nelore, Dorper" value={raca} onChange={(e) => setRaca(e.target.value)} />

        <div>
          <p className="text-[13px] font-medium text-ink-2 mb-2">Faixa de peso (kg)</p>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Mínimo" type="number" value={pesoMin} onChange={(e) => setPesoMin(e.target.value)} />
            <Input placeholder="Máximo" type="number" value={pesoMax} onChange={(e) => setPesoMax(e.target.value)} />
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium text-ink-2 mb-2">Condição corporal (1–5)</p>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Mín (ex: 2)" type="number" min={1} max={5} value={ccMin} onChange={(e) => setCcMin(e.target.value)} />
            <Input placeholder="Máx (ex: 5)" type="number" min={1} max={5} value={ccMax} onChange={(e) => setCcMax(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={handleClear}>Limpar tudo</Button>
          <Button variant="primary" className="flex-1" onClick={handleApply}>Aplicar</Button>
        </div>
      </div>
    </Drawer>
  );
}
