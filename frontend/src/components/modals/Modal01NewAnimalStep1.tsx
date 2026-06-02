import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { Animal } from "@/types";

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
  mode?: "create" | "edit";
  animal?: Animal;
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
const ccOptions = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: `${n} — ${["Muito magro", "Magro", "Ideal", "Gordo", "Muito gordo"][n - 1]}`,
}));

export function Modal01NewAnimalStep1({ open, onClose, onNext, mode = "create", animal }: Props) {
  useScrollLock(open);

  const isEdit = mode === "edit";

  const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({ mode: 'onBlur', reValidateMode: 'onChange',
    resolver: zodResolver(schema) as Resolver<Step1Data>,
    defaultValues: isEdit && animal
      ? {
          especie: animal.especie,
          nome: animal.nome,
          sexo: animal.sexo,
          data_nascimento: animal.data_nascimento.split("T")[0] ?? "",
          peso_inicial_kg: animal.peso_inicial_kg,
          condicao_corporal: animal.condicao_corporal,
        }
      : { especie: "BOVINO", sexo: "FEMEA", condicao_corporal: 3 },
  });

  const onSubmit = (data: Step1Data) => onNext(data);

  if (!open) return null;

  const title = isEdit
    ? `Editar Animal — ${animal?.codigo ?? ""}`
    : "Novo Animal — Identificação";

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden md:block" onClick={onClose} />
      <div className="relative bg-surface flex flex-col w-full h-full md:h-auto md:max-w-lg md:rounded-[16px] md:border md:border-line md:max-h-[90dvh] md:shadow-[var(--shadow-lg)] md:mx-4">

        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <p className="text-[12px] font-mono text-ink-4">Passo 1 de 2</p>
            <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
              {title}
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige" aria-label="Fechar">
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

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Espécie: read-only em modo edit (Adendo FLUXO-08) */}
            {isEdit ? (
              <div>
                <p className="text-[13px] font-medium text-ink-2 mb-1">Espécie</p>
                <div className="px-3 py-2.5 rounded-[10px] border border-line bg-beige text-[14px] text-ink-3">
                  {animal?.especie}
                </div>
              </div>
            ) : (
              <Select label="Espécie" required options={especieOptions} error={errors.especie?.message} {...register("especie")} />
            )}
            <Select label="Sexo" required options={sexoOptions} error={errors.sexo?.message} {...register("sexo")} />
          </div>

          {isEdit && (
            <div>
              <p className="text-[13px] font-medium text-ink-2 mb-1">Código</p>
              <div className="px-3 py-2.5 rounded-[10px] border border-line bg-beige text-[14px] font-mono text-ink-3">
                {animal?.codigo}
              </div>
            </div>
          )}

          <Input label="Nome" required placeholder="Ex: Mimosa" error={errors.nome?.message} {...register("nome")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data de nascimento" type="date" required error={errors.data_nascimento?.message} {...register("data_nascimento")} />
            <Input label="Peso (kg)" type="number" required placeholder="Ex: 380" error={errors.peso_inicial_kg?.message} {...register("peso_inicial_kg")} />
          </div>
          <Select label="Condição corporal (1–5)" required options={ccOptions} error={errors.condicao_corporal?.message} {...register("condicao_corporal")} />
          <Input label="Brinco / Tatuagem" placeholder="Opcional" {...register("brinca")} />
        </form>

        <div className="flex justify-between px-5 py-3 bg-beige border-t border-line shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit(onSubmit)}>
            Próximo — Dados Genéticos →
          </Button>
        </div>
      </div>
    </div>
  );
}
