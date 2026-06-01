import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Check } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inseminacoesApi } from "@/lib/api/endpoints/inseminacoes";
import { animaisApi } from "@/lib/api/endpoints/animais";
import type { TipoInseminacao } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InseminacaoData {
  animal_id?: string;
  animal_nome?: string;
  data_inseminacao?: string;
  tipo?: TipoInseminacao;
  protocolo_descricao?: string;
  reprodutor_id?: string;
  reprodutor_nome?: string;
  condicao_corporal_momento?: number;
  temperatura_ambiente_c?: number;
  observacoes?: string;
}

type StepId =
  | "animal"
  | "data_inseminacao"
  | "tipo"
  | "protocolo_descricao"
  | "reprodutor"
  | "condicao_corporal"
  | "temperatura"
  | "observacoes"
  | "done";

interface ChatItem {
  id: string;
  role: "system" | "user";
  content: string;
}

interface ActivePrompt {
  stepId: StepId;
  chips?: string[];
  inputType?: "text" | "number" | "datetime-local";
  placeholder?: string;
  showBothChipsAndInput?: boolean;
  // For animal search
  isAnimalSearch?: boolean;
}

// ─── Step config ──────────────────────────────────────────────────────────────

const CC_OPTIONS = [
  "1 — Muito magro",
  "2 — Magro",
  "3 — Ideal",
  "4 — Gordo",
  "5 — Muito gordo",
];

function buildQuestion(stepId: StepId, data: InseminacaoData): string {
  switch (stepId) {
    case "animal":
      return "Vamos registrar uma inseminação! 💉\nQual **animal (fêmea)** será inseminado?";
    case "data_inseminacao":
      return data.animal_nome
        ? `Qual a **data e hora** da inseminação de **${data.animal_nome}**?`
        : "Qual a **data e hora** da inseminação?";
    case "tipo":
      return "Qual o **tipo de inseminação**?";
    case "protocolo_descricao":
      return "Qual o **protocolo hormonal** utilizado? (pode pular)";
    case "reprodutor":
      return "Qual o **reprodutor / sêmen** utilizado?";
    case "condicao_corporal":
      return "Qual a **condição corporal** do animal no momento? (escala 1–5)";
    case "temperatura":
      return "Qual a **temperatura ambiente** (°C)? (pode pular)";
    case "observacoes":
      return "Alguma **observação** sobre esta inseminação? (pode pular)";
    case "done":
      return `Inseminação de **${data.animal_nome ?? "animal"}** registrada com sucesso! ✅`;
    default:
      return "";
  }
}

function getActivePrompt(stepId: StepId, reprodutores: { id: string; nome: string; raca: string }[]): ActivePrompt {
  switch (stepId) {
    case "animal":
      return { stepId, isAnimalSearch: true, inputType: "text", placeholder: "Buscar por nome ou código…" };
    case "data_inseminacao":
      return { stepId, inputType: "datetime-local" };
    case "tipo":
      return { stepId, chips: ["💉 IA Convencional", "⏱ IATF", "🧬 TE"] };
    case "protocolo_descricao":
      return { stepId, chips: ["Pular"], inputType: "text", placeholder: "Ex: P4+EB Dia 0", showBothChipsAndInput: true };
    case "reprodutor":
      return {
        stepId,
        chips: reprodutores.map((r) => `${r.nome} (${r.raca})`),
      };
    case "condicao_corporal":
      return { stepId, chips: CC_OPTIONS };
    case "temperatura":
      return { stepId, chips: ["Pular"], inputType: "number", placeholder: "Ex: 28", showBothChipsAndInput: true };
    case "observacoes":
      return { stepId, chips: ["Pular"], inputType: "text", placeholder: "Digite a observação…", showBothChipsAndInput: true };
    default:
      return { stepId };
  }
}

