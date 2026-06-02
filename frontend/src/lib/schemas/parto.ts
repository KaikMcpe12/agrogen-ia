import { z } from "zod";

export const createPartoSchema = z.object({
  animalId: z.string().uuid(),
  data_parto: z.string().min(1, "Informe a data do parto"),
  tipo_parto: z.enum(["NORMAL", "DISTOCICO", "CESARIA", "ABORTO"], { error: "Selecione o tipo de parto" }),
  num_crias: z.number().int().min(0, "Número inválido"),
  num_crias_vivas: z.number().int().min(0, "Número inválido"),
  peso_total_crias_kg: z.number().positive().optional(),
  houve_distorcia: z.boolean().default(false),
  houve_obito_matriz: z.boolean().default(false),
  inseminacao_id: z.string().uuid().optional(),
});

export type CreatePartoInput = z.infer<typeof createPartoSchema>;
