import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inseminacoesApi } from "@/lib/api/endpoints/inseminacoes";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { useDebounce } from "@/hooks/useDebounce";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { TipoInseminacao } from "@/types";

const schema = z.object({
  animal_id: z.string().min(1, "Selecione um animal"),
  reprodutor_id: z.string().min(1, "Selecione um reprodutor"),
  data_inseminacao: z.string().min(1, "Obrigatório"),
  tipo: z.enum(["IA_CONVENCIONAL", "IATF", "TE"] as const),
  protocolo_descricao: z.string().optional(),
  condicao_corporal_momento: z.coerce.number().min(1).max(5),
  temperatura_ambiente_c: z.coerce.number().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const tipoOptions: { value: TipoInseminacao; label: string }[] = [
  { value: "IA_CONVENCIONAL", label: "IA Convencional" },
  { value: "IATF", label: "IATF (Tempo Fixo)" },
  { value: "TE", label: "TE (Transferência de Embrião)" },
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
  const [animalSearch, setAnimalSearch] = useState("");
  const debouncedSearch = useDebounce(animalSearch, 400);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      tipo: "IATF",
      condicao_corporal_momento: 3,
      animal_id: preselectedAnimalId ?? "",
    },
  });

  const tipo = watch("tipo");
  const animalId = watch("animal_id");

  const { data: animaisData } = useQuery({
    queryKey: ["animais-search", debouncedSearch],
    queryFn: () => animaisApi.listar({ q: debouncedSearch, sexo: "FEMEA", status: "ATIVA", limit: 10 }),
    enabled: debouncedSearch.length > 1 && !preselectedAnimalId,
  });

  const { data: reprodutoresData } = useQuery({
    queryKey: ["reprodutores"],
    queryFn: () => import("@/lib/api/mocks/dados").then((m) => ({ data: m.reprodutores })),
  });

  const criar = useMutation({
    mutationFn: inseminacoesApi.criar,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["inseminacoes"] });
      void qc.invalidateQueries({ queryKey: ["alertas"] });
      onClose();
    },
  });

  if (!open) return null;

  const animaisSugestoes = animaisData?.data ?? [];
  const reprodutores = (reprodutoresData?.data ?? []).map((r) => ({ value: r.id, label: `${r.nome} (${r.raca})` }));

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
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden md:block" onClick={onClose} />
      <div className="relative bg-surface flex flex-col w-full h-full md:h-auto md:max-w-lg md:rounded-[16px] md:border md:border-line md:max-h-[90dvh] md:shadow-[var(--shadow-lg)] md:mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Nova Inseminação
          </h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Animal search */}
          {!preselectedAnimalId ? (
            <div>
              <Input
                label="Animal (Fêmea)"
                required
                placeholder="Buscar por nome ou código…"
                value={animalSearch}
                onChange={(e) => setAnimalSearch(e.target.value)}
              />
              {animaisSugestoes.length > 0 && animalSearch && !animalId && (
                <div className="mt-1 border border-line rounded-[10px] bg-surface overflow-hidden">
                  {animaisSugestoes.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-beige transition-colors border-b border-line last:border-0"
                      onClick={() => { setValue("animal_id", a.id); setAnimalSearch(`${a.nome} (${a.codigo})`); }}
                    >
                      <strong>{a.nome}</strong> <span className="font-mono text-ink-4">{a.codigo}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.animal_id && <p className="text-[12px] text-danger mt-1">{errors.animal_id.message}</p>}
              <input type="hidden" {...register("animal_id")} />
            </div>
          ) : (
            <input type="hidden" {...register("animal_id")} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Data e hora" type="datetime-local" required error={errors.data_inseminacao?.message} {...register("data_inseminacao")} />
            <Select label="Tipo de IA" required options={tipoOptions} error={errors.tipo?.message} {...register("tipo")} />
          </div>

          {tipo === "IATF" && (
            <Input label="Protocolo hormonal" placeholder="Ex: P4+EB Dia 0" {...register("protocolo_descricao")} />
          )}

          <Select
            label="Reprodutor / Sêmen"
            required
            options={reprodutores}
            placeholder="Selecionar reprodutor"
            error={errors.reprodutor_id?.message}
            {...register("reprodutor_id")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Condição corporal" required options={ccOptions} error={errors.condicao_corporal_momento?.message} {...register("condicao_corporal_momento")} />
            <Input label="Temperatura (°C)" type="number" placeholder="Opcional" {...register("temperatura_ambiente_c")} />
          </div>

          <div className="flex gap-2 p-3 rounded-[10px] bg-warn-bg border border-warn/20">
            <AlertTriangle size={16} className="text-warn shrink-0 mt-0.5" />
            <p className="text-[13px] text-warn">
              Verifique o intervalo mínimo entre inseminações (21 dias para bovinos).
            </p>
          </div>

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

        <div className="flex justify-end gap-2 px-5 py-3 bg-beige border-t border-line shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit(onSubmit)} loading={criar.isPending}>
            Registrar inseminação
          </Button>
        </div>
      </div>
    </div>
  );
}
