import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Syringe, Scale, BookOpen, Trash2, Pencil, Brain, Beef, ExternalLink } from "lucide-react";
import { reprodutoresApi } from "@/lib/api/endpoints/reprodutores";
import { Modal17PromoverReprodutor } from "@/components/modals/Modal17PromoverReprodutor";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { inseminacoesApi } from "@/lib/api/endpoints/inseminacoes";
import { diarioApi } from "@/lib/api/endpoints/diario";
import { alertasApi } from "@/lib/api/endpoints/alertas";
import { useChartTheme } from "@/hooks/useChartTheme";
import { Modal01NewAnimalStep1, type Step1Data } from "@/components/modals/Modal01NewAnimalStep1";
import { Modal02NewAnimalStep2 } from "@/components/modals/Modal02NewAnimalStep2";
import { ModalNewInseminacaoSelector } from "@/components/modals/ModalInseminacaoSelector";
import { Modal10DeleteConfirm } from "@/components/modals/Modal10DeleteConfirm";
import { formatDate } from "@/lib/utils";
import type { Animal, StatusAnimal, Especie, ResultadoInseminacao } from "@/types";

const ESPECIE_LABELS: Record<Especie, string> = { BOVINO: "🐄 Bovino", OVINO: "🐑 Ovino", CAPRINO: "🐐 Caprino" };
const STATUS_VARIANT: Record<StatusAnimal, "ok" | "info" | "ghost" | "danger" | "bovino" | "warn"> = {
  ATIVA: "ok", PRENHA: "info", EM_REPOUSO: "warn", DESCARTADA: "danger",
  REPRODUTOR_ATIVO: "bovino", EM_MONITORAMENTO: "warn",
};
const STATUS_LABELS: Record<StatusAnimal, string> = {
  ATIVA: "Ativa", PRENHA: "Prenha", EM_REPOUSO: "Em repouso", DESCARTADA: "Descartada",
  REPRODUTOR_ATIVO: "Reprodutor", EM_MONITORAMENTO: "Monitoramento",
};
const RESULTADO_VARIANT: Record<ResultadoInseminacao, "ok" | "danger" | "warn" | "ghost"> = {
  PRENHA: "ok", VAZIA: "danger", PENDENTE: "warn", CANCELADA: "ghost",
};
const RESULTADO_LABELS: Record<ResultadoInseminacao, string> = {
  PRENHA: "Prenha", VAZIA: "Vazia", PENDENTE: "Pendente", CANCELADA: "Cancelada",
};

/* ── Header do animal ──────────────────────────────────────────── */

