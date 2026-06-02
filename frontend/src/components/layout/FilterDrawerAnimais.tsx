import { useState } from "react";
import { Drawer } from "./Drawer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Filters {
  raca?: string | undefined;
  peso_min?: number | undefined;
  peso_max?: number | undefined;
  idade_min?: number | undefined;
  idade_max?: number | undefined;
  idade_unidade?: "meses" | "anos" | undefined;
  partos_min?: number | undefined;
  partos_max?: number | undefined;
  cc_min?: number | undefined;
  cc_max?: number | undefined;
  brinco?: string | undefined;
  data_nasc_inicio?: string | undefined;
  data_nasc_fim?: string | undefined;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
}

// Spec seção 5.4 — atalhos obrigatórios para date range
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

const DATE_ATALHOS = [
  { key: "hoje", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "mes", label: "Este mês" },
  { key: "trimestre", label: "Último trimestre" },
  { key: "ano", label: "Este ano" },
  { key: "tudo", label: "Tudo" },
];

export function FilterDrawerAnimais({ open, onClose, onApply }: Props) {
  const [raca, setRaca] = useState("");
  const [pesoMin, setPesoMin] = useState("");
  const [pesoMax, setPesoMax] = useState("");
  const [idadeMin, setIdadeMin] = useState("");
  const [idadeMax, setIdadeMax] = useState("");
  const [idadeUnidade, setIdadeUnidade] = useState<"meses" | "anos">("meses");
  const [partosMin, setPartosMin] = useState("");
  const [partosMax, setPartosMax] = useState("");
  const [ccMin, setCcMin] = useState("");
  const [ccMax, setCcMax] = useState("");
  const [brinco, setBrinco] = useState("");
  const [dataNascInicio, setDataNascInicio] = useState("");
  const [dataNascFim, setDataNascFim] = useState("");
  const [atalhoAtivo, setAtalhoAtivo] = useState("");

  const handleAtalho = (key: string) => {
    setAtalhoAtivo(key);
    if (key === "tudo") { setDataNascInicio(""); setDataNascFim(""); }
    else { const { inicio, fim } = getDateRange(key); setDataNascInicio(inicio); setDataNascFim(fim); }
  };

  const handleApply = () => {
    onApply({
      raca: raca || undefined,
      peso_min: pesoMin ? Number(pesoMin) : undefined,
      peso_max: pesoMax ? Number(pesoMax) : undefined,
      idade_min: idadeMin ? Number(idadeMin) : undefined,
      idade_max: idadeMax ? Number(idadeMax) : undefined,
      idade_unidade: (idadeMin || idadeMax) ? idadeUnidade : undefined,
      partos_min: partosMin ? Number(partosMin) : undefined,
      partos_max: partosMax ? Number(partosMax) : undefined,
      cc_min: ccMin ? Number(ccMin) : undefined,
      cc_max: ccMax ? Number(ccMax) : undefined,
      brinco: brinco || undefined,
      data_nasc_inicio: dataNascInicio || undefined,
      data_nasc_fim: dataNascFim || undefined,
    });
    onClose();
  };

  const handleClear = () => {
    setRaca(""); setPesoMin(""); setPesoMax(""); setIdadeMin(""); setIdadeMax("");
    setIdadeUnidade("meses"); setPartosMin(""); setPartosMax(""); setCcMin(""); setCcMax("");
    setBrinco(""); setDataNascInicio(""); setDataNascFim(""); setAtalhoAtivo("");
    onApply({});
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Filtros Avançados">
      <div className="flex flex-col gap-5">

        {/* Raça */}
        <Input label="Raça específica" placeholder="Ex: Nelore, Dorper" value={raca} onChange={(e) => setRaca(e.target.value)} />

        {/* Brinco — spec seção 5.7 DRAWER-02 */}
        <Input label="Brinco (busca exata)" placeholder="Ex: BOV-0012" value={brinco} onChange={(e) => setBrinco(e.target.value)} />

        {/* Faixa de peso — spec: dois inputs min/max kg */}
        <div>
          <p className="text-[13px] font-medium text-ink-2 mb-2">Faixa de peso (kg)</p>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Mínimo" type="number" value={pesoMin} onChange={(e) => setPesoMin(e.target.value)} />
            <Input placeholder="Máximo" type="number" value={pesoMax} onChange={(e) => setPesoMax(e.target.value)} />
          </div>
        </div>

        {/* Faixa de idade — spec: dois inputs + select meses/anos */}
        <div>
          <p className="text-[13px] font-medium text-ink-2 mb-2">Faixa de idade</p>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Mínimo" type="number" min={0} value={idadeMin} onChange={(e) => setIdadeMin(e.target.value)} />
            <Input placeholder="Máximo" type="number" min={0} value={idadeMax} onChange={(e) => setIdadeMax(e.target.value)} />
            <select
              className="px-3 py-[10px] rounded-[10px] border border-line text-[13px] text-ink bg-surface outline-none focus:border-green-700"
              value={idadeUnidade}
              onChange={(e) => setIdadeUnidade(e.target.value as "meses" | "anos")}
            >
              <option value="meses">Meses</option>
              <option value="anos">Anos</option>
            </select>
          </div>
        </div>

        {/* Faixa de partos — spec: dois inputs min/max integer */}
        <div>
          <p className="text-[13px] font-medium text-ink-2 mb-2">Número de partos</p>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Mínimo" type="number" min={0} value={partosMin} onChange={(e) => setPartosMin(e.target.value)} />
            <Input placeholder="Máximo" type="number" min={0} value={partosMax} onChange={(e) => setPartosMax(e.target.value)} />
          </div>
        </div>

        {/* Condição corporal */}
        <div>
          <p className="text-[13px] font-medium text-ink-2 mb-2">Condição corporal (1–5)</p>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Mín (ex: 2)" type="number" min={1} max={5} value={ccMin} onChange={(e) => setCcMin(e.target.value)} />
            <Input placeholder="Máx (ex: 5)" type="number" min={1} max={5} value={ccMax} onChange={(e) => setCcMax(e.target.value)} />
          </div>
        </div>

        {/* Data de nascimento com atalhos — spec seção 5.4 */}
        <div>
          <p className="text-[13px] font-medium text-ink-2 mb-2">Data de nascimento</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {DATE_ATALHOS.map((a) => (
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
              value={dataNascInicio}
              onChange={(e) => { setDataNascInicio(e.target.value); setAtalhoAtivo(""); }}
            />
            <Input
              label="Até"
              type="date"
              value={dataNascFim}
              onChange={(e) => { setDataNascFim(e.target.value); setAtalhoAtivo(""); }}
            />
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
