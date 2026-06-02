import { z } from "zod";

export const createPesagemSchema = z.object({
  animalId: z.string().uuid(),
  data: z.string().min(1, "Informe a data"),
  peso_kg: z
    .number({ error: "Informe o peso" })
    .positive("Peso deve ser positivo")
    .refine((v) => {
      const s = String(v).replace(",", ".");
      return !isNaN(Number(s));
    }, "Peso inválido"),
  estagio: z.enum(["DESMAMA", "SOBREANO", "ADULTO", "GESTACAO", "OUTRO"], { error: "Selecione o estágio" }),
  observacao: z.string().optional(),
});

export type CreatePesagemInput = z.infer<typeof createPesagemSchema>;
