import { z } from "zod";

export const createReprodutorSchema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres").max(100),
  especie: z.enum(["BOVINO", "OVINO", "CAPRINO"], { error: "Selecione a espécie" }),
  raca: z.string().min(1, "Informe a raça"),
  tipo: z.enum(["SEMEN_EXTERNO", "ANIMAL_PROPRIO"], { error: "Selecione o tipo" }),
  animal_id: z.string().uuid().optional(),
  registro: z.string().optional(),
  empresa_semen: z.string().optional(),
  dep_peso_desmame: z.number().optional(),
  dep_fertilidade: z.number().optional(),
  dep_acuracia: z.number().min(0).max(1).optional(),
  ativo: z.boolean().default(true),
  fazenda_id: z.string().uuid().optional(),
});

export const editReprodutorSchema = createReprodutorSchema.partial();

export type CreateReprodutorInput = z.infer<typeof createReprodutorSchema>;
export type EditReprodutorInput = z.infer<typeof editReprodutorSchema>;
