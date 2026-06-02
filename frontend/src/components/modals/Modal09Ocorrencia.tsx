import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useMutation } from "@tanstack/react-query";
import { diarioApi } from "@/lib/api/endpoints/diario";
import { useScrollLock } from "@/hooks/useScrollLock";

const schema = z.object({
  data: z.string().min(1, "Obrigatório"),
  categoria: z.enum(["SAUDE", "MANEJO", "COMPORTAMENTO", "OUTRO"] as const),
  titulo: z.string().min(2, "Mínimo 2 caracteres"),
  descricao: z.string().min(3, "Descreva a ocorrência"),
  resolvida: z.enum(["true", "false"] as const),
});

type FormData = z.infer<typeof schema>;

const categoriaOptions = [
  { value: "SAUDE", label: "Saúde" },
  { value: "MANEJO", label: "Manejo" },
  { value: "COMPORTAMENTO", label: "Comportamento" },
  { value: "OUTRO", label: "Outro" },
];

const resolvidaOptions = [
  { value: "false", label: "Em aberto" },
  { value: "true", label: "Resolvida" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  animalId: string;
  onSuccess?: () => void;
}

export function Modal09Ocorrencia({ open, onClose, animalId, onSuccess }: Props) {
  useScrollLock(open);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ mode: 'onBlur', reValidateMode: 'onChange',
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { categoria: "SAUDE", resolvida: "false" },
  });

  const criar = useMutation({
    mutationFn: (data: FormData) =>
      diarioApi.criarOcorrencia(animalId, {
        data: data.data,
        categoria: data.categoria,
        titulo: data.titulo,
        descricao: data.descricao,
        resolvida: data.resolvida === "true",
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
            Registrar Ocorrência
          </h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => criar.mutate(d))} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data" type="date" required error={errors.data?.message} {...register("data")} />
            <Select label="Categoria" required options={categoriaOptions} error={errors.categoria?.message} {...register("categoria")} />
          </div>
          <Input label="Título" required placeholder="Descreva brevemente" error={errors.titulo?.message} {...register("titulo")} />
          <div>
            <label className="text-[13px] font-medium text-ink-2 block mb-1.5">
              Descrição <span className="text-danger">*</span>
            </label>
            <textarea
              {...register("descricao")}
              rows={3}
              className="w-full px-3 py-2.5 rounded-[10px] border border-line text-[14px] text-ink bg-surface resize-none outline-none focus:border-green-700 focus:ring-[3px] focus:ring-green-700/18 transition-all placeholder:text-ink-4"
              placeholder="Descreva a ocorrência em detalhes…"
            />
            {errors.descricao && <p className="text-[12px] text-danger mt-1">{errors.descricao.message}</p>}
          </div>
          <Select label="Status" required options={resolvidaOptions} {...register("resolvida")} />
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
