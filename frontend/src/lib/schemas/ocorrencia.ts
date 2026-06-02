import { z } from "zod";

export const createOcorrenciaSchema = z.object({
  animalId: z.string().uuid(),
  data: z.string().min(1, "Informe a data"),
  categoria: z.enum(["DOENCA", "ACIDENTE", "COMPORTAMENTO", "REPRODUCAO", "OUTRO"], { error: "Selecione a categoria" }),
  titulo: z.string().min(2, "Mínimo 2 caracteres").max(100),
  descricao: z.string().min(5, "Mínimo 5 caracteres"),
  resolvida: z.boolean().default(false),
});

export type CreateOcorrenciaInput = z.infer<typeof createOcorrenciaSchema>;
