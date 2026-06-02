import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useMutation } from "@tanstack/react-query";
import { diarioApi } from "@/lib/api/endpoints/diario";
import { useScrollLock } from "@/hooks/useScrollLock";

const schema = z.object({
  data_parto: z.string().min(1, "Obrigatório"),
  tipo_parto: z.enum(["SIMPLES", "DUPLO", "MULTIPLO"] as const),
  num_crias: z.coerce.number().int().min(1),
  num_crias_vivas: z.coerce.number().int().min(0),
  peso_total_crias_kg: z.coerce.number().optional(),
  houve_distorcia: z.enum(["true", "false"] as const),
  houve_obito_matriz: z.enum(["true", "false"] as const),
});

type FormData = z.infer<typeof schema>;

const tipoPartoOptions = [
  { value: "SIMPLES", label: "Simples (1 cria)" },
  { value: "DUPLO", label: "Duplo (2 crias)" },
  { value: "MULTIPLO", label: "Múltiplo (3+)" },
];

const simNaoOptions = [
  { value: "false", label: "Não" },
  { value: "true", label: "Sim" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  animalId: string;
  onSuccess?: () => void;
}

export function Modal07Parto({ open, onClose, animalId, onSuccess }: Props) {
  useScrollLock(open);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({ mode: 'onBlur', reValidateMode: 'onChange',
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { tipo_parto: "SIMPLES", houve_distorcia: "false", houve_obito_matriz: "false" },
  });

  const obitoMatriz = watch("houve_obito_matriz");

  const criar = useMutation({
    mutationFn: (data: FormData) =>
      diarioApi.criarParto(animalId, {
        data_parto: data.data_parto,
        tipo_parto: data.tipo_parto,
        num_crias: data.num_crias,
        num_crias_vivas: data.num_crias_vivas,
        peso_total_crias_kg: data.peso_total_crias_kg,
        houve_distorcia: data.houve_distorcia === "true",
        houve_obito_matriz: data.houve_obito_matriz === "true",
      }),
    onSuccess: () => {
      reset();
      onSuccess?.();
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface w-full flex flex-col rounded-t-[24px] md:rounded-[16px] md:max-w-md md:border md:border-line md:shadow-[var(--shadow-lg)] md:mx-4 max-h-[85dvh] md:max-h-[90dvh]">
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Registrar Parto
          </h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => criar.mutate(d))} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data do parto" type="date" required error={errors.data_parto?.message} {...register("data_parto")} />
            <Select label="Tipo de parto" required options={tipoPartoOptions} error={errors.tipo_parto?.message} {...register("tipo_parto")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nº de crias" type="number" required placeholder="1" error={errors.num_crias?.message} {...register("num_crias")} />
            <Input label="Crias vivas" type="number" required placeholder="1" error={errors.num_crias_vivas?.message} {...register("num_crias_vivas")} />
          </div>
          <Input label="Peso total das crias (kg)" type="number" placeholder="Opcional" {...register("peso_total_crias_kg")} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Houve distócia?" required options={simNaoOptions} {...register("houve_distorcia")} />
            <Select label="Óbito da matriz?" required options={simNaoOptions} {...register("houve_obito_matriz")} />
          </div>
          {obitoMatriz === "true" && (
            <div className="flex gap-3 p-3 rounded-[12px] bg-danger-bg border border-danger/20">
              <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-danger">Óbito da matriz</p>
                <p className="text-[12px] text-danger/80 mt-0.5">
                  Ao salvar, o status do animal será atualizado para <strong>Descartada</strong> automaticamente.
                </p>
              </div>
            </div>
          )}
        </form>

        <div className="flex justify-end gap-2 px-5 py-3 bg-beige border-t border-line shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit((d) => criar.mutate(d))} loading={criar.isPending}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
