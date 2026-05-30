import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Dna } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { Reprodutor, Especie } from "@/types";

const schema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres"),
  especie: z.enum(["BOVINO", "OVINO", "CAPRINO"] as const),
  raca: z.string().min(1, "Obrigatório"),
  tipo: z.enum(["SEMEN_EXTERNO", "ANIMAL_PROPRIO"] as const),
  empresa_semen: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (reprodutor: Reprodutor) => void;
  especiePreferida?: Especie;
}

const especieOptions = [
  { value: "BOVINO", label: "🐄 Bovino" },
  { value: "OVINO", label: "🐑 Ovino" },
  { value: "CAPRINO", label: "🐐 Caprino" },
];

const tipoOptions = [
  { value: "SEMEN_EXTERNO", label: "Sêmen externo (empresa)" },
  { value: "ANIMAL_PROPRIO", label: "Animal próprio / do plantel" },
];

export function Modal04ReprodutorRapido({ open, onClose, onSave, especiePreferida }: Props) {
  useScrollLock(open);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { especie: especiePreferida ?? "BOVINO", tipo: "SEMEN_EXTERNO" },
  });

  const tipo = watch("tipo");

  const onSubmit = (data: FormData) => {
    const novoReprodutor: Reprodutor = {
      id: `rep-new-${Date.now()}`,
      nome: data.nome,
      especie: data.especie,
      raca: data.raca,
      tipo: data.tipo,
      ...(data.empresa_semen ? { empresa_semen: data.empresa_semen } : {}),
    };
    onSave(novoReprodutor);
    reset();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:flex md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm hidden md:block" onClick={onClose} />
      <div className="relative bg-surface flex flex-col w-full h-full md:h-auto md:max-w-md md:rounded-[16px] md:border md:border-line md:max-h-[90dvh] md:shadow-[var(--shadow-lg)] md:mx-4">

        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-green-700/10 flex items-center justify-center">
              <Dna size={16} className="text-green-700" />
            </div>
            <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
              Cadastro Rápido de Reprodutor
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <p className="text-[13px] text-ink-3 bg-beige px-3 py-2 rounded-[10px]">
            O reprodutor será adicionado e já ficará disponível para seleção.
          </p>

          <Input label="Nome / Identificação" required placeholder="Ex: Titan Nelore, Zeus Angus" error={errors.nome?.message} {...register("nome")} />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Espécie" required options={especieOptions} error={errors.especie?.message} {...register("especie")} />
            <Input label="Raça" required placeholder="Ex: Nelore, Dorper" error={errors.raca?.message} {...register("raca")} />
          </div>

          <Select label="Tipo" required options={tipoOptions} error={errors.tipo?.message} {...register("tipo")} />

          {tipo === "SEMEN_EXTERNO" && (
            <Input
              label="Empresa / Fornecedor"
              placeholder="Ex: Genética Brasil, Semex"
              {...register("empresa_semen")}
            />
          )}
        </form>

        <div className="flex justify-between px-5 py-3 bg-beige border-t border-line shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit(onSubmit)}>
            Salvar Reprodutor
          </Button>
        </div>
      </div>
    </div>
  );
}
