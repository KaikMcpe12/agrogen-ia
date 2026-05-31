import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Syringe, Scale, Baby, Trash2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { diarioApi } from "@/lib/api/endpoints/diario";
import { alertasApi } from "@/lib/api/endpoints/alertas";
import { useChartTheme } from "@/hooks/useChartTheme";
import { ModalNewInseminacaoSelector } from "@/components/modals/ModalInseminacaoSelector";
import { Modal10DeleteConfirm } from "@/components/modals/Modal10DeleteConfirm";
import type { Animal, StatusAnimal, Especie } from "@/types";

const ESPECIE_LABELS: Record<Especie, string> = { BOVINO: "🐄 Bovino", OVINO: "🐑 Ovino", CAPRINO: "🐐 Caprino" };
const STATUS_VARIANT: Record<StatusAnimal, "ok" | "info" | "ghost" | "danger" | "bovino" | "warn"> = {
  ATIVA: "ok", PRENHA: "info", EM_REPOUSO: "warn", DESCARTADA: "danger",
  REPRODUTOR_ATIVO: "bovino", EM_MONITORAMENTO: "warn",
};
const STATUS_LABELS: Record<StatusAnimal, string> = {
  ATIVA: "Ativa", PRENHA: "Prenha", EM_REPOUSO: "Em repouso", DESCARTADA: "Descartada",
  REPRODUTOR_ATIVO: "Reprodutor", EM_MONITORAMENTO: "Monitoramento",
};

