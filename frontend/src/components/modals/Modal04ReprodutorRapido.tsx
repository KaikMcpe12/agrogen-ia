import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Dna, Lock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useScrollLock } from "@/hooks/useScrollLock";
import { reprodutoresApi } from "@/lib/api/endpoints/reprodutores";
import type { Reprodutor, Especie } from "@/types";

/* ── Schema dinâmico (base para rápido/completo) ─────────────────── */

const baseSchema = z.object({
  nome: z.string().min(3, "Mínimo 3 caracteres"),
  especie: z.enum(["BOVINO", "OVINO", "CAPRINO"] as const),
  raca: z.string().min(1, "Obrigatório"),
  tipo: z.enum(["SEMEN_EXTERNO", "ANIMAL_PROPRIO"] as const),
  empresa_semen: z.string().optional(),
  animal_id: z.string().optional(),
  registro: z.string().optional(),
  dep_peso_desmame: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().optional()
  ),
  dep_fertilidade: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().min(0).max(1).optional()
  ),
  dep_acuracia: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().min(0).max(1).optional()
  ),
  ativo: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.tipo === "SEMEN_EXTERNO" && !data.empresa_semen) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Obrigatório para Sêmen Externo", path: ["empresa_semen"] });
  }
  if (data.tipo === "ANIMAL_PROPRIO" && !data.animal_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Obrigatório para Animal Próprio", path: ["animal_id"] });
  }
});

type FormData = z.infer<typeof baseSchema>;

/* ── Props ───────────────────────────────────────────────────────── */

export interface Modal04Props {
  open: boolean;
  onClose: () => void;
  onSave?: (reprodutor: Reprodutor) => void;
  mode?: "rapido" | "create" | "edit";
  reprodutor?: Reprodutor;
  especiePreferida?: Especie;
  especieLocked?: boolean;
}

const especieOptions = [
  { value: "BOVINO", label: "🐄 Bovino" },
  { value: "OVINO", label: "🐑 Ovino" },
  { value: "CAPRINO", label: "🐐 Caprino" },
];

const tipoOptions = [
  { value: "SEMEN_EXTERNO", label: "Sêmen Externo (empresa)" },
  { value: "ANIMAL_PROPRIO", label: "Animal Próprio / do plantel" },
];

const TITULO: Record<NonNullable<Modal04Props["mode"]>, string> = {
  rapido: "Cadastro Rápido de Reprodutor",
  create: "Novo Reprodutor",
  edit: "Editar Reprodutor",
};