function nextStep(current: StepId, data: InseminacaoData): StepId {
  switch (current) {
    case "animal": return "data_inseminacao";
    case "data_inseminacao": return "tipo";
    case "tipo": return data.tipo === "IATF" ? "protocolo_descricao" : "reprodutor";
    case "protocolo_descricao": return "reprodutor";
    case "reprodutor": return "condicao_corporal";
    case "condicao_corporal": return "temperatura";
    case "temperatura": return "observacoes";
    case "observacoes": return "done";
    default: return "done";
  }
}

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

// ─── Animal search prompt ─────────────────────────────────────────────────────

function AnimalSearchPrompt({
  onAnswer,
}: {
  onAnswer: (id: string, nome: string) => void;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const { data } = useQuery({
    queryKey: ["animais-femeas-chat"],
    queryFn: () => animaisApi.listar({ sexo: "FEMEA", status: "ATIVA", limit: 100 }),
  });

  const todos = data?.data ?? [];
  const filtrados = search.length > 0
    ? todos.filter((a) =>
        a.nome.toLowerCase().includes(search.toLowerCase()) ||
        a.codigo.toLowerCase().includes(search.toLowerCase())
      )
    : todos;

  return (
    <div className="border-t border-[var(--chat-border)] bg-[var(--chat-surface)] shrink-0 max-h-64 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou código…"
          className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-bg)] text-[var(--chat-ink)] text-[14px] outline-none focus:border-[var(--chat-green)] transition-colors"
        />
      </div>
      <div className="overflow-y-auto px-4 pb-3 flex flex-col gap-1">
        {filtrados.map((a) => (
          <button
            key={a.id}
            onClick={() => onAnswer(a.id, `${a.nome} (${a.codigo})`)}
            className="w-full text-left px-3 py-2 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-bg)] text-[13px] text-[var(--chat-ink)] hover:bg-[var(--chat-green)] hover:text-white hover:border-[var(--chat-green)] transition-all"
          >
            <strong>{a.nome}</strong>{" "}
            <span className="font-mono opacity-60">{a.codigo}</span>
          </button>
        ))}
        {filtrados.length === 0 && (
          <p className="text-[13px] text-[var(--chat-ink-muted)] text-center py-2">
            Nenhum animal encontrado.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Active prompt area ───────────────────────────────────────────────────────

function ActivePromptArea({
  prompt,
  onAnswer,
}: {
  prompt: ActivePrompt | null;
  onAnswer: (value: string) => void;
}) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => setVal(""), 0);
    if (prompt?.inputType && !prompt.isAnimalSearch) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [prompt?.stepId]);

  if (!prompt) return null;

  const { chips, inputType, placeholder, showBothChipsAndInput } = prompt;
  const hasChips = chips && chips.length > 0;
  const hasInput = !!inputType;

  const submit = () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    onAnswer(trimmed);
    setVal("");
  };

  if (hasChips && !hasInput) {
    return (
      <div className="px-4 pb-3 pt-2 border-t border-[var(--chat-border)] bg-[var(--chat-surface)] shrink-0 flex flex-wrap gap-2">
        {chips!.map((c) => (
          <button
            key={c}
            onClick={() => onAnswer(c)}
            className="px-3 py-1.5 rounded-full border border-[var(--chat-border)] text-[13px] text-[var(--chat-ink)] bg-[var(--chat-bg)] hover:bg-[var(--chat-green)] hover:text-white hover:border-[var(--chat-green)] transition-all font-medium"
          >
            {c}
          </button>
        ))}
      </div>
    );
  }

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

  if (showBothChipsAndInput) {
    return (
      <div className="border-t border-[var(--chat-border)] bg-[var(--chat-surface)] shrink-0">
        <div className="px-4 pt-2.5 pb-2 flex flex-wrap gap-2">
          {chips!.map((c) => (
            <button
              key={c}
              onClick={() => onAnswer(c)}
              className="px-3 py-1 rounded-full border border-[var(--chat-border)] text-[12px] text-[var(--chat-ink)] bg-[var(--chat-bg)] hover:bg-[var(--chat-green)] hover:text-white hover:border-[var(--chat-green)] transition-all font-medium"
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
  preselectedAnimalId?: string | undefined;
  preselectedAnimalNome?: string | undefined;
}

export function ModalChatNewInseminacao({ open, onClose, preselectedAnimalId, preselectedAnimalNome }: Props) {
  useScrollLock(open);
  const qc = useQueryClient();

  const [history, setHistory] = useState<ChatItem[]>([]);
  const [, setCurrentStep] = useState<StepId>("animal");
  const [activePrompt, setActivePrompt] = useState<ActivePrompt | null>(null);
  const [data, setData] = useState<InseminacaoData>({});
  const [isDone, setIsDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const { data: reprodutoresData } = useQuery({
    queryKey: ["reprodutores"],
    queryFn: () => import("@/lib/api/mocks/dados").then((m) => ({ data: m.reprodutores })),
  });

  const reprodutores = reprodutoresData?.data ?? [];

  const criar = useMutation({
    mutationFn: inseminacoesApi.criar,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["inseminacoes"] });
      void qc.invalidateQueries({ queryKey: ["alertas"] });
    },
  });

  const pushQuestion = useCallback((stepId: StepId, d: InseminacaoData, reps: typeof reprodutores) => {
    const question = buildQuestion(stepId, d);
    if (!question) return;
    const msgItem: ChatItem = {
      id: `q-${stepId}-${Date.now()}`,
      role: "system",
      content: question,
    };
    setHistory((prev) => [...prev, msgItem]);
    setTimeout(() => {
      setActivePrompt(getActivePrompt(stepId, reps));
    }, 80);
  }, []);

  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;

    setHistory([]);
    setActivePrompt(null);
    setIsDone(false);

    if (preselectedAnimalId && preselectedAnimalNome) {
      const initialData: InseminacaoData = {
        animal_id: preselectedAnimalId,
        animal_nome: preselectedAnimalNome,
      };
      setTimeout(() => {
        setData(initialData);
        setCurrentStep("data_inseminacao");
        pushQuestion("data_inseminacao", initialData, reprodutores);
      }, 100);
    } else {
      setTimeout(() => {
        setData({});
        setCurrentStep("animal");
        pushQuestion("animal", {}, reprodutores);
      }, 100);
    }
  }, [open, preselectedAnimalId, preselectedAnimalNome, pushQuestion, reprodutores]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, activePrompt]);

  const handleAnimalSelect = useCallback(
    (id: string, nome: string) => {
      const updatedData = { ...data, animal_id: id, animal_nome: nome };
      const userItem: ChatItem = { id: `u-${Date.now()}`, role: "user", content: nome };
      setHistory((prev) => [...prev, userItem]);
      setActivePrompt(null);
      setData(updatedData);
      setCurrentStep("data_inseminacao");
      setTimeout(() => pushQuestion("data_inseminacao", updatedData, reprodutores), 400);
    },
    [data, pushQuestion, reprodutores]
  );

  const handleAnswer = useCallback(
    (raw: string) => {
      if (!activePrompt) return;
      const stepId = activePrompt.stepId;
      let display = raw;
      const updatedData = { ...data };

      switch (stepId) {
        case "data_inseminacao": {
          updatedData.data_inseminacao = raw;
          try {
            display = new Date(raw).toLocaleString("pt-BR");
          } catch { /* noop */ }
          break;
        }
        case "tipo": {
          const map: Record<string, TipoInseminacao> = {
            "💉 IA Convencional": "IA_CONVENCIONAL",
            "⏱ IATF": "IATF",
            "🧬 TE": "TE",
          };
          updatedData.tipo = map[raw] ?? (raw as TipoInseminacao);
          break;
        }
        case "protocolo_descricao": {
          if (raw !== "Pular") updatedData.protocolo_descricao = raw;
          else display = "—";
          break;
        }
        case "reprodutor": {
          const rep = reprodutores.find((r) => `${r.nome} (${r.raca})` === raw);
          if (rep) {
            updatedData.reprodutor_id = rep.id;
            updatedData.reprodutor_nome = rep.nome;
          }
          break;
        }
        case "condicao_corporal": {
          updatedData.condicao_corporal_momento = parseInt(raw[0] ?? "3");
          break;
        }
        case "temperatura": {
          if (raw !== "Pular") updatedData.temperatura_ambiente_c = parseFloat(raw);
          else display = "—";
          break;
        }
        case "observacoes": {
          if (raw !== "Pular") updatedData.observacoes = raw;
          else display = "—";
          break;
        }
      }

      const userItem: ChatItem = { id: `u-${Date.now()}`, role: "user", content: display };
      setHistory((prev) => [...prev, userItem]);
      setActivePrompt(null);
      setData(updatedData);

      const next = nextStep(stepId, updatedData);
      setCurrentStep(next);

      if (next === "done") {
        setTimeout(() => {
          pushQuestion("done", updatedData, reprodutores);
          setIsDone(true);
          criar.mutate({
            animal_id: updatedData.animal_id!,
            reprodutor_id: updatedData.reprodutor_id!,
            data_inseminacao: updatedData.data_inseminacao!,
            tipo: updatedData.tipo!,
            condicao_corporal_momento: updatedData.condicao_corporal_momento!,
            protocolo_descricao: updatedData.protocolo_descricao,
            temperatura_ambiente_c: updatedData.temperatura_ambiente_c,
            observacoes: updatedData.observacoes,
          });
        }, 400);
      } else {
        setTimeout(() => pushQuestion(next, updatedData, reprodutores), 400);
      }
    },
    [activePrompt, data, pushQuestion, reprodutores, criar]
  );

  if (!open) return null;

  return (
    <>
      <style>{`
        .chat-insem {
          --chat-green: #1a5c38;
          --chat-surface: #ffffff;
          --chat-bg: #f9f7f4;
          --chat-border: #e5e2da;
          --chat-ink: #1c1917;
          --chat-ink-muted: #78716c;
        }
        [data-theme="dark"] .chat-insem {
          --chat-green: #4a9e6e;
          --chat-surface: #18241d;
          --chat-bg: #0f1a14;
          --chat-border: #2a3a30;
          --chat-ink: #f0ede4;
          --chat-ink-muted: #9da89f;
        }
      `}</style>
      <div className="chat-insem fixed inset-0 z-50 md:flex md:items-center md:justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden md:block" onClick={onClose} />
        <div className="relative flex flex-col w-full h-full md:h-[600px] md:max-w-[420px] md:rounded-2xl md:border md:border-[var(--chat-border)] md:mx-4 bg-[var(--chat-bg)] overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--chat-surface)] border-b border-[var(--chat-border)] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--chat-green)] flex items-center justify-center shrink-0">
                <span className="text-white text-[11px] font-bold tracking-tight">ZA</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[var(--chat-ink)]">Registro de Inseminação</p>
                <p className="text-[11px] text-[var(--chat-ink-muted)] mt-0.5">
                  {data.animal_nome ? `Animal: ${data.animal_nome}` : "Modo conversa"}
                </p>
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

          {/* Prompt area */}
          {!isDone && activePrompt && (
            activePrompt.isAnimalSearch ? (
              <AnimalSearchPrompt onAnswer={handleAnimalSelect} />
            ) : (
              <ActivePromptArea
                prompt={activePrompt}
                onAnswer={handleAnswer}
              />
            )
          )}

          {isDone && (
            <div className="px-4 py-3 border-t border-[var(--chat-border)] bg-[var(--chat-surface)] shrink-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[var(--chat-green)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Check size={16} />
                Concluir
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