function AnimalHeader({ animal, onInseminar, onDelete }: { animal: Animal; onInseminar: () => void; onDelete: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => void navigate("/animais")}
        className="flex items-center gap-2 text-[14px] text-ink-3 hover:text-ink transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Voltar para Animais
      </button>
      <Card className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="w-16 h-16 rounded-[14px] bg-green-100 flex items-center justify-center text-3xl shrink-0">
          {animal.especie === "BOVINO" ? "🐄" : animal.especie === "OVINO" ? "🐑" : "🐐"}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-[22px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
              {animal.nome}
            </h1>
            <Badge variant={STATUS_VARIANT[animal.status]}>{STATUS_LABELS[animal.status]}</Badge>
            <Badge variant={animal.especie === "BOVINO" ? "bovino" : animal.especie === "OVINO" ? "ovino" : "caprino"}>
              {ESPECIE_LABELS[animal.especie]}
            </Badge>
          </div>
          <p className="text-[13px] font-mono text-ink-4">{animal.codigo}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-[13px] text-ink-3">
            <span>Raça: <strong className="text-ink">{animal.raca_principal}</strong></span>
            <span>Sexo: <strong className="text-ink">{animal.sexo === "FEMEA" ? "Fêmea" : "Macho"}</strong></span>
            <span>Idade: <strong className="text-ink">{animal.idade_meses} meses</strong></span>
            <span>CC: <strong className="text-ink">{animal.condicao_corporal}/5</strong></span>
            {animal.num_partos > 0 && (
              <span>Partos: <strong className="text-ink">{animal.num_partos}</strong></span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => void navigate(`/diario-de-bordo/${animal.id}`)}>
            <Baby size={14} />
            Diário
          </Button>
          <Button variant="secondary" size="sm" onClick={onInseminar}>
            <Syringe size={14} />
            Inseminar
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-danger hover:bg-danger-bg">
            <Trash2 size={14} />
            Excluir
          </Button>
        </div>
      </Card>
    </div>
  );
}

function WeightChart({ animalId }: { animalId: string }) {
  const { data } = useQuery({
    queryKey: ["diario", animalId, "pesagens"],
    queryFn: () => diarioApi.pesagens(animalId),
  });
  const theme = useChartTheme();
  const pesagens = data?.data ?? [];

  if (pesagens.length === 0) return null;

  const chartData = pesagens.map((p) => ({ data: p.data, peso: p.peso_kg }));

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Scale size={18} className="text-green-700" />
        <h2 className="text-[15px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
          Curva de peso
        </h2>
        {data?.resumo.ultima_pesagem_kg && (
          <span className="ml-auto text-[13px] text-ink-3">
            Último: <strong className="text-ink">{data.resumo.ultima_pesagem_kg} kg</strong>
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
          <XAxis dataKey="data" tick={{ fontSize: 11, fill: theme.textColor }} />
          <YAxis tick={{ fontSize: 11, fill: theme.textColor }} unit=" kg" />
          <Tooltip
            contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.gridColor}`, borderRadius: 10, fontSize: 12 }}
            formatter={(v: unknown) => [`${String(v)} kg`, "Peso"]}
          />
          <Area type="monotone" dataKey="peso" stroke={theme.primaryColor} fill={`${theme.primaryColor}20`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

function GeneticData({ animal }: { animal: Animal }) {
  const g = animal.dados_geneticos;
  if (!g) return null;
  return (
    <Card>
      <h2 className="text-[15px] font-semibold text-ink mb-3" style={{ fontFamily: "var(--font-display)" }}>
        Dados genéticos
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[13px]">
        {g.raca_pai && <div><p className="text-ink-4">Raça pai</p><p className="font-medium text-ink">{g.raca_pai}</p></div>}
        {g.raca_mae && <div><p className="text-ink-4">Raça mãe</p><p className="font-medium text-ink">{g.raca_mae}</p></div>}
        {g.dep_peso_desmame != null && <div><p className="text-ink-4">DEP Peso Desmame</p><p className="font-medium text-ink">{g.dep_peso_desmame}</p></div>}
        {g.dep_fertilidade != null && <div><p className="text-ink-4">DEP Fertilidade</p><p className="font-medium text-ink">{g.dep_fertilidade}</p></div>}
        {g.coeficiente_endogamia != null && <div><p className="text-ink-4">Coef. Endogamia</p><p className="font-medium text-ink">{(g.coeficiente_endogamia * 100).toFixed(1)}%</p></div>}
      </div>
    </Card>
  );
}

function AlertsSection({ animalId }: { animalId: string }) {
  const { data } = useQuery({
    queryKey: ["alertas", "animal", animalId],
    queryFn: () => alertasApi.listar({ resolvido: false }),
  });
  const myAlerts = (data?.data ?? []).filter((a) => a.animal.id === animalId);
  if (myAlerts.length === 0) return null;
  return (
    <Card>
      <h2 className="text-[15px] font-semibold text-ink mb-3" style={{ fontFamily: "var(--font-display)" }}>
        Alertas do animal
      </h2>
      <div className="flex flex-col gap-2">
        {myAlerts.map((a) => (
          <div key={a.id} className={`px-3 py-2 rounded-[10px] text-[13px] ${a.prioridade === "CRITICA" ? "bg-danger-bg text-danger" : "bg-warn-bg text-warn"}`}>
            {a.mensagem}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showInseminacao, setShowInseminacao] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["animal", id],
    queryFn: () => animaisApi.buscar(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => animaisApi.deletar(id!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["animais"] });
      void navigate("/animais");
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-6">
        <div className="h-32 rounded-[18px] bg-beige animate-pulse" />
      </div>
    );
  }

  const animal = data?.data;
  if (!animal) return <div className="p-8 text-ink-3">Animal não encontrado.</div>;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 flex flex-col gap-4">
      <AnimalHeader
        animal={animal}
        onInseminar={() => setShowInseminacao(true)}
        onDelete={() => setShowDelete(true)}
      />
      <AlertsSection animalId={animal.id} />
      <WeightChart animalId={animal.id} />
      <GeneticData animal={animal} />   

      <ModalNewInseminacaoSelector
        open={showInseminacao}
        onClose={() => setShowInseminacao(false)}
        preselectedAnimalId={animal.id}
      />      
      <Modal10DeleteConfirm
        open={showDelete}
        onClose={() => setShowDelete(false)}
        itemName={animal.nome}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
} 
