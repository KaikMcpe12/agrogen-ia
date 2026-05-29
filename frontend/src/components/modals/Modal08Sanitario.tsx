import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useMutation } from "@tanstack/react-query";
import { diarioApi } from "@/lib/api/endpoints/diario";

const schema = z.object({
  tipo: z.enum(["VACINA", "VERMIFUGACAO", "MEDICACAO", "EXAME"] as const),
  produto: z.string().min(1, "Obrigatório"),
  principio_ativo: z.string().optional(),
  data_aplicacao: z.string().min(1, "Obrigatório"),
  dose: z.string().optional(),
  via: z.enum(["IM", "IV", "VO", "SC", "TOPICA", "ORAL", ""] as const).optional(),
  lote_produto: z.string().optional(),
  proxima_dose: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const tipoOptions = [
  { value: "VACINA", label: "Vacina" },
  { value: "VERMIFUGACAO", label: "Vermifugação" },
  { value: "MEDICACAO", label: "Medicação" },
  { value: "EXAME", label: "Exame" },
];

const viaOptions = [
  { value: "", label: "Não informado" },
  { value: "IM", label: "IM — Intramuscular" },
  { value: "IV", label: "IV — Intravenosa" },
  { value: "VO", label: "VO — Via oral" },
  { value: "SC", label: "SC — Subcutânea" },
  { value: "TOPICA", label: "Tópica" },
  { value: "ORAL", label: "Oral" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  animalId: string;
  onSuccess?: () => void;
}

export function Modal08Sanitario({ open, onClose, animalId, onSuccess }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { tipo: "VACINA" },
  });

  const criar = useMutation({
    mutationFn: (data: FormData) =>
      diarioApi.criarEventoSanitario(animalId, {
        tipo: data.tipo,
        produto: data.produto,
        data_aplicacao: data.data_aplicacao,
        principio_ativo: data.principio_ativo,
        dose: data.dose,
        ...(data.via ? { via: data.via } : {}),
        lote_produto: data.lote_produto,
        proxima_dose: data.proxima_dose,
      }),
    onSuccess: () => {
      reset();
      onSuccess?.();
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-[16px] border border-line overflow-hidden shadow-[var(--shadow-lg)] max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Registrar Evento Sanitário
          </h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => criar.mutate(d))} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" required options={tipoOptions} error={errors.tipo?.message} {...register("tipo")} />
            <Input label="Data de aplicação" type="date" required error={errors.data_aplicacao?.message} {...register("data_aplicacao")} />
          </div>
          <Input label="Produto" required placeholder="Ex: Aftovac, Ivomec" error={errors.produto?.message} {...register("produto")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Princípio ativo" placeholder="Opcional" {...register("principio_ativo")} />
            <Input label="Dose" placeholder="Ex: 2 mL" {...register("dose")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Via" options={viaOptions} {...register("via")} />
            <Input label="Lote do produto" placeholder="Opcional" {...register("lote_produto")} />
          </div>
          <Input label="Próxima dose" type="date" hint="Cria alerta automaticamente" {...register("proxima_dose")} />
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
