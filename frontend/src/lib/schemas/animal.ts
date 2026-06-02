import { z } from "zod";

const pesoFaixas = {
  BOVINO: { min: 50, max: 900 },
  OVINO: { min: 10, max: 120 },
  CAPRINO: { min: 8, max: 100 },
} as const;

export const animalBaseSchema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres").max(100),
  sexo: z.enum(["MACHO", "FEMEA"], { error: "Selecione o sexo" }),
  data_nascimento: z
    .string()
    .refine((v) => !v || new Date(v) <= new Date(), "Data de nascimento não pode ser futura"),
  peso_inicial_kg: z.number({ error: "Informe o peso" }).positive("Peso deve ser positivo"),
  condicao_corporal: z.number().int().min(1).max(5),
  fazenda_id: z.string().uuid(),
  brinco: z.string().optional(),
  raca_principal: z.string().optional(),
});

export const createAnimalSchema = animalBaseSchema
  .extend({
    especie: z.enum(["BOVINO", "OVINO", "CAPRINO"], { error: "Selecione a espécie" }),
  })
  .superRefine((data, ctx) => {
    if (!data.especie) return;
    const faixa = pesoFaixas[data.especie];
    if (data.peso_inicial_kg < faixa.min || data.peso_inicial_kg > faixa.max) {
      ctx.addIssue({
        path: ["peso_inicial_kg"],
        code: "custom",
        message: `Peso para ${data.especie} deve estar entre ${faixa.min} e ${faixa.max} kg`,
      });
    }
  });

export const editAnimalSchema = animalBaseSchema;

export type CreateAnimalInput = z.infer<typeof createAnimalSchema>;
export type EditAnimalInput = z.infer<typeof editAnimalSchema>;
