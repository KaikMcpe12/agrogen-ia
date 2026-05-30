import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { animaisApi } from "@/lib/api/endpoints/animais";
import type { Step1Data } from "./Modal01NewAnimalStep1";
import { useScrollLock } from "@/hooks/useScrollLock";

const schema = z.object({
  raca_principal: z.string().min(1, "Obrigatório"),
  raca_pai: z.string().optional(),
  raca_mae: z.string().optional(),
  dep_peso_desmame: z.coerce.number().optional(),
});

type Step2Data = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  step1Data: Step1Data | null;
}

export function Modal02NewAnimalStep2({ open, onClose, onBack, step1Data }: Props) {
  useScrollLock(open);

  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<Step2Data>({
    resolver: zodResolver(schema) as Resolver<Step2Data>,
  });

  const createAnimal = useMutation({
    mutationFn: (data: Step2Data) =>
      animaisApi.criar({
        ...step1Data,
        dados_geneticos: {
          raca_principal: data.raca_principal,
          raca_pai: data.raca_pai,
          raca_mae: data.raca_mae,
          dep_peso_desmame: data.dep_peso_desmame,
        },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["animais"] });
      onClose();
    },
  });

  const onSubmit = (data: Step2Data) => createAnimal.mutate(data);
  const onSkip = () => createAnimal.mutate({ raca_principal: step1Data?.especie === "BOVINO" ? "Nelore" : step1Data?.especie === "OVINO" ? "Dorper" : "Boer" });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden md:block" onClick={onClose} />
      <div className="relative bg-surface flex flex-col w-full h-full md:h-auto md:max-w-lg md:rounded-[16px] md:border md:border-line md:max-h-[90dvh] md:shadow-[var(--shadow-lg)] md:mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <p className="text-[12px] font-mono text-ink-4">Passo 2 de 2</p>
            <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
              Novo Animal — Dados Genéticos
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige">
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center px-5 pt-4 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-[34px] h-[34px] rounded-full bg-green-100 border-2 border-green-700 text-green-900 text-[14px] font-bold flex items-center justify-center">✓</div>
            <span className="text-[13px] font-medium text-ink-3">Identificação</span>
          </div>
          <div className="flex-1 h-0.5 bg-green-700 mx-2" />
          <div className="flex items-center gap-2">
            <div className="w-[34px] h-[34px] rounded-full bg-green-900 text-white text-[14px] font-bold flex items-center justify-center">2</div>
            <span className="text-[13px] font-semibold text-ink">Genética</span>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <p className="text-[13px] text-ink-3">
            Campos opcionais — pode pular se não tiver as informações genéticas agora.
          </p>
          <Input label="Raça principal" required placeholder="Ex: Nelore, Dorper, Boer" error={errors.raca_principal?.message} {...register("raca_principal")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Raça do pai" placeholder="Opcional" {...register("raca_pai")} />
            <Input label="Raça da mãe" placeholder="Opcional" {...register("raca_mae")} />
          </div>
          <Input label="DEP Peso Desmame" type="number" placeholder="Opcional (ex: 8.2)" {...register("dep_peso_desmame")} />
        </div>

        {/* Footer */}
        <div className="flex justify-between px-5 py-3 bg-beige border-t border-line shrink-0">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>← Voltar</Button>
            <Button variant="secondary" size="sm" onClick={onSkip} loading={createAnimal.isPending}>
              Salvar e Pular
            </Button>
          </div>
          <Button variant="primary" size="sm" onClick={handleSubmit(onSubmit)} loading={createAnimal.isPending}>
            Salvar Animal
          </Button>
        </div>
      </div>
    </div>
  );
}