export function Modal04ReprodutorRapido({
  open, onClose, onSave, mode = "rapido", reprodutor, especiePreferida, especieLocked,
}: Modal04Props) {
  useScrollLock(open);
  const qc = useQueryClient();
  const isEdit = mode === "edit";
  const isCompleto = mode === "create" || isEdit;

  const defaultValues: Partial<FormData> = {
    especie: especiePreferida ?? reprodutor?.especie ?? "BOVINO",
    tipo: reprodutor?.tipo ?? "SEMEN_EXTERNO",
    nome: reprodutor?.nome ?? "",
    raca: reprodutor?.raca ?? "",
    empresa_semen: reprodutor?.empresa_semen ?? "",
    animal_id: reprodutor?.animal_id ?? "",
    registro: reprodutor?.registro ?? "",
    dep_peso_desmame: reprodutor?.dep_peso_desmame,
    dep_fertilidade: reprodutor?.dep_fertilidade,
    dep_acuracia: reprodutor?.dep_acuracia,
    ativo: reprodutor?.ativo ?? true,
  };

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(baseSchema) as Resolver<FormData>,
    defaultValues,
  });

  const tipo = watch("tipo");
  const especieAtual = watch("especie");

  useEffect(() => {
    if (open) reset(defaultValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reprodutor?.id]);

  /* Quando usuário muda tipo, limpa campos condicionais */
  useEffect(() => {
    if (tipo === "SEMEN_EXTERNO") setValue("animal_id", "");
    if (tipo === "ANIMAL_PROPRIO") setValue("empresa_semen", "");
  }, [tipo, setValue]);

  const criarMutation = useMutation({
    mutationFn: (data: FormData) => {
      const body: import("@/lib/api/endpoints/reprodutores").CriarReprodutorBody = {
        nome: data.nome,
        especie: data.especie,
        raca: data.raca,
        tipo: data.tipo,
        ...(data.empresa_semen ? { empresa_semen: data.empresa_semen } : {}),
        ...(data.animal_id ? { animal_id: data.animal_id } : {}),
        ...(data.registro ? { registro: data.registro } : {}),
        ...(data.dep_peso_desmame !== undefined ? { dep_peso_desmame: data.dep_peso_desmame } : {}),
        ...(data.dep_fertilidade !== undefined ? { dep_fertilidade: data.dep_fertilidade } : {}),
        ...(data.dep_acuracia !== undefined ? { dep_acuracia: data.dep_acuracia } : {}),
      };
      return reprodutoresApi.criar(body);
    },
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["reprodutores"] });
      if (onSave) onSave(res.data);
      onClose();
    },
  });

  const editarMutation = useMutation({
    mutationFn: (data: FormData) => {
      const isOwn = reprodutor?.tipo === "ANIMAL_PROPRIO";
      const body: import("@/lib/api/endpoints/reprodutores").AtualizarReprodutorBody = {
        ...(isOwn ? {} : { nome: data.nome }),
        ...(isOwn ? {} : { raca: data.raca }),
        ...(reprodutor?.tipo === "SEMEN_EXTERNO" && data.empresa_semen ? { empresa_semen: data.empresa_semen } : {}),
        ...(data.registro ? { registro: data.registro } : {}),
        ...(data.dep_peso_desmame !== undefined ? { dep_peso_desmame: data.dep_peso_desmame } : {}),
        ...(data.dep_fertilidade !== undefined ? { dep_fertilidade: data.dep_fertilidade } : {}),
        ...(data.dep_acuracia !== undefined ? { dep_acuracia: data.dep_acuracia } : {}),
        ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
      };
      return reprodutoresApi.atualizar(reprodutor!.id, body);
    },
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["reprodutores"] });
      if (reprodutor?.id) void qc.invalidateQueries({ queryKey: ["reprodutor", reprodutor.id] });
      if (onSave) onSave(res.data);
      onClose();
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      editarMutation.mutate(data);
    } else {
      criarMutation.mutate(data);
    }
  };

  const isPending = criarMutation.isPending || editarMutation.isPending;
  const isAnimalProprio = isEdit && reprodutor?.tipo === "ANIMAL_PROPRIO";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:flex md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm hidden md:block" onClick={onClose} />
      <div className="relative bg-surface flex flex-col w-full h-full md:h-auto md:max-w-lg md:rounded-[16px] md:border md:border-line md:max-h-[90dvh] md:shadow-[var(--shadow-lg)] md:mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-green-700/10 flex items-center justify-center">
              <Dna size={16} className="text-green-700" />
            </div>
            <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
              {TITULO[mode]}
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {mode === "rapido" && (
            <p className="text-[13px] text-ink-3 bg-beige px-3 py-2 rounded-[10px]">
              O reprodutor será adicionado e já ficará disponível para seleção.
            </p>
          )}

          {/* Nome */}
          {isAnimalProprio ? (
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-ink-2">Nome</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-beige border border-line rounded-[10px] text-[14px] text-ink-3">
                <Lock size={13} className="text-ink-4 shrink-0" />
                {reprodutor?.nome}
              </div>
              <p className="text-[11px] text-ink-4">Lido do Animal vinculado (somente leitura)</p>
            </div>
          ) : (
            <Input
              label="Nome / Identificação"
              required
              placeholder="Ex: Titan Nelore, Zeus Angus"
              error={errors.nome?.message}
              {...register("nome")}
            />
          )}

          {/* Espécie e Raça */}
          <div className="grid grid-cols-2 gap-4">
            {especieLocked || isEdit ? (
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium text-ink-2">Espécie</label>
                <div
                  className="flex items-center gap-2 px-3 py-2.5 bg-beige border border-line rounded-[10px] text-[14px] text-ink-3 cursor-not-allowed"
                  title={especieLocked ? "Espécie definida pelo animal selecionado para inseminação." : "Tipo definido na criação do reprodutor."}
                >
                  <Lock size={13} className="text-ink-4 shrink-0" />
                  {especieAtual === "BOVINO" ? "🐄 Bovino" : especieAtual === "OVINO" ? "🐑 Ovino" : "🐐 Caprino"}
                </div>
                <input type="hidden" {...register("especie")} />
              </div>
            ) : (
              <Select
                label="Espécie"
                required
                options={especieOptions}
                error={errors.especie?.message}
                {...register("especie")}
              />
            )}

            {isAnimalProprio ? (
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium text-ink-2">Raça</label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-beige border border-line rounded-[10px] text-[14px] text-ink-3">
                  <Lock size={13} className="text-ink-4 shrink-0" />
                  {reprodutor?.raca}
                </div>
                <p className="text-[11px] text-ink-4">Lida dos dados genéticos do Animal</p>
              </div>
            ) : (
              <Input
                label="Raça"
                required
                placeholder="Ex: Nelore, Dorper"
                error={errors.raca?.message}
                {...register("raca")}
              />
            )}
          </div>

          {/* Tipo (read-only em edit) */}
          {isEdit ? (
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-ink-2">Tipo</label>
              <div
                className="flex items-center gap-2 px-3 py-2.5 bg-beige border border-line rounded-[10px] text-[14px] text-ink-3 cursor-not-allowed"
                title="O tipo é definido apenas na criação. Para mudar o tipo, exclua e crie um novo reprodutor."
              >
                <Lock size={13} className="text-ink-4 shrink-0" />
                {reprodutor?.tipo === "SEMEN_EXTERNO" ? "Sêmen Externo (empresa)" : "Animal Próprio / do plantel"}
              </div>
            </div>
          ) : (
            <Select
              label="Tipo"
              required
              options={tipoOptions}
              error={errors.tipo?.message}
              {...register("tipo")}
            />
          )}

          {/* Empresa fornecedora — SEMEN_EXTERNO */}
          {(!isEdit && tipo === "SEMEN_EXTERNO") || (isEdit && reprodutor?.tipo === "SEMEN_EXTERNO") ? (
            <Input
              label="Empresa / Fornecedor"
              required
              placeholder="Ex: Genética Brasil, Semex, Alta Genetics"
              error={errors.empresa_semen?.message}
              {...register("empresa_semen")}
            />
          ) : null}

          {/* Animal vinculado — ANIMAL_PROPRIO */}
          {!isEdit && tipo === "ANIMAL_PROPRIO" && (
            <Input
              label="ID do Animal vinculado"
              required
              placeholder="Ex: ani-006 ou BOV-0055"
              hint="Apenas animais machos com status ATIVA"
              error={errors.animal_id?.message}
              {...register("animal_id")}
            />
          )}
          {isEdit && isAnimalProprio && reprodutor?.animal_id && (
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-ink-2">Animal vinculado</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-beige border border-line rounded-[10px] text-[14px] text-ink-3">
                <Lock size={13} className="text-ink-4 shrink-0" />
                <span className="font-mono text-[13px]">{reprodutor.animal_id}</span>
              </div>
            </div>
          )}

          {/* Campos somente modo completo (create / edit) */}
          {isCompleto && (
            <>
              <Input
                label="Registro (ABCZ, ARCO etc.)"
                placeholder="Ex: ABCZ-2019-4471"
                hint="Número de registro na associação de raça"
                {...register("registro")}
              />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="DEP Peso Desmame"
                  placeholder="Ex: 12.4"
                  type="number"
                  step="0.1"
                  hint="kg"
                  error={errors.dep_peso_desmame?.message}
                  {...register("dep_peso_desmame")}
                />
                <Input
                  label="DEP Fertilidade"
                  placeholder="Ex: 0.78"
                  type="number"
                  step="0.01"
                  hint="0 a 1"
                  error={errors.dep_fertilidade?.message}
                  {...register("dep_fertilidade")}
                />
                <Input
                  label="DEP Acurácia"
                  placeholder="Ex: 0.85"
                  type="number"
                  step="0.01"
                  hint="0 a 1"
                  error={errors.dep_acuracia?.message}
                  {...register("dep_acuracia")}
                />
              </div>
            </>
          )}

          {/* Toggle ativo (só em edit) */}
          {isEdit && (
            <div className="flex items-center justify-between px-3 py-2.5 bg-beige rounded-[10px]">
              <div>
                <p className="text-[13px] font-medium text-ink">Reprodutor ativo</p>
                <p className="text-[12px] text-ink-4">Aparece nos selects de inseminação</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" {...register("ativo")} />
                <div className="w-9 h-5 bg-line rounded-full peer peer-checked:bg-green-700 peer-focus:ring-2 peer-focus:ring-green-700/20 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
          )}
        </form>

        {/* Rodapé */}
        <div className="flex justify-between px-5 py-3 bg-beige border-t border-line shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit(onSubmit)} loading={isPending}>
            {isEdit ? "Salvar alterações" : "Salvar Reprodutor"}
          </Button>
        </div>
      </div>
    </div>
  );
}
