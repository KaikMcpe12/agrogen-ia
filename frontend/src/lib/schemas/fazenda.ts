import { z } from "zod";

export const createFazendaSchema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres").max(100),
  documento: z.string().optional(),
  endereco: z.string().optional(),
  area_hectares: z.number().positive("Área deve ser positiva").optional(),
  especie_principal: z.enum(["BOVINO", "OVINO", "CAPRINO"]).optional(),
});

export const editFazendaSchema = createFazendaSchema.partial();

export type CreateFazendaInput = z.infer<typeof createFazendaSchema>;
export type EditFazendaInput = z.infer<typeof editFazendaSchema>;
