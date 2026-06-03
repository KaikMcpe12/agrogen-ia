import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Beef, Search, AlertTriangle, ExternalLink, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useDebounce } from "@/hooks/useDebounce";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { reprodutoresApi } from "@/lib/api/endpoints/reprodutores";
import type { Animal } from "@/types";

/* ── Schema ─────────────────────────────────────────────────────── */

const schema = z.object({
  dep_peso_desmame: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().optional()
  ),
  dep_fertilidade: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().min(0).max(1).optional()
  ),
  dep_acuracia: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().min(0).max(1).optional()
  ),
  atualizar_status: z.boolean(),
});

type FormData = z.infer<typeof schema>;

/* ── Props ───────────────────────────────────────────────────────── */

interface Props {
  open: boolean;
  onClose: () => void;
  animalPreSelecionado?: Animal;
}

/* ── Helpers ─────────────────────────────────────────────────────── */

const ESPECIE_EMOJI: Record<string, string> = { BOVINO: "🐄", OVINO: "🐑", CAPRINO: "🐐" };

/* ── Componente ─────────────────────────────────────────────────── */

export function Modal17PromoverReprodutor({ open, onClose, animalPreSelecionado }: Props) {
  useScrollLock(open);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [animalSelecionado, setAnimalSelecionado] = useState<Animal | null>(
    animalPreSelecionado ?? null
  );
  const [jaReprodutorId, setJaReprodutorId] = useState<string | null>(null);

  const debouncedQ = useDebounce(q, 300);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({ mode: 'onBlur', reValidateMode: 'onChange',
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { atualizar_status: true },
  });

  /* Busca animais MACHO ATIVA */
  const { data: animaisData } = useQuery({
    queryKey: ["animais", "list", { sexo: "MACHO", status: "ATIVA", q: debouncedQ, limit: 10 }],
    queryFn: ({ signal }) => animaisApi.listar({ sexo: "MACHO", status: "ATIVA", q: debouncedQ || undefined, limit: 10 }, signal),
    enabled: !animalPreSelecionado && debouncedQ.length >= 2,
  });

  const machos = animaisData?.data ?? [];

  /* Quando seleciona animal, verifica se já é reprodutor */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!animalSelecionado) { setJaReprodutorId(null); return; }
    /* Verifica via listagem de reprodutores por animal_id */
    void reprodutoresApi.listar({ animal_id: animalSelecionado.id }).then((res) => {
      const existente = res.data.find((r) => r.ativo);
      setJaReprodutorId(existente?.id ?? null);
    });
    /* Pré-preenche DEPs do animal */
    if (animalSelecionado.dados_geneticos) {
      const g = animalSelecionado.dados_geneticos;
      if (g.dep_peso_desmame !== undefined) setValue("dep_peso_desmame", g.dep_peso_desmame);
      if (g.dep_fertilidade !== undefined) setValue("dep_fertilidade", g.dep_fertilidade);
      if (g.dep_acuracia !== undefined) setValue("dep_acuracia", g.dep_acuracia);
    }
  }, [animalSelecionado, setValue]);

  /* Pré-seleciona animal quando passado nas props */
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open && animalPreSelecionado) {
      setAnimalSelecionado(animalPreSelecionado);
    }
    if (!open) {
      setQ("");
      setAnimalSelecionado(animalPreSelecionado ?? null);
      setJaReprodutorId(null);
      reset({ atualizar_status: true });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, animalPreSelecionado, reset]);

  const promoverMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!animalSelecionado) throw new Error("Animal não selecionado");
      const body: Parameters<typeof reprodutoresApi.criar>[0] = {
        tipo: "ANIMAL_PROPRIO",
        animal_id: animalSelecionado.id,
        nome: animalSelecionado.nome,
        especie: animalSelecionado.especie,
        raca: animalSelecionado.raca_principal,
        ...(data.dep_peso_desmame !== undefined ? { dep_peso_desmame: data.dep_peso_desmame } : {}),
        ...(data.dep_fertilidade !== undefined ? { dep_fertilidade: data.dep_fertilidade } : {}),
        ...(data.dep_acuracia !== undefined ? { dep_acuracia: data.dep_acuracia } : {}),
      };
      const res = await reprodutoresApi.criar(body);
      if (data.atualizar_status) {
        await animaisApi.atualizar(animalSelecionado.id, { status: "REPRODUTOR_ATIVO" });
      }
      return res;
    },
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["reprodutores", "list"] });
      void qc.invalidateQueries({ queryKey: ["animais", "list"] });
      onClose();
      navigate(`/reprodutores/${res.data.id}`);
    },
  });

  const handleSelecionar = (animal: Animal) => {
    setAnimalSelecionado(animal);
    setQ(animal.nome);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden md:block" onClick={onClose} />
      <div className="relative bg-surface flex flex-col w-full h-full md:h-auto md:max-w-lg md:rounded-[16px] md:border md:border-line md:max-h-[90dvh] md:shadow-[var(--shadow-lg)] md:mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-green-700/10 flex items-center justify-center">
              <Beef size={16} className="text-green-700" />
            </div>
            <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
              Promover Animal a Reprodutor
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => promoverMutation.mutate(d))} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Bloco 1: Busca/seleção do animal */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-ink-2">
              Animal macho do rebanho <span className="text-danger">*</span>
            </label>

            {animalPreSelecionado ? (
              /* Read-only quando pré-selecionado */
              <div className="flex items-center gap-3 px-3 py-2.5 bg-beige border border-line rounded-[10px]">
                <span className="text-xl">{ESPECIE_EMOJI[animalPreSelecionado.especie] ?? "🐄"}</span>
                <div>
                  <p className="text-[14px] font-semibold text-ink">{animalPreSelecionado.nome}</p>
                  <p className="text-[12px] font-mono text-ink-4">
                    {animalPreSelecionado.codigo} · {animalPreSelecionado.raca_principal}
                  </p>
                </div>
                <Badge variant="ok" className="ml-auto">Pré-selecionado</Badge>
              </div>
            ) : (
              /* Busca livre */
              <>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => { setQ(e.target.value); if (!e.target.value) setAnimalSelecionado(null); }}
                    placeholder="Buscar por código (BOV-0001) ou nome..."
                    className="w-full pl-9 pr-3 py-2.5 text-[14px] bg-surface border border-line rounded-[10px] text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700"
                  />
                  {machos.length > 0 && !animalSelecionado && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-surface border border-line rounded-[10px] shadow-[var(--shadow-md)] z-10 overflow-hidden max-h-48 overflow-y-auto">
                      {machos.map((animal) => (
                        <button
                          key={animal.id}
                          type="button"
                          onClick={() => handleSelecionar(animal)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-beige transition-colors text-left"
                        >
                          <span className="text-lg">{ESPECIE_EMOJI[animal.especie] ?? "🐄"}</span>
                          <div>
                            <p className="text-[13px] font-semibold text-ink">{animal.nome}</p>
                            <p className="text-[11px] font-mono text-ink-4">{animal.codigo} · {animal.raca_principal}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {debouncedQ.length >= 2 && machos.length === 0 && !animalSelecionado && (
                  <p className="text-[12px] text-ink-4">
                    Nenhum macho com status ATIVA encontrado para "{debouncedQ}".
                  </p>
                )}
              </>
            )}

            {/* Banner de idempotência */}
            {jaReprodutorId && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-soft border border-amber/30 rounded-[10px]">
                <AlertTriangle size={15} className="text-amber shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-amber">Este animal já é reprodutor ativo.</p>
                  <button
                    type="button"
                    onClick={() => { onClose(); navigate(`/reprodutores/${jaReprodutorId}`); }}
                    className="text-[12px] text-amber hover:underline flex items-center gap-1 mt-0.5"
                  >
                    Ver perfil do reprodutor <ExternalLink size={11} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bloco 2: Card identidade do animal (read-only) */}
          {animalSelecionado && (
            <div className="bg-beige rounded-[10px] px-4 py-3 flex flex-col gap-1">
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.06em] mb-1">Dados do animal</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
                <div><span className="text-ink-3">Código:</span> <span className="font-mono text-ink">{animalSelecionado.codigo}</span></div>
                <div><span className="text-ink-3">Espécie:</span> <span className="text-ink">{ESPECIE_EMOJI[animalSelecionado.especie]} {animalSelecionado.especie}</span></div>
                <div><span className="text-ink-3">Raça:</span> <span className="text-ink">{animalSelecionado.raca_principal}</span></div>
                <div><span className="text-ink-3">Idade:</span> <span className="text-ink">{animalSelecionado.idade_meses} meses</span></div>
                <div><span className="text-ink-3">Peso:</span> <span className="text-ink">{animalSelecionado.peso_inicial_kg} kg</span></div>
                <div><span className="text-ink-3">CC:</span> <span className="text-ink">{animalSelecionado.condicao_corporal}</span></div>
              </div>
            </div>
          )}

          {/* Bloco 3: Confirmação/ajuste de DEPs */}
          {animalSelecionado && (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[13px] font-medium text-ink-2">DEPs do reprodutor</p>
                <p className="text-[12px] text-ink-4">Pré-preenchidos dos dados genéticos do animal. Você pode refinar esses valores específicos para uso como reprodutor.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="DEP Peso Desmame"
                  placeholder="Ex: 10.8"
                  type="number"
                  step="0.1"
                  hint="kg"
                  error={errors.dep_peso_desmame?.message}
                  {...register("dep_peso_desmame")}
                />
                <Input
                  label="DEP Fertilidade"
                  placeholder="Ex: 0.65"
                  type="number"
                  step="0.01"
                  hint="0 a 1"
                  error={errors.dep_fertilidade?.message}
                  {...register("dep_fertilidade")}
                />
                <Input
                  label="DEP Acurácia"
                  placeholder="Ex: 0.72"
                  type="number"
                  step="0.01"
                  hint="0 a 1"
                  error={errors.dep_acuracia?.message}
                  {...register("dep_acuracia")}
                />
              </div>
            </div>
          )}

          {/* Bloco 4: Toggle atualizar status do Animal */}
          {animalSelecionado && (
            <label className="flex items-start gap-3 px-3 py-3 bg-beige rounded-[10px] cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-green-700"
                {...register("atualizar_status")}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <CheckSquare size={14} className="text-green-700" />
                  <p className="text-[13px] font-medium text-ink">Marcar este animal com status REPRODUTOR_ATIVO</p>
                </div>
                <p className="text-[12px] text-ink-4 mt-0.5">
                  Ao confirmar, o animal aparecerá na lista de reprodutores do rebanho.
                </p>
              </div>
            </label>
          )}
        </form>

        {/* Rodapé */}
        <div className="flex justify-between px-5 py-3 bg-beige border-t border-line shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit((d) => promoverMutation.mutate(d))}
            loading={promoverMutation.isPending}
            disabled={!animalSelecionado || !!jaReprodutorId}
          >
            Confirmar Promoção
          </Button>
        </div>
      </div>
    </div>
  );
}
