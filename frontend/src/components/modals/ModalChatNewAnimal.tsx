import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Check } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { animaisApi } from "@/lib/api/endpoints/animais";

// ─── Types ────────────────────────────────────────────────────────────────────

type Especie = "BOVINO" | "OVINO" | "CAPRINO";
type Sexo = "FEMEA" | "MACHO";

interface AnimalData {
  // animais
  especie?: Especie;
  nome?: string;
  codigo?: string;
  sexo?: Sexo;
  data_nascimento?: string;
  peso_inicial_kg?: number;
  condicao_corporal?: number;
  brinco?: string;
  status?: string;
  num_partos?: number;
  data_ultimo_parto?: string;
  observacoes?: string;
  // dados_geneticos
  raca_principal?: string;
  raca_pai?: string;
  raca_mae?: string;
  percentual_sangue?: string;
  dep_peso_desmame?: number;
  dep_peso_sobrean?: number;
  dep_fertilidade?: number;
  dep_acuracia?: number;
  coeficiente_endogamia?: number;
  heterose_esperada?: number;
  // reprodutivo (histórico)
  data_primeiro_parto?: string;
  data_ultima_cobertura?: string;
  gestante?: boolean;
  reprodutor_nome?: string;
  reprodutor_tipo?: "ANIMAL_PROPRIO" | "SEMEN_EXTERNO" | "MONTA_NATURAL";
}

type StepId =
  // Identificação
  | "especie"
  | "nome"
  | "codigo"
  | "sexo"
  | "data_nascimento"
  | "peso_inicial_kg"
  | "condicao_corporal"
  | "brinco"
  | "observacoes"
  // Genética
  | "raca_principal"
  | "raca_pai"
  | "raca_mae"
  | "percentual_sangue"
  | "dep_peso_desmame"
  | "dep_peso_sobrean"
  | "dep_fertilidade"
  | "dep_acuracia"
  | "heterose_esperada"
  // Reprodutivo
  | "historico_intro"
  | "num_partos"
  | "data_ultimo_parto"
  | "data_ultima_cobertura"
  | "gestante"
  | "reprodutor_tipo"
  | "reprodutor_nome"
  | "done";

// Cada item no histórico de chat pode ser uma mensagem ou chips/input ativos
interface ChatItem {
  id: string;
  type: "message";
  role: "system" | "user";
  content: string;
}

