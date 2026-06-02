import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Tractor } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fazendasApi } from "@/lib/api/endpoints/fazendas";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { Fazenda, TipoProducao } from "@/types";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const schema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres"),
  municipio: z.string().min(2, "Obrigatório"),
  estado: z.string().min(2, "Selecione um estado"),
  area_hectares: z.coerce.number().optional(),
  tipo_producao: z.enum(["CORTE", "LEITE", "MISTA", "OUTRO"] as const).optional(),
  capacidade_rebanho: z.coerce.number().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  ativa: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  fazenda?: Fazenda;
  onSuccess?: () => void;
}

const tipoProducaoOptions: { value: TipoProducao; label: string }[] = [
  { value: "CORTE", label: "Corte" },
  { value: "LEITE", label: "Leite" },
  { value: "MISTA", label: "Mista (Corte + Leite)" },
  { value: "OUTRO", label: "Outro" },
];

const estadoOptions = ESTADOS_BR.map((e) => ({ value: e, label: e }));

export function Modal11FazendaForm({ open, onClose, mode, fazenda, onSuccess }: Props) {
  useScrollLock(open);

  const qc = useQueryClient();
  const isEdit = mode === "edit";

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ mode: 'onBlur', reValidateMode: 'onChange',
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: isEdit && fazenda
      ? {
          nome: fazenda.nome,
          municipio: fazenda.municipio,
          estado: fazenda.estado,
          area_hectares: fazenda.area_hectares,
          tipo_producao: fazenda.tipo_producao,
          capacidade_rebanho: fazenda.capacidade_rebanho,
          lat: fazenda.lat,
          lng: fazenda.lng,
          ativa: fazenda.ativa ?? false,
        }
      : { ativa: true },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: Partial<import("@/types").Fazenda> = {
        nome: data.nome,
        municipio: data.municipio,
        estado: data.estado,
      };
      if (data.area_hectares !== undefined) payload.area_hectares = data.area_hectares;
      if (data.tipo_producao) payload.tipo_producao = data.tipo_producao;
      if (data.capacidade_rebanho !== undefined) payload.capacidade_rebanho = data.capacidade_rebanho;
      if (data.lat !== undefined) payload.lat = data.lat;
      if (data.lng !== undefined) payload.lng = data.lng;
      if (data.ativa !== undefined) payload.ativa = data.ativa;
      if (isEdit && fazenda) return fazendasApi.atualizar(fazenda.id, payload);
      return fazendasApi.criar(payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["fazendas", "list"] });
      void qc.invalidateQueries({ queryKey: ["usuarios", "me"] });
      reset();
      onSuccess?.();
      onClose();
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden md:block" onClick={onClose} />
      <div className="relative bg-surface flex flex-col w-full h-full md:h-auto md:max-w-lg md:rounded-[16px] md:border md:border-line md:max-h-[90dvh] md:shadow-[var(--shadow-lg)] md:mx-4">

        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-green-700/10 flex items-center justify-center">
              <Tractor size={16} className="text-green-700" />
            </div>
            <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
              {isEdit ? `Editar Fazenda — ${fazenda?.nome ?? ""}` : "Nova Fazenda"}
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <Input label="Nome da fazenda" required placeholder="Ex: Fazenda São João" error={errors.nome?.message} {...register("nome")} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Município" required placeholder="Ex: Sobral" error={errors.municipio?.message} {...register("municipio")} />
            <Select label="Estado (UF)" required options={estadoOptions} error={errors.estado?.message} {...register("estado")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Área (hectares)" type="number" placeholder="Ex: 500" {...register("area_hectares")} />
            <Input label="Capacidade do rebanho" type="number" placeholder="Ex: 300" {...register("capacidade_rebanho")} />
          </div>

          <Select label="Tipo de produção" options={[{ value: "", label: "Selecionar…" }, ...tipoProducaoOptions]} {...register("tipo_producao")} />

          <div className="border-t border-line pt-4">
            <p className="text-[12px] font-semibold text-ink-4 uppercase tracking-[0.06em] mb-3">Localização (opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Latitude" type="number" placeholder="-3.7327" {...register("lat")} />
              <Input label="Longitude" type="number" placeholder="-40.3560" {...register("lng")} />
            </div>
          </div>

          <label className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] border border-line hover:bg-beige cursor-pointer">
            <input type="checkbox" {...register("ativa")} className="w-4 h-4 accent-green-700" />
            <div>
              <p className="text-[14px] font-medium text-ink">Definir como fazenda ativa</p>
              <p className="text-[12px] text-ink-4">Dashboards e relatórios usarão esta fazenda por padrão.</p>
            </div>
          </label>
        </form>

        <div className="flex justify-between px-5 py-3 bg-beige border-t border-line shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit(onSubmit)} loading={mutation.isPending}>
            {isEdit ? "Salvar Alterações" : "Criar Fazenda"}
          </Button>
        </div>
      </div>
    </div>
  );
}
