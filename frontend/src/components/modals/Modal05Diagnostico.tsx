import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inseminacoesApi } from "@/lib/api/endpoints/inseminacoes";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { Inseminacao } from "@/types";

const schema = z.object({
  data_diagnostico: z.string().min(1, "Obrigatório"),
  metodo: z.enum(["PALPACAO_RETAL", "ULTRASSONOGRAFIA", "EXAME_LABORATORIAL"] as const),
  resultado: z.enum(["PRENHA", "VAZIA", "INCONCLUSIVO"] as const),
  data_parto_prevista: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  inseminacao: Inseminacao | null;
}

const metodoOptions = [
  { value: "ULTRASSONOGRAFIA", label: "Ultrassonografia" },
  { value: "PALPACAO_RETAL", label: "Palpação Retal" },
  { value: "EXAME_LABORATORIAL", label: "Exame Laboratorial" },
];
const resultadoOptions = [
  { value: "PRENHA", label: "✅ Prenha" },
  { value: "VAZIA", label: "❌ Vazia" },
  { value: "INCONCLUSIVO", label: "⚠️ Inconclusivo" },
];

const DIAS_GESTACAO: Record<string, number> = { BOVINO: 285, OVINO: 150, CAPRINO: 150 };

function calcDataParto(dataInseminacao: string, especie: string): string {
  const base = new Date(dataInseminacao);
  if (isNaN(base.getTime())) return "";
  const dias = DIAS_GESTACAO[especie] ?? 285;
  base.setDate(base.getDate() + dias);
  return base.toISOString().split("T")[0] ?? "";
}

export function Modal05Diagnostico({ open, onClose, inseminacao }: Props) {
  useScrollLock(open && !!inseminacao);

  const dataPrevista = inseminacao
    ? calcDataParto(inseminacao.data_inseminacao, inseminacao.animal.especie)
    : "";

  const qc = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({ mode: 'onBlur', reValidateMode: 'onChange',
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { metodo: "ULTRASSONOGRAFIA" },
  });
  // eslint-disable-next-line react-hooks/incompatible-library
  const resultado = watch("resultado");

  useEffect(() => {
    if (resultado === "PRENHA" && dataPrevista) {
      setValue("data_parto_prevista", dataPrevista);
    }
  }, [resultado, dataPrevista, setValue]);

  const registerDiag = useMutation({
    mutationFn: (data: FormData) =>
      inseminacoesApi.registrarDiagnostico(inseminacao!.id, {
        data_diagnostico: data.data_diagnostico,
        metodo: data.metodo,
        resultado: data.resultado,
        observacoes: data.observacoes,
        ...(resultado === "PRENHA" && data.data_parto_prevista
          ? { data_parto_prevista: data.data_parto_prevista }
          : {}),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["inseminacoes", "list"] });
      void qc.invalidateQueries({ queryKey: ["inseminacoes", "pendentes-diagnostico"] });
      void qc.invalidateQueries({ queryKey: ["alertas", "list"] });
      void qc.invalidateQueries({ queryKey: ["alertas", "contagem"] });
      onClose();
    },
  });

  if (!open || !inseminacao) return null;

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden md:block" onClick={onClose} />
      <div className="relative bg-surface flex flex-col w-full h-full md:h-auto md:max-w-lg md:rounded-[16px] md:border md:border-line md:max-h-[90dvh] md:shadow-[var(--shadow-lg)] md:mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Registrar Diagnóstico de Gestação
          </h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Context */}
        <div className="px-5 py-3 bg-green-100/50 border-b border-line shrink-0">
          <p className="text-[13px] text-ink-2">
            <strong>{inseminacao.animal.nome}</strong> ({inseminacao.animal.codigo}) ·{" "}
            Inseminação em {new Date(inseminacao.data_inseminacao).toLocaleDateString("pt-BR")} ·{" "}
            {inseminacao.tipo} · {inseminacao.dias_decorridos} dias decorridos
          </p>
        </div>

        <form onSubmit={handleSubmit((d) => registerDiag.mutate(d))} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <Input label="Data do diagnóstico" type="date" required error={errors.data_diagnostico?.message} {...register("data_diagnostico")} />
          <Select label="Método" required options={metodoOptions} error={errors.metodo?.message} {...register("metodo")} />
          <Select label="Resultado" required options={resultadoOptions} error={errors.resultado?.message} {...register("resultado")} />
          {resultado === "PRENHA" && (
            <Input label="Data prevista do parto" type="date" hint="Auto-calculada conforme espécie" {...register("data_parto_prevista")} />
          )}
          <div>
            <label className="text-[13px] font-medium text-ink-2 block mb-1.5">Observações</label>
            <textarea
              {...register("observacoes")}
              rows={3}
              className="w-full px-3 py-2.5 rounded-[10px] border border-line text-[14px] text-ink bg-surface resize-none outline-none focus:border-green-700 focus:ring-[3px] focus:ring-green-700/18 transition-all placeholder:text-ink-4"
              placeholder="Observações do exame…"
            />
          </div>
        </form>

        <div className="flex justify-end gap-2 px-5 py-3 bg-beige border-t border-line shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit((d) => registerDiag.mutate(d))} loading={registerDiag.isPending}>
            Confirmar diagnóstico
          </Button>
        </div>
      </div>
    </div>
  );
}