interface ActivePrompt {
  stepId: StepId;
  chips?: string[];
  inputType?: "text" | "number" | "date";
  placeholder?: string;
  // chips E input ao mesmo tempo (ex: raças + campo livre)
  showBothChipsAndInput?: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const RACAS: Record<Especie, string[]> = {
  BOVINO: ["Nelore", "Angus", "Brahman", "Girolando", "Gir", "Holandês", "Senepol", "Simmental", "Tabapuã"],
  OVINO: ["Dorper", "Santa Inês", "Morada Nova", "Suffolk", "Texel", "Bergamácia", "Ile de France"],
  CAPRINO: ["Boer", "Anglo-nubiana", "Saanen", "Toggenburg", "Alpina", "Moxotó", "Canindé"],
};

const CC_OPTIONS = [
  "1 — Muito magro",
  "2 — Magro",
  "3 — Ideal",
  "4 — Gordo",
  "5 — Muito gordo",
];

// ─── Step config ──────────────────────────────────────────────────────────────

function buildQuestion(stepId: StepId, data: AnimalData): string {
  switch (stepId) {
    case "especie":
      return "Olá! Vamos cadastrar um novo animal. 🐄\nQual é a **espécie**?";
    case "nome":
      return `Ótimo! Como esse ${data.especie?.toLowerCase()} será **chamado**?`;
    case "codigo":
      return `Qual o **código / identificação interna** de ${data.nome}? (ex: BOV-042)`;
    case "sexo":
      return `Qual é o **sexo** de ${data.nome}?`;
    case "data_nascimento":
      return `Qual é a **data de nascimento** de ${data.nome}?`;
    case "peso_inicial_kg":
      return "Qual foi o **peso inicial** (em kg)?";
    case "condicao_corporal":
      return "Qual a **condição corporal** atual? (escala 1–5)";
    case "brinco":
      return "Possui **brinco ou tatuagem**? (pode pular)";
    case "observacoes":
      return "Alguma **observação** sobre o animal? (pode pular)";
    case "raca_principal":
      return `Agora vamos aos **dados genéticos** de ${data.nome}.\nQual é a **raça principal**?`;
    case "raca_pai":
      return "Qual a **raça do pai**? (pode pular)";
    case "raca_mae":
      return "E a **raça da mãe**? (pode pular)";
    case "percentual_sangue":
      return "Qual o **percentual de sangue** (composição racial)? (ex: 3/4 Nelore 1/4 Angus — pode pular)";
    case "dep_peso_desmame":
      return "Tem o valor de **DEP Peso Desmame**? (pode pular)";
    case "dep_peso_sobrean":
      return "E o **DEP Peso Sobreano**? (pode pular)";
    case "dep_fertilidade":
      return "Tem o **DEP Fertilidade**? (pode pular)";
    case "dep_acuracia":
      return "Qual a **acurácia das DEPs**? (valor entre 0 e 1 — pode pular)";
    case "heterose_esperada":
      return "Qual a **heterose esperada** (%)? (pode pular)";
    case "historico_intro":
      return `${data.nome} não é recém-nascido(a). Vamos registrar o **histórico reprodutivo**?`;
    case "num_partos":
      return "Quantos **partos** já ocorreram?";
    case "data_ultimo_parto":
      return "Qual a **data do último parto**?";
    case "data_ultima_cobertura":
      return "Qual a **data da última cobertura / inseminação**? (pode pular)";
    case "gestante":
      return `${data.nome} está **gestante** no momento?`;
    case "reprodutor_tipo":
      return "Qual o **tipo de cobertura** utilizado?";
    case "reprodutor_nome":
      return "Qual o **nome do reprodutor / touro**? (pode pular)";
    case "done":
      return `Perfeito! Todas as informações de **${data.nome}** foram registradas com sucesso. ✅`;
    default:
      return "";
  }
}

function getActivePrompt(stepId: StepId, data: AnimalData): ActivePrompt {
  const racas = data.especie ? RACAS[data.especie] : [];

  switch (stepId) {
    case "especie":
      return { stepId, chips: ["🐄 Bovino", "🐑 Ovino", "🐐 Caprino"] };
    case "nome":
      return { stepId, inputType: "text", placeholder: "Ex: Mimosa" };
    case "codigo":
      return { stepId, inputType: "text", placeholder: "Ex: BOV-042" };
    case "sexo":
      return { stepId, chips: ["♀ Fêmea", "♂ Macho"] };
    case "data_nascimento":
      return { stepId, inputType: "date" };
    case "peso_inicial_kg":
      return { stepId, inputType: "number", placeholder: "Ex: 38" };
    case "condicao_corporal":
      return { stepId, chips: CC_OPTIONS };
    case "brinco":
      return { stepId, chips: ["Pular"], inputType: "text", placeholder: "Ex: A-0042", showBothChipsAndInput: true };
    case "observacoes":
      return { stepId, chips: ["Pular"], inputType: "text", placeholder: "Digite a observação...", showBothChipsAndInput: true };
    case "raca_principal":
      return { stepId, chips: [...racas, "Outra raça..."], inputType: "text", placeholder: "Digite a raça...", showBothChipsAndInput: true };
    case "raca_pai":
      return { stepId, chips: ["Pular", ...racas], inputType: "text", placeholder: "Digite a raça do pai...", showBothChipsAndInput: true };
    case "raca_mae":
      return { stepId, chips: ["Pular", ...racas], inputType: "text", placeholder: "Digite a raça da mãe...", showBothChipsAndInput: true };
    case "percentual_sangue":
      return { stepId, chips: ["Pular"], inputType: "text", placeholder: "Ex: 3/4 Nelore 1/4 Angus", showBothChipsAndInput: true };
    case "dep_peso_desmame":
      return { stepId, chips: ["Pular"], inputType: "number", placeholder: "Ex: 8.2", showBothChipsAndInput: true };
    case "dep_peso_sobrean":
      return { stepId, chips: ["Pular"], inputType: "number", placeholder: "Ex: 12.5", showBothChipsAndInput: true };
    case "dep_fertilidade":
      return { stepId, chips: ["Pular"], inputType: "number", placeholder: "Ex: 5.0", showBothChipsAndInput: true };
    case "dep_acuracia":
      return { stepId, chips: ["Pular"], inputType: "number", placeholder: "Ex: 0.75 (entre 0 e 1)", showBothChipsAndInput: true };
    case "heterose_esperada":
      return { stepId, chips: ["Pular"], inputType: "number", placeholder: "Ex: 12.0 (%)", showBothChipsAndInput: true };
    case "historico_intro":
      return { stepId, chips: ["Sim, vamos lá", "Pular histórico"] };
    case "num_partos":
      return { stepId, inputType: "number", placeholder: "Ex: 3" };
    case "data_ultimo_parto":
      return { stepId, inputType: "date" };
    case "data_ultima_cobertura":
      return { stepId, chips: ["Pular"], inputType: "date", showBothChipsAndInput: true };
    case "gestante":
      return { stepId, chips: ["Sim", "Não", "Não sei"] };
    case "reprodutor_tipo":
      return { stepId, chips: ["Monta natural", "Sêmen externo", "Animal próprio"] };
    case "reprodutor_nome":
      return { stepId, chips: ["Pular"], inputType: "text", placeholder: "Ex: Bravo III", showBothChipsAndInput: true };
    default:
      return { stepId };
  }
}

function isAdult(dateStr?: string): boolean {
  if (!dateStr) return false;
  const born = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth()) > 6;
}

