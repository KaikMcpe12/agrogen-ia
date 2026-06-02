import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Mínimo 6 caracteres"),
  lembrar: z.boolean().default(false),
});

export const cadastroSchema = z
  .object({
    nome: z.string().min(2, "Mínimo 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    cpf: z
      .string()
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido — formato: 000.000.000-00"),
    telefone: z
      .string()
      .regex(/^\(\d{2}\)\s\d{5}-\d{4}$/, "Telefone inválido — formato: (00) 00000-0000")
      .optional()
      .or(z.literal("")),
    senha: z.string().min(8, "Mínimo 8 caracteres"),
    confirmar_senha: z.string(),
    perfil: z.enum(["PROPRIETARIO", "TECNICO", "VETERINARIO"]),
  })
  .superRefine((data, ctx) => {
    if (data.senha !== data.confirmar_senha) {
      ctx.addIssue({
        path: ["confirmar_senha"],
        code: "custom",
        message: "As senhas não coincidem",
      });
    }
  });

export const recuperarSenhaSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const redefinirSenhaSchema = z
  .object({
    nova_senha: z.string().min(8, "Mínimo 8 caracteres"),
    confirmar_senha: z.string(),
    token: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.nova_senha !== data.confirmar_senha) {
      ctx.addIssue({
        path: ["confirmar_senha"],
        code: "custom",
        message: "As senhas não coincidem",
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type CadastroInput = z.infer<typeof cadastroSchema>;
export type RecuperarSenhaInput = z.infer<typeof recuperarSenhaSchema>;
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;
