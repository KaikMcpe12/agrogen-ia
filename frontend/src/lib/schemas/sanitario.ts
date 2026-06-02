import { z } from "zod";

export const createSanitarioSchema = z.object({
  animalId: z.string().uuid(),
  tipo: z.enum(["VACINA", "VERMIFUGACAO", "ECTOPARASITA", "ANTIBIOTICO", "VITAMINA", "OUTRO"], { error: "Selecione o tipo" }),
  produto: z.string().min(1, "Informe o produto"),
  principio_ativo: z.string().optional(),
  data_aplicacao: z.string().min(1, "Informe a data"),
  dose: z.string().optional(),
  via: z.enum(["ORAL", "INJETAVEL_IM", "INJETAVEL_SC", "TOPICA", "INTRAMUSCULAR"]).optional(),
  lote_produto: z.string().optional(),
  proxima_dose: z.string().optional(),
});

export type CreateSanitarioInput = z.infer<typeof createSanitarioSchema>;