function nextStep(current: StepId, data: AnimalData): StepId {
  const idFlow: StepId[] = ["especie", "nome", "codigo", "sexo", "data_nascimento", "peso_inicial_kg", "condicao_corporal", "brinco", "observacoes"];
  const genFlow: StepId[] = ["raca_principal", "raca_pai", "raca_mae", "percentual_sangue", "dep_peso_desmame", "dep_peso_sobrean", "dep_fertilidade", "dep_acuracia", "heterose_esperada"];

  const idIdx = idFlow.indexOf(current);
  if (idIdx !== -1 && idIdx < idFlow.length - 1) return idFlow[idIdx + 1]!;
  if (current === "observacoes") return "raca_principal";

  const genIdx = genFlow.indexOf(current);
  if (genIdx !== -1 && genIdx < genFlow.length - 1) return genFlow[genIdx + 1]!;
  if (current === "heterose_esperada") {
    if (data.sexo === "FEMEA" && isAdult(data.data_nascimento)) return "historico_intro";
    return "done";
  }

  if (current === "historico_intro") return "num_partos";
  if (current === "num_partos") return "data_ultimo_parto";
  if (current === "data_ultimo_parto") return "data_ultima_cobertura";
  if (current === "data_ultima_cobertura") return "gestante";
  if (current === "gestante") return "reprodutor_tipo";
  if (current === "reprodutor_tipo") return "reprodutor_nome";
  if (current === "reprodutor_nome") return "done";
  return "done";
}

// ─── Section helpers ──────────────────────────────────────────────────────────

type Section = "identificacao" | "genetica" | "reprodutivo";

const GEN_STEPS: StepId[] = ["raca_principal", "raca_pai", "raca_mae", "percentual_sangue", "dep_peso_desmame", "dep_peso_sobrean", "dep_fertilidade", "dep_acuracia", "heterose_esperada"];
const REP_STEPS: StepId[] = ["historico_intro", "num_partos", "data_ultimo_parto", "data_ultima_cobertura", "gestante", "reprodutor_tipo", "reprodutor_nome", "done"];

