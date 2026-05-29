import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  especie: z.enum(["BOVINO", "OVINO", "CAPRINO"] as const),
  nome: z.string().min(2, "Mínimo 2 caracteres"),
  sexo: z.enum(["FEMEA", "MACHO"] as const),
  data_nascimento: z.string().min(1, "Obrigatório"),
  peso_inicial_kg: z.coerce.number().min(1, "Obrigatório"),
  condicao_corporal: z.coerce.number().min(1).max(5),
  brinca: z.string().optional(),
});

export type Step1Data = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onNext: (data: Step1Data) => void;
}

const especieOptions = [
  { value: "BOVINO", label: "🐄 Bovino" },
  { value: "OVINO", label: "🐑 Ovino" },
  { value: "CAPRINO", label: "🐐 Caprino" },
];
const sexoOptions = [
  { value: "FEMEA", label: "♀ Fêmea" },
  { value: "MACHO", label: "♂ Macho" },
];
const ccOptions = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} — ${["Muito magro", "Magro", "Ideal", "Gordo", "Muito gordo"][n - 1]}` }));

export function Modal01NewAnimalStep1({ open, onClose, onNext }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(schema) as Resolver<Step1Data>,
    defaultValues: { especie: "BOVINO", sexo: "FEMEA", condicao_corporal: 3 },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-[16px] border border-line overflow-hidden shadow-[var(--shadow-lg)] max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <p className="text-[12px] font-mono text-ink-4">Passo 1 de 2</p>
            <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
              Novo Animal — Identificação
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige">
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center px-5 pt-4 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-[34px] h-[34px] rounded-full bg-green-900 text-white text-[14px] font-bold flex items-center justify-center">1</div>
            <span className="text-[13px] font-semibold text-ink">Identificação</span>
          </div>
          <div className="flex-1 h-0.5 bg-line mx-2" />
          <div className="flex items-center gap-2">
            <div className="w-[34px] h-[34px] rounded-full bg-beige border-2 border-line text-[14px] font-bold text-ink-3 flex items-center justify-center">2</div>
            <span className="text-[13px] font-medium text-ink-3">Genética</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onNext)} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Espécie" required options={especieOptions} error={errors.especie?.message} {...register("especie")} />
            <Select label="Sexo" required options={sexoOptions} error={errors.sexo?.message} {...register("sexo")} />
          </div>
          <Input label="Nome" required placeholder="Ex: Mimosa" error={errors.nome?.message} {...register("nome")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data de nascimento" type="date" required error={errors.data_nascimento?.message} {...register("data_nascimento")} />
            <Input label="Peso inicial (kg)" type="number" required placeholder="Ex: 38" error={errors.peso_inicial_kg?.message} {...register("peso_inicial_kg")} />
          </div>
          <Select label="Condição corporal (1–5)" required options={ccOptions} error={errors.condicao_corporal?.message} {...register("condicao_corporal")} />
          <Input label="Brinco / Tatuagem" placeholder="Opcional" {...register("brinca")} />
        </form>

        {/* Footer */}
        <div className="flex justify-between px-5 py-3 bg-beige border-t border-line shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit(onNext)}>
            Próximo — Dados Genéticos →
          </Button>
        </div>
      </div>
    </div>
  );
}
