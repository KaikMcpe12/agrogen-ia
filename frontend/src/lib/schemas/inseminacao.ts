import { z } from "zod";

export const createInseminacaoSchema = z.object({
  animal_id: z.string().uuid("Animal inválido"),
  reprodutor_id: z.string().uuid("Reprodutor inválido"),
  data_inseminacao: z.string().min(1, "Informe a data"),
  tipo: z.enum(["IA_CONVENCIONAL", "IA_TEMPO_FIXO", "TE"], { error: "Selecione o tipo de IA" }),
  protocolo_descricao: z.string().optional(),
  condicao_corporal_momento: z.number().int().min(1).max(5),
  temperatura_ambiente_c: z.number().optional(),
  observacoes: z.string().optional(),
});

export const editInseminacaoSchema = createInseminacaoSchema.partial();

export type CreateInseminacaoInput = z.infer<typeof createInseminacaoSchema>;
export type EditInseminacaoInput = z.infer<typeof editInseminacaoSchema>;