function getSection(stepId: StepId): Section {
  if (GEN_STEPS.includes(stepId)) return "genetica";
  if (REP_STEPS.includes(stepId)) return "reprodutivo";
  return "identificacao";
}

const SECTION_LABELS: Record<Section, string> = {
  identificacao: "Identificação",
  genetica: "Genética",
  reprodutivo: "Histórico Reprodutivo",
};

const SECTION_COLORS: Record<Section, string> = {
  identificacao: "#1a5c38",
  genetica: "#b45309",
  reprodutivo: "#9d174d",
};

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMd(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1
      ? <strong key={i}>{p}</strong>
      : p.split("\n").flatMap((line, j, arr) =>
          j < arr.length - 1 ? [line, <br key={`br-${j}`} />] : [line]
        )
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Bubble({ item }: { item: ChatItem }) {
  const isSystem = item.role === "system";
  return (
    <div className={`flex ${isSystem ? "justify-start" : "justify-end"} mb-2`}>
      {isSystem && (
        <div className="w-7 h-7 rounded-full bg-[var(--chat-green)] flex items-center justify-center shrink-0 mr-2 mt-0.5">
          <span className="text-white text-[11px] font-bold">ZA</span>
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed border ${
          isSystem
            ? "bg-[var(--chat-surface)] text-[var(--chat-ink)] border-[var(--chat-border)] rounded-tl-[4px]"
            : "bg-[var(--chat-green)] text-white border-transparent rounded-tr-[4px]"
        }`}
      >
        {renderMd(item.content)}
      </div>
    </div>
  );
}

function ProgressDots({ currentSection }: { currentSection: Section }) {
  const sections: Section[] = ["identificacao", "genetica", "reprodutivo"];
  const active = sections.indexOf(currentSection);
  return (
    <div className="flex items-center gap-1.5">
      {sections.map((s, i) => (
        <div
          key={s}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === active ? "20px" : "6px",
            background: i <= active ? SECTION_COLORS[s] : "var(--chat-border)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Active prompt area (chips + optional input, shown AFTER question) ────────

function ActivePromptArea({
  prompt,
  onAnswer,
  disabled,
}: {
  prompt: ActivePrompt | null;
  onAnswer: (value: string) => void;
  disabled: boolean;
}) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => setVal(""), 0);
    if (!disabled && prompt?.inputType) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt?.stepId, disabled]);

  if (!prompt || disabled) return null;

  const { chips, inputType, placeholder, showBothChipsAndInput } = prompt;
  const hasChips = chips && chips.length > 0;
  const hasInput = !!inputType;

  const submit = () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    onAnswer(trimmed);
    setVal("");
  };

  // Chips only
  if (hasChips && !hasInput) {
    return (
      <div className="px-4 pb-3 pt-1 flex flex-wrap gap-2 pl-[52px]">
        {chips!.map((c) => (
          <button
            key={c}
            onClick={() => onAnswer(c)}
            className="px-3 py-1.5 rounded-full border border-[var(--chat-border)] text-[13px] text-[var(--chat-ink)] bg-[var(--chat-surface)] hover:bg-[var(--chat-green)] hover:text-white hover:border-[var(--chat-green)] transition-all duration-150 font-medium"
          >
            {c}
          </button>
        ))}
      </div>
    );
  }

  // Input only (no chips)
  if (hasInput && !hasChips) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--chat-border)] bg-[var(--chat-surface)] shrink-0">
        <input
          ref={inputRef}
          type={inputType}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder ?? "Digite aqui..."}
          className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-bg)] text-[var(--chat-ink)] text-[14px] outline-none focus:border-[var(--chat-green)] transition-colors"
        />
        <button
          onClick={submit}
          disabled={!val.trim()}
          className="w-9 h-9 rounded-xl bg-[var(--chat-green)] text-white flex items-center justify-center disabled:opacity-30 transition-opacity shrink-0"
        >
          <Send size={15} />
        </button>
      </div>
    );
  }

  // Both chips and input (showBothChipsAndInput)
  if (showBothChipsAndInput) {
    return (
      <div className="border-t border-[var(--chat-border)] bg-[var(--chat-surface)] shrink-0">
        <div className="px-4 pt-2.5 pb-2 flex flex-wrap gap-2">
          {chips!.map((c) => (
            <button
              key={c}
              onClick={() => onAnswer(c)}
              className="px-3 py-1 rounded-full border border-[var(--chat-border)] text-[12px] text-[var(--chat-ink)] bg-[var(--chat-bg)] hover:bg-[var(--chat-green)] hover:text-white hover:border-[var(--chat-green)] transition-all duration-150 font-medium"
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-4 pb-3">
          <input
            ref={inputRef}
            type={inputType}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={placeholder ?? "Ou digite aqui..."}
            className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-bg)] text-[var(--chat-ink)] text-[14px] outline-none focus:border-[var(--chat-green)] transition-colors"
          />
          <button
            onClick={submit}
            disabled={!val.trim()}
            className="w-9 h-9 rounded-xl bg-[var(--chat-green)] text-white flex items-center justify-center disabled:opacity-30 transition-opacity shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ModalChatNewAnimal({ open, onClose }: Props) {
  useScrollLock(open);
  const qc = useQueryClient();

  const [history, setHistory] = useState<ChatItem[]>([]);
  const [currentStep, setCurrentStep] = useState<StepId>("especie");
  const [activePrompt, setActivePrompt] = useState<ActivePrompt | null>(null);
  const [data, setData] = useState<AnimalData>({});
  const [isDone, setIsDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const createAnimal = useMutation({
    mutationFn: (finalData: AnimalData) => {
      const payload: import("@/types").Animal = {
        id: "", codigo: "", nome: finalData.nome ?? "", especie: finalData.especie ?? "BOVINO",
        raca_principal: finalData.raca_principal ?? "", sexo: finalData.sexo ?? "FEMEA",
        status: "ATIVA", data_nascimento: finalData.data_nascimento ?? "",
        idade_meses: 0, peso_inicial_kg: finalData.peso_inicial_kg ?? 0,
        condicao_corporal: finalData.condicao_corporal ?? 3, num_partos: finalData.num_partos ?? 0,
        fazenda_id: "", created_at: "",
        ...(finalData.codigo && { codigo: finalData.codigo }),
        ...(finalData.brinco && { brinco: finalData.brinco }),
        ...(finalData.data_ultimo_parto && { data_ultimo_parto: finalData.data_ultimo_parto }),
        ...(finalData.observacoes && { observacoes: finalData.observacoes }),
        dados_geneticos: {
          raca_principal: finalData.raca_principal ?? "",
          ...(finalData.raca_pai && { raca_pai: finalData.raca_pai }),
          ...(finalData.raca_mae && { raca_mae: finalData.raca_mae }),
          ...(finalData.dep_peso_desmame && { dep_peso_desmame: finalData.dep_peso_desmame }),
          ...(finalData.dep_peso_sobrean && { dep_peso_sobrean: finalData.dep_peso_sobrean }),
          ...(finalData.dep_fertilidade && { dep_fertilidade: finalData.dep_fertilidade }),
          ...(finalData.dep_acuracia && { dep_acuracia: finalData.dep_acuracia }),
          ...(finalData.heterose_esperada && { heterose_esperada: finalData.heterose_esperada }),
        },
      };
      return animaisApi.criar(payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["animais", "list"] });
      void qc.invalidateQueries({ queryKey: ["animais", "counts"] });
      void qc.invalidateQueries({ queryKey: ["dashboard", "kpis"] });
    },
  });

  // Push a question bubble, then reveal chips/input
  const pushQuestion = useCallback((stepId: StepId, d: AnimalData) => {
    const question = buildQuestion(stepId, d);
    if (!question) return;

    const msgItem: ChatItem = {
      id: `q-${stepId}-${Date.now()}`,
      type: "message",
      role: "system",
      content: question,
    };

    setHistory((prev) => [...prev, msgItem]);
    // Reveal prompt controls only after message is added
    setTimeout(() => {
      const prompt = getActivePrompt(stepId, d);
      setActivePrompt(prompt);
    }, 80);
  }, []);

  const initializedRef = useRef(false);

  // Initialize
  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;
    setHistory([]);
    setActivePrompt(null);
    setData({});
    setCurrentStep("especie");
    setIsDone(false);
    setTimeout(() => pushQuestion("especie", {}), 100);
  }, [open, pushQuestion]);

  // Scroll to bottom whenever history changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, activePrompt]);

  const handleAnswer = useCallback(
    (raw: string) => {
      if (!activePrompt) return;
      const stepId = activePrompt.stepId;

      let display = raw;
      const updatedData = { ...data };

      const stripEmoji = (s: string) => s.replace(/^[^\w♀♂]+\s*/, "").trim();

      switch (stepId) {
        case "especie": {
          const map: Record<string, Especie> = { Bovino: "BOVINO", Ovino: "OVINO", Caprino: "CAPRINO" };
          updatedData.especie = map[stripEmoji(raw)] ?? (raw.toUpperCase() as Especie);
          break;
        }
        case "nome":
          updatedData.nome = raw;
          break;
        case "codigo":
          updatedData.codigo = raw;
          break;
        case "sexo": {
          const map: Record<string, Sexo> = { Fêmea: "FEMEA", Macho: "MACHO" };
          updatedData.sexo = map[stripEmoji(raw)] ?? (raw.toUpperCase() as Sexo);
          break;
        }
        case "data_nascimento":
          updatedData.data_nascimento = raw;
          try { display = new Date(raw + "T12:00:00").toLocaleDateString("pt-BR"); } catch { /* noop */ }
          break;
        case "peso_inicial_kg":
          updatedData.peso_inicial_kg = parseFloat(raw);
          display = `${raw} kg`;
          break;
        case "condicao_corporal":
          updatedData.condicao_corporal = parseInt(raw[0] ?? "3");
          break;
        case "brinco":
          if (raw !== "Pular") updatedData.brinco = raw;
          else display = "—";
          break;
        case "observacoes":
          if (raw !== "Pular") updatedData.observacoes = raw;
          else display = "—";
          break;
        case "raca_principal":
          if (raw !== "Outra raça...") updatedData.raca_principal = raw;
          else {
            // keep active prompt but remove "Outra raça..." chip, show only input
            setActivePrompt({ stepId, inputType: "text", placeholder: "Digite a raça principal..." });
            return;
          }
          break;
        case "raca_pai":
          if (raw !== "Pular") updatedData.raca_pai = raw;
          else display = "—";
          break;
        case "raca_mae":
          if (raw !== "Pular") updatedData.raca_mae = raw;
          else display = "—";
          break;
        case "percentual_sangue":
          if (raw !== "Pular") updatedData.percentual_sangue = raw;
          else display = "—";
          break;
        case "dep_peso_desmame":
          if (raw !== "Pular") updatedData.dep_peso_desmame = parseFloat(raw);
          else display = "—";
          break;
        case "dep_peso_sobrean":
          if (raw !== "Pular") updatedData.dep_peso_sobrean = parseFloat(raw);
          else display = "—";
          break;
        case "dep_fertilidade":
          if (raw !== "Pular") updatedData.dep_fertilidade = parseFloat(raw);
          else display = "—";
          break;
        case "dep_acuracia":
          if (raw !== "Pular") updatedData.dep_acuracia = parseFloat(raw);
          else display = "—";
          break;
        case "heterose_esperada":
          if (raw !== "Pular") updatedData.heterose_esperada = parseFloat(raw);
          else display = "—";
          break;
        case "historico_intro":
          if (raw.includes("Pular")) {
            // Add user bubble and skip to done
            const userItem: ChatItem = { id: `u-${Date.now()}`, type: "message", role: "user", content: "Pular histórico" };
            setHistory((prev) => [...prev, userItem]);
            setActivePrompt(null);
            setData(updatedData);
            setTimeout(() => {
              pushQuestion("done", updatedData);
              setIsDone(true);
              createAnimal.mutate(updatedData);
            }, 400);
            return;
          }
          break;
        case "num_partos":
          updatedData.num_partos = parseInt(raw);
          display = `${raw} parto(s)`;
          break;
        case "data_ultimo_parto":
          updatedData.data_ultimo_parto = raw;
          try { display = new Date(raw + "T12:00:00").toLocaleDateString("pt-BR"); } catch { /* noop */ }
          break;
        case "data_ultima_cobertura":
          if (raw !== "Pular") {
            updatedData.data_ultima_cobertura = raw;
            try { display = new Date(raw + "T12:00:00").toLocaleDateString("pt-BR"); } catch { /* noop */ }
          } else display = "—";
          break;
        case "gestante":
          updatedData.gestante = raw === "Sim";
          break;
        case "reprodutor_tipo": {
          const map: Record<string, AnimalData["reprodutor_tipo"]> = {
            "Monta natural": "MONTA_NATURAL",
            "Sêmen externo": "SEMEN_EXTERNO",
            "Animal próprio": "ANIMAL_PROPRIO",
          };
          const tipo = map[raw];
          if (tipo) updatedData.reprodutor_tipo = tipo;
          break;
        }
        case "reprodutor_nome":
          if (raw !== "Pular") updatedData.reprodutor_nome = raw;
          else display = "—";
          break;
      }

      // Add user bubble
      const userItem: ChatItem = { id: `u-${Date.now()}`, type: "message", role: "user", content: display };
      setHistory((prev) => [...prev, userItem]);
      setActivePrompt(null);
      setData(updatedData);

      const next = nextStep(stepId, updatedData);
      setCurrentStep(next);

      if (next === "done") {
        setTimeout(() => {
          pushQuestion("done", updatedData);
          setIsDone(true);
          createAnimal.mutate(updatedData);
        }, 400);
      } else {
        setTimeout(() => pushQuestion(next, updatedData), 400);
      }
    },
    [activePrompt, data, pushQuestion, createAnimal]
  );

  if (!open) return null;

  const currentSection = getSection(currentStep);

  return (
    <>
      <style>{`
        .chat-modal {
          --chat-green: #1a5c38;
          --chat-surface: #ffffff;
          --chat-bg: #f9f7f4;
          --chat-border: #e5e2da;
          --chat-ink: #1c1917;
          --chat-ink-muted: #78716c;
        }
        [data-theme="dark"] .chat-modal {
          --chat-green: #4a9e6e;
          --chat-surface: #18241d;
          --chat-bg: #0f1a14;
          --chat-border: #2a3a30;
          --chat-ink: #f0ede4;
          --chat-ink-muted: #9da89f;
        }
      `}</style>
      <div className="chat-modal fixed inset-0 z-50 md:flex md:items-center md:justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden md:block" onClick={onClose} />
        <div className="relative flex flex-col w-full h-full md:h-[640px] md:max-w-[420px] md:rounded-2xl md:border md:border-[var(--chat-border)] md:mx-4 bg-[var(--chat-bg)] overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--chat-surface)] border-b border-[var(--chat-border)] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--chat-green)] flex items-center justify-center shrink-0">
                <span className="text-white text-[11px] font-bold tracking-tight">ZA</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[var(--chat-ink)]">Cadastro de Animal</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      background: SECTION_COLORS[currentSection] + "22",
                      color: SECTION_COLORS[currentSection],
                    }}
                  >
                    {SECTION_LABELS[currentSection]}
                  </span>
                  <ProgressDots currentSection={currentSection} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--chat-ink-muted)] hover:bg-[var(--chat-border)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {history.map((item) => (
              <Bubble key={item.id} item={item} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Active prompt — chips/input always BELOW the messages list */}
          {!isDone && (
            <ActivePromptArea
              prompt={activePrompt}
              onAnswer={handleAnswer}
              disabled={false}
            />
          )}

          {isDone && (
            <div className="px-4 py-3 border-t border-[var(--chat-border)] bg-[var(--chat-surface)] shrink-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[var(--chat-green)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Check size={16} />
                Concluir cadastro
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
