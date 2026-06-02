import { z } from "zod";

export const editUsuarioSchema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres").max(100).optional(),
  email: z.string().email("E-mail inválido").optional(),
  telefone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{5}-\d{4}$/, "Telefone inválido — formato: (00) 00000-0000")
    .optional()
    .or(z.literal("")),
  perfil: z.enum(["PROPRIETARIO", "TECNICO", "VETERINARIO"]).optional(),
});

export type EditUsuarioInput = z.infer<typeof editUsuarioSchema>;
