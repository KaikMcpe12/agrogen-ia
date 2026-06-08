import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, AlertTriangle, Syringe, Plus, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inseminacoesApi } from "@/lib/api/endpoints/inseminacoes";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { reprodutoresApi } from "@/lib/api/endpoints/reprodutores";
import { useDebounce } from "@/hooks/useDebounce";
import { useScrollLock } from "@/hooks/useScrollLock";
import { Modal04ReprodutorRapido } from "./Modal04ReprodutorRapido";
import type { TipoInseminacao, Reprodutor, Animal } from "@/types";
import { formatDate } from "@/lib/utils";

const RASCUNHO_KEY = "agrogen.inseminacao.rascunho";
const RASCUNHO_PENDING_KEY = "agrogen.inseminacao.rascunho_pending";

const INTERVALO_MIN: Record<string, number> = { BOVINO: 21, OVINO: 17, CAPRINO: 17 };

const schema = z.object({
  animal_id: z.string().min(1, "Selecione um animal"),
  reprodutor_id: z.string().min(1, "Selecione um reprodutor"),
  data_inseminacao: z.string().min(1, "Obrigatório"),
  tipo: z.enum(["IA_CONVENCIONAL", "IATF", "TE"] as const),
  protocolo_descricao: z.string().optional(),
  condicao_corporal_momento: z.coerce.number().min(1).max(5),
  temperatura_ambiente_c: z.coerce.number().optional(),
  observacoes: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.tipo === "IATF" && !val.protocolo_descricao?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Obrigatório para IATF", path: ["protocolo_descricao"] });
  }
});

type FormData = z.infer<typeof schema>;

const TIPO_CARDS: { value: TipoInseminacao; label: string; sublabel: string; icon: string }[] = [
  { value: "IA_CONVENCIONAL", label: "IA Conv.", sublabel: "Convencional", icon: "💉" },
  { value: "IATF", label: "IATF", sublabel: "Tempo Fixo", icon: "⏱" },
  { value: "TE", label: "TE", sublabel: "Embrião", icon: "🧬" },
];

const ccOptions = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }));

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedAnimalId?: string;
}