function AnimalHeader({ animal, onEdit, onInseminar, onDelete, onPromover, reprodutorId }: {
  animal: Animal;
  onEdit: () => void;
  onInseminar: () => void;
  onDelete: () => void;
  onPromover: () => void;
  reprodutorId?: string;
}) {
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
            <span>Nasc.: <strong className="text-ink">{formatDate(animal.data_nascimento)}</strong></span>
            {animal.num_partos > 0 && (
              <span>Partos: <strong className="text-ink">{animal.num_partos}</strong></span>
            )}
          </div>
          {/* Link para perfil do reprodutor se já promovido */}
          {reprodutorId && (
            <Link
              to={`/reprodutores/${reprodutorId}`}
              className="mt-2 inline-flex items-center gap-1 text-[12px] text-green-700 hover:underline"
            >
              <ExternalLink size={11} /> Ver perfil do reprodutor
            </Link>
          )}
        </div>
        {/* Botões SUB-01 */}
        <div className="flex gap-2 shrink-0 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => void navigate(`/diario-de-bordo/${animal.id}`)}>
            <BookOpen size={14} /> Diário
          </Button>
          {animal.sexo === "FEMEA" && animal.status !== "DESCARTADA" && (
            <Button variant="secondary" size="sm" onClick={onInseminar}>
              <Syringe size={14} /> Inseminar
            </Button>
          )}
          {/* FLUXO-11: botão "Tornar reprodutor" para machos ATIVA */}
          {animal.sexo === "MACHO" && animal.status === "ATIVA" && (
            <Button variant="secondary" size="sm" onClick={onPromover}>
              <Beef size={14} /> Tornar reprodutor
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <Pencil size={14} /> Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-danger hover:bg-danger-bg">
            <Trash2 size={14} /> Excluir
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ── Dados genéticos ───────────────────────────────────────────── */

function GeneticData({ animal }: { animal: Animal }) {
  const g = animal.dados_geneticos;
  if (!g) return null;
  return (
    <Card>
      <h2 className="text-[15px] font-semibold text-ink mb-3" style={{ fontFamily: "var(--font-display)" }}>
        Dados genéticos
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[13px]">
        <div>
          <p className="text-ink-4">Raça principal</p>
          <p className="font-medium text-ink">{g.raca_principal}</p>
        </div>
        {g.raca_pai && (
          <div>
            <p className="text-ink-4">Raça do pai</p>
            {g.pai_id ? (
              <Link to={`/animais/${g.pai_id}`} className="font-medium text-green-700 hover:underline">
                {g.raca_pai}
              </Link>
            ) : (
              <p className="font-medium text-ink">{g.raca_pai}</p>
            )}
          </div>
        )}
        {g.raca_mae && (
          <div>
            <p className="text-ink-4">Raça da mãe</p>
            {g.mae_id ? (
              <Link to={`/animais/${g.mae_id}`} className="font-medium text-green-700 hover:underline">
                {g.raca_mae}
              </Link>
            ) : (
              <p className="font-medium text-ink">{g.raca_mae}</p>
            )}
          </div>
        )}
        {g.dep_peso_desmame != null && (
          <div>
            <p className="text-ink-4 flex items-center gap-1">
              DEP Peso Desmame
              <span title="Diferença esperada na progênie em relação à média da raça (kg)" className="cursor-help text-green-700">ⓘ</span>
            </p>
            <p className="font-medium text-ink">{g.dep_peso_desmame}</p>
          </div>
        )}
        {g.dep_fertilidade != null && (
          <div>
            <p className="text-ink-4 flex items-center gap-1">
              DEP Fertilidade
              <span title="Capacidade esperada de transmitir fertilidade à progênie" className="cursor-help text-green-700">ⓘ</span>
            </p>
            <p className="font-medium text-ink">{g.dep_fertilidade}</p>
          </div>
        )}
        {g.coeficiente_endogamia != null && (
          <div>
            <p className="text-ink-4 flex items-center gap-1">
              Coef. Endogamia
              <span title="Probabilidade de genes idênticos por descendência (F%). Acima de 6,25% exige atenção." className="cursor-help text-green-700">ⓘ</span>
            </p>
            <p className={`font-medium ${g.coeficiente_endogamia > 0.0625 ? "text-danger font-bold" : "text-ink"}`}>
              {(g.coeficiente_endogamia * 100).toFixed(1)}%
              {g.coeficiente_endogamia > 0.0625 && " ⚠️"}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Histórico reprodutivo ─────────────────────────────────────── */

function HistoricoReprodutivo({ animalId }: { animalId: string }) {
  const { data } = useQuery({
    queryKey: ["inseminacoes", "list", { animal_id: animalId }],
    queryFn: ({ signal }) => inseminacoesApi.listar({ animal_id: animalId, limit: 5, sort: "data_inseminacao", order: "desc" }, signal),
  });
  const inseminacoes = data?.data ?? [];

  if (inseminacoes.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
          Histórico reprodutivo
        </h2>
        <Link
          to={`/inseminacao?animal_id=${animalId}`}
          className="text-[13px] text-green-700 hover:underline"
        >
          Ver todos →
        </Link>
      </div>
      <div className="overflow-hidden rounded-[10px] border border-line">
        <table className="w-full">
          <thead>
            <tr className="bg-beige border-b border-line">
              {["Data", "Tipo", "Reprodutor", "Resultado"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-ink-2 uppercase tracking-[0.04em]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inseminacoes.map((ins) => (
              <tr key={ins.id} className="border-b border-line last:border-0 hover:bg-beige/50 transition-colors text-[13px]">
                <td className="px-3 py-2 text-ink-2">{formatDate(ins.data_inseminacao)}</td>
                <td className="px-3 py-2 text-ink-3 font-mono text-[11px]">{ins.tipo}</td>
                <td className="px-3 py-2 text-ink-2">{ins.reprodutor.nome}</td>
                <td className="px-3 py-2">
                  <Badge variant={RESULTADO_VARIANT[ins.resultado]}>
                    {RESULTADO_LABELS[ins.resultado]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ── Curva de peso ─────────────────────────────────────────────── */

function WeightChart({ animalId, onRunPredicao }: { animalId: string; onRunPredicao: () => void }) {
  const { data } = useQuery({
    queryKey: ["diario", animalId, "pesagens"],
    queryFn: ({ signal }) => diarioApi.pesagens(animalId, signal),
  });
  const theme = useChartTheme();
  const pesagens = data?.data ?? [];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale size={18} className="text-green-700" />
          <h2 className="text-[15px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Curva de peso
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {data?.resumo.ultima_pesagem_kg && (
            <span className="text-[13px] text-ink-3">
              Último: <strong className="text-ink">{data.resumo.ultima_pesagem_kg} kg</strong>
            </span>
          )}
          {/* Botão "Rodar Predição" — FLUXO-03 */}
          <Button variant="secondary" size="sm" onClick={onRunPredicao}>
            <Brain size={13} /> Rodar Predição
          </Button>
        </div>
      </div>

      {pesagens.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2 text-center">
          <Scale size={28} className="text-ink-4" />
          <p className="text-[14px] text-ink-3">Sem pesagens registradas</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={pesagens.map((p) => ({ data: formatDate(p.data), peso: p.peso_kg, gmd: p.gmd_calculado }))} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
            <XAxis dataKey="data" tick={{ fontSize: 11, fill: theme.textColor }} />
            <YAxis tick={{ fontSize: 11, fill: theme.textColor }} unit=" kg" />
            <Tooltip
              contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.gridColor}`, borderRadius: 10, fontSize: 12 }}
              formatter={(v: unknown, name: string | number | undefined) =>
                name === "peso" ? [`${String(v)} kg`, "Peso"] : [`${String(v)} kg/dia`, "GMD"]
              }
            />
            <Area type="monotone" dataKey="peso" name="peso" stroke={theme.primaryColor} fill={`${theme.primaryColor}20`} strokeWidth={2} dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

/* ── Alertas do animal ─────────────────────────────────────────── */

function AlertsSection({ animalId }: { animalId: string }) {
  const { data } = useQuery({
    queryKey: ["alertas", "list", { resolvido: false }],
    queryFn: ({ signal }) => alertasApi.listar({ resolvido: false }, signal),
  });
  const myAlerts = (data?.data ?? []).filter((a) => a.animal.id === animalId);
  if (myAlerts.length === 0) return null;
  return (
    <Card>
      <h2 className="text-[15px] font-semibold text-ink mb-3" style={{ fontFamily: "var(--font-display)" }}>
        Alertas ativos
      </h2>
      <div className="flex flex-col gap-2">
        {myAlerts.map((a) => (
          <div
            key={a.id}
            className={`px-3 py-2 rounded-[10px] text-[13px] flex items-start gap-2 ${a.prioridade === "CRITICA" ? "bg-danger-bg text-danger" : "bg-warn-bg text-warn"}`}
          >
            <span className="mt-0.5">{a.prioridade === "CRITICA" ? "⚠️" : "⚡"}</span>
            {a.mensagem}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */

export function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showEdit1, setShowEdit1] = useState(false);
  const [showEdit2, setShowEdit2] = useState(false);
  const [editStep1Data, setEditStep1Data] = useState<Step1Data | null>(null);
  const [showInseminacao, setShowInseminacao] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDeleteBloqueado, setShowDeleteBloqueado] = useState(false);
  const [showPromover, setShowPromover] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["animais", "detail", id],
    queryFn: ({ signal }) => animaisApi.buscar(id!, signal),
    enabled: !!id,
  });

  const { data: repData } = useQuery({
    queryKey: ["reprodutores", "list", { animal_id: id }],
    queryFn: ({ signal }) => reprodutoresApi.listar(id ? { animal_id: id } : {}, signal),
    enabled: !!id,
  });
  const reprodutorVinculado = repData?.data.find((r) => r.ativo);

  const deleteMutation = useMutation({
    mutationFn: () => animaisApi.deletar(id!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["animais", "list"] });
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
  if (!animal) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-6">
        <p className="text-[14px] text-ink-3">Animal não encontrado.</p>
      </div>
    );
  }

  const handleEdit = () => {
    setEditStep1Data({
      especie: animal.especie,
      nome: animal.nome,
      sexo: animal.sexo,
      data_nascimento: animal.data_nascimento.split("T")[0]!,
      peso_inicial_kg: animal.peso_inicial_kg,
      condicao_corporal: animal.condicao_corporal,
    });
    setShowEdit1(true);
  };

  // "Rodar Predição" → navega para /analise-ia com animal pré-selecionado (FLUXO-03)
  const handleRunPredicao = () => {
    void navigate(`/analise-ia?animal_id=${animal.id}`);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 flex flex-col gap-4">
      <AnimalHeader
        animal={animal}
        onEdit={handleEdit}
        onInseminar={() => setShowInseminacao(true)}
        onDelete={() => {
          if (reprodutorVinculado) {
            setShowDeleteBloqueado(true);
          } else {
            setShowDelete(true);
          }
        }}
        onPromover={() => setShowPromover(true)}
        {...(reprodutorVinculado ? { reprodutorId: reprodutorVinculado.id } : {})}
      />
      <AlertsSection animalId={animal.id} />
      <WeightChart animalId={animal.id} onRunPredicao={handleRunPredicao} />
      <HistoricoReprodutivo animalId={animal.id} />
      <GeneticData animal={animal} />

      {/* Modal editar */}
      <Modal01NewAnimalStep1
        open={showEdit1}
        onClose={() => { setShowEdit1(false); setEditStep1Data(null); }}
        onNext={(d) => { setEditStep1Data(d); setShowEdit1(false); setShowEdit2(true); }}
        mode="edit"
        animal={animal}
      />
      <Modal02NewAnimalStep2
        open={showEdit2}
        onClose={() => { setShowEdit2(false); setEditStep1Data(null); }}
        onBack={() => { setShowEdit2(false); setShowEdit1(true); }}
        step1Data={editStep1Data}
        mode="edit"
        animal={animal}
      />

      <ModalNewInseminacaoSelector
        open={showInseminacao}
        onClose={() => setShowInseminacao(false)}
        preselectedAnimalId={animal.id}
        preselectedAnimalNome={animal.nome}
      />
      <Modal10DeleteConfirm
        open={showDelete}
        onClose={() => setShowDelete(false)}
        itemName={animal.nome}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
      <Modal17PromoverReprodutor
        open={showPromover}
        onClose={() => setShowPromover(false)}
        animalPreSelecionado={animal}
      />

      {/* Modal bloqueio exclusão: animal vinculado a reprodutor ativo */}
      {showDeleteBloqueado && reprodutorVinculado && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteBloqueado(false)} />
          <div className="relative bg-surface w-full flex flex-col rounded-t-[24px] md:rounded-[16px] md:max-w-md md:border md:border-line md:shadow-[var(--shadow-lg)] md:mx-4">
            <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
              <div className="w-10 h-1 bg-line rounded-full" />
            </div>
            <div className="px-5 py-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-danger-bg flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-danger" />
                </div>
                <p className="text-[15px] font-bold text-ink">Exclusão bloqueada</p>
              </div>
              <p className="text-[13px] text-ink-2">
                Este animal está vinculado a um reprodutor ativo.
                Desative ou exclua o reprodutor antes de excluir o animal.
              </p>
              <button
                onClick={() => { setShowDeleteBloqueado(false); void navigate(`/reprodutores/${reprodutorVinculado.id}`); }}
                className="text-[13px] text-green-700 hover:underline flex items-center gap-1"
              >
                <ExternalLink size={13} /> Ver reprodutor vinculado →
              </button>
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteBloqueado(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