export function Modal03NewInseminacao({ open, onClose, preselectedAnimalId }: Props) {
  useScrollLock(open);

  const qc = useQueryClient();
  const navigate = useNavigate();
  const [animalSearch, setAnimalSearch] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [modal04Open, setModal04Open] = useState(false);
  const [extraReproductores, setExtraReproductores] = useState<Reprodutor[]>([]);
  const debouncedSearch = useDebounce(animalSearch, 400);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({ mode: 'onBlur', reValidateMode: 'onChange',
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      tipo: "IATF",
      condicao_corporal_momento: 3,
      animal_id: preselectedAnimalId ?? "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const tipo = watch("tipo");
  const animalId = watch("animal_id");
  const dataInseminacao = watch("data_inseminacao");

  const { data: animaisSugestoesData } = useQuery({
    queryKey: ["animais", "list", { q: debouncedSearch, sexo: "FEMEA", status: "ATIVA", limit: 10 }],
    queryFn: ({ signal }) => animaisApi.listar({ q: debouncedSearch, sexo: "FEMEA", status: "ATIVA", limit: 10 }, signal),
    enabled: debouncedSearch.length > 1 && !preselectedAnimalId,
  });

  const { data: preselectedData } = useQuery({
    queryKey: ["animais", "detail", preselectedAnimalId],
    queryFn: ({ signal }) => animaisApi.buscar(preselectedAnimalId!, signal),
    enabled: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(preselectedAnimalId ?? ""),
  });
  const preselectedAnimal = preselectedData?.data ?? null;

  const { data: lastInseminacaoData } = useQuery({
    queryKey: ["inseminacoes", "list", { animal_id: animalId, limit: 1 }],
    queryFn: ({ signal }) => inseminacoesApi.listar({ animal_id: animalId, limit: 1, sort: "data_inseminacao", order: "desc" }, signal),
    enabled: !!animalId,
  });
  const lastIns = lastInseminacaoData?.data[0];

  const animalEspecie = (preselectedAnimal ?? selectedAnimal)?.especie;

  const { data: reprodutoresData } = useQuery({
    queryKey: ["reprodutores", "list", { especie: animalEspecie, ativo: true }],
    queryFn: ({ signal }) => reprodutoresApi.listar({
      ativo: true,
      ...(animalEspecie ? { especie: animalEspecie } : {}),
      limit: 999,
    }, signal),
  });

  const criar = useMutation({
    mutationFn: inseminacoesApi.criar,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["inseminacoes", "list"] });
      void qc.invalidateQueries({ queryKey: ["alertas", "list"] });
      void qc.invalidateQueries({ queryKey: ["alertas", "contagem"] });
      reset();
      setSelectedAnimal(null);
      setAnimalSearch("");
      onClose();
    },
  });

  if (!open) return null;

  const animalContexto = preselectedAnimal ?? selectedAnimal;
  const reprodutoresFiltrados = [...(reprodutoresData?.data ?? []), ...extraReproductores];
  const allReproductores = reprodutoresFiltrados.map((r) => ({
    value: r.id,
    label: `${r.nome} (${r.raca})${r.tipo === "SEMEN_EXTERNO" ? " — Sêmen Ext." : " — Animal Próprio"}`,
  }));

  const handleGerenciarReprodutores = () => {
    const formValues = {
      animal_id: animalId,
      tipo,
      data_inseminacao: dataInseminacao,
    };
    sessionStorage.setItem(RASCUNHO_KEY, JSON.stringify(formValues));
    sessionStorage.setItem(RASCUNHO_PENDING_KEY, "true");
    onClose();
    void navigate("/reprodutores");
  };

  const intervaloMin = animalContexto ? INTERVALO_MIN[animalContexto.especie] ?? 21 : 21;
  const showIntervaloWarning = (() => {
    if (!lastIns || !dataInseminacao) return false;
    const last = new Date(lastIns.data_inseminacao);
    const nova = new Date(dataInseminacao);
    if (isNaN(nova.getTime())) return false;
    const diff = Math.round((nova.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff < intervaloMin;
  })();

  const onSubmit = (data: FormData) => {
    criar.mutate({
      animal_id: data.animal_id,
      reprodutor_id: data.reprodutor_id,
      data_inseminacao: data.data_inseminacao,
      tipo: data.tipo,
      condicao_corporal_momento: data.condicao_corporal_momento,
      protocolo_descricao: data.protocolo_descricao,
      temperatura_ambiente_c: data.temperatura_ambiente_c,
      observacoes: data.observacoes,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden md:block" onClick={onClose} />
        <div className="relative bg-surface flex flex-col w-full h-full md:h-auto md:max-w-lg md:rounded-[16px] md:border md:border-line md:max-h-[90dvh] md:shadow-[var(--shadow-lg)] md:mx-4">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-green-700/10 flex items-center justify-center">
                <Syringe size={16} className="text-green-700" />
              </div>
              <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
                Nova Inseminação
              </h3>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

            {/* Seção: Animal */}
            {!preselectedAnimalId ? (
              <div>
                <Input
                  label="Animal (Fêmea)"
                  required
                  placeholder="Buscar por nome ou código…"
                  value={animalSearch}
                  onChange={(e) => { setAnimalSearch(e.target.value); setValue("animal_id", ""); setSelectedAnimal(null); }}
                />
                {(animaisSugestoesData?.data ?? []).length > 0 && animalSearch && !animalId && (
                  <div className="mt-1 border border-line rounded-[10px] bg-surface overflow-hidden shadow-[var(--shadow-sm)]">
                    {(animaisSugestoesData?.data ?? []).map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-beige transition-colors border-b border-line last:border-0"
                        onClick={() => {
                          setValue("animal_id", a.id);
                          setSelectedAnimal(a);
                          setAnimalSearch(`${a.nome} (${a.codigo})`);
                        }}
                      >
                        <strong>{a.nome}</strong>{" "}
                        <span className="font-mono text-ink-4">{a.codigo}</span>
                      </button>
                    ))}
                  </div>
                )}
                {animalSearch.length > 1 && (animaisSugestoesData?.data ?? []).length === 0 && !animalId && (
                  <p className="text-[12px] text-ink-4 mt-1">
                    Nenhuma fêmea ATIVA encontrada para "{animalSearch}". Animais com status Prenha ou Em Monitoramento não aparecem aqui.
                  </p>
                )}
                {errors.animal_id && (
                  <p className="text-[12px] text-danger mt-1">{errors.animal_id.message}</p>
                )}
                <input type="hidden" {...register("animal_id")} />
              </div>
            ) : (
              <input type="hidden" {...register("animal_id")} />
            )}

            {/* Card de contexto do animal */}
            {animalContexto && (
              <div className="rounded-[12px] border border-line bg-beige px-4 py-3 flex items-center gap-3">
                <div className="text-2xl shrink-0">
                  {animalContexto.especie === "BOVINO" ? "🐄" : animalContexto.especie === "OVINO" ? "🐑" : "🐐"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold text-ink">{animalContexto.nome}</p>
                    <Badge variant="ghost">{animalContexto.especie}</Badge>
                  </div>
                  <p className="text-[12px] font-mono text-ink-4">{animalContexto.codigo} · {animalContexto.raca_principal}</p>
                  {animalContexto.condicao_corporal && (
                    <p className="text-[12px] text-ink-3 mt-0.5">CC: {animalContexto.condicao_corporal}/5 · Nasc.: {formatDate(animalContexto.data_nascimento)}</p>
                  )}
                  {lastIns && (
                    <p className="text-[12px] text-warn mt-0.5">
                      Última inseminação: {formatDate(lastIns.data_inseminacao)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Seção: Evento */}
            <div className="flex flex-col gap-4 border-t border-line pt-4">
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.07em]">Evento</p>

              <Input
                label="Data e hora"
                type="datetime-local"
                required
                error={errors.data_inseminacao?.message}
                {...register("data_inseminacao")}
              />

              {/* Tipo de IA — radio cards */}
              <div>
                <label className="text-[13px] font-medium text-ink-2 block mb-2">
                  Tipo de IA <span className="text-danger">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TIPO_CARDS.map(({ value, label, sublabel, icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue("tipo", value)}
                      className={[
                        "flex flex-col items-center gap-1 py-3 px-2 rounded-[12px] border text-[13px] font-medium transition-all",
                        tipo === value
                          ? "border-green-700 bg-green-700/10 text-green-700 shadow-[0_0_0_1px_var(--color-green-700)]"
                          : "border-line bg-surface text-ink-2 hover:bg-beige hover:border-line-2",
                      ].join(" ")}
                    >
                      <span className="text-[22px] leading-none">{icon}</span>
                      <span className="font-semibold">{label}</span>
                      <span className="text-[10px] text-ink-4 font-normal">{sublabel}</span>
                    </button>
                  ))}
                </div>
                <input type="hidden" {...register("tipo")} />
              </div>

              {tipo === "IATF" && (
                <Input
                  label="Protocolo hormonal"
                  required
                  placeholder="Ex: P4+EB Dia 0"
                  error={errors.protocolo_descricao?.message}
                  {...register("protocolo_descricao")}
                />
              )}
            </div>

            {/* Seção: Reprodução */}
            <div className="flex flex-col gap-4 border-t border-line pt-4">
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.07em]">Reprodução</p>

              <div>
                {reprodutoresFiltrados.length === 0 && animalContexto ? (
                  <div className="flex flex-col gap-2 px-3 py-3 bg-amber-soft border border-amber/30 rounded-[10px]">
                    <p className="text-[13px] font-semibold text-amber">
                      Nenhum reprodutor {animalContexto.especie} cadastrado
                    </p>
                    <p className="text-[12px] text-ink-3">
                      Você precisará cadastrar pelo menos um reprodutor desta espécie antes de continuar.
                    </p>
                    <button
                      type="button"
                      onClick={() => setModal04Open(true)}
                      className="self-start flex items-center gap-1.5 text-[12px] text-green-700 hover:underline font-medium"
                    >
                      <Plus size={12} /> Cadastrar reprodutor {animalContexto.especie}
                    </button>
                  </div>
                ) : (
                  <Select
                    label="Reprodutor / Sêmen"
                    required
                    options={allReproductores}
                    placeholder="Selecionar reprodutor"
                    error={errors.reprodutor_id?.message}
                    {...register("reprodutor_id")}
                  />
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-[12px] text-green-700 hover:underline"
                    onClick={() => setModal04Open(true)}
                  >
                    <Plus size={12} /> Cadastrar novo reprodutor
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[12px] text-ink-3 hover:text-green-700 hover:underline"
                    onClick={handleGerenciarReprodutores}
                  >
                    Gerenciar todos <ExternalLink size={11} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Condição corporal"
                  required
                  options={ccOptions}
                  error={errors.condicao_corporal_momento?.message}
                  {...register("condicao_corporal_momento")}
                />
                <Input
                  label="Temperatura (°C)"
                  type="number"
                  placeholder="Opcional"
                  {...register("temperatura_ambiente_c")}
                />
              </div>
            </div>

            {/* Banner condicional de intervalo curto */}
            {showIntervaloWarning && (
              <div className="flex gap-3 p-3.5 rounded-[12px] bg-amber-50 border border-amber-300">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-amber-700">Intervalo curto detectado</p>
                  <p className="text-[12px] text-amber-600 mt-0.5">
                    A última inseminação foi há menos de {intervaloMin} dias (mínimo recomendado para{" "}
                    {animalContexto?.especie === "BOVINO" ? "bovinos" : "ovinos/caprinos"}).
                    Verifique com o veterinário antes de prosseguir.
                  </p>
                </div>
              </div>
            )}

            {/* Observações */}
            <div>
              <label className="text-[13px] font-medium text-ink-2 block mb-1.5">Observações</label>
              <textarea
                {...register("observacoes")}
                rows={2}
                className="w-full px-3 py-2.5 rounded-[10px] border border-line text-[14px] text-ink bg-surface resize-none outline-none focus:border-green-700 focus:ring-[3px] focus:ring-green-700/18 transition-all placeholder:text-ink-4"
                placeholder="Observações opcionais…"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-5 py-3 bg-beige border-t border-line shrink-0">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleSubmit(onSubmit)} loading={criar.isPending}>
              Registrar inseminação
            </Button>
          </div>
        </div>
      </div>

      <Modal04ReprodutorRapido
        open={modal04Open}
        mode="rapido"
        onClose={() => setModal04Open(false)}
        {...(animalContexto?.especie ? { especiePreferida: animalContexto.especie, especieLocked: true } : {})}
        onSave={(novoRep) => {
          setExtraReproductores((prev) => [...prev, novoRep]);
          setValue("reprodutor_id", novoRep.id);
          setModal04Open(false);
        }}
      />
    </>
  );
}
