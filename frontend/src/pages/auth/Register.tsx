import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { authApi } from "@/lib/api/endpoints/auth";
import { useState } from "react";
import type { Perfil } from "@/types";

const schema = z
  .object({
    nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
    email: z.string().min(1, "E-mail obrigatório").email("Formato inválido"),
    perfil: z.enum(["PRODUTOR", "TECNICO", "VETERINARIO"] as const),
    senha: z.string().min(6, "Mínimo 6 caracteres"),
    confirmar: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.senha === d.confirmar, {
    message: "As senhas não coincidem",
    path: ["confirmar"],
  });

type FormData = z.infer<typeof schema>;

const perfilOptions = [
  { value: "PRODUTOR", label: "Produtor Rural" },
  { value: "TECNICO", label: "Técnico Agropecuário" },
  { value: "VETERINARIO", label: "Veterinário" },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { perfil: "PRODUTOR" },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await authApi.registro({
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        perfil: data.perfil as Perfil,
      });
      void navigate("/login");
    } catch {
      setApiError("Não foi possível criar a conta. Tente novamente.");
    }
  };

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="mb-8">
        <Logo size={44} />
      </div>

      <div
        className="w-full max-w-[420px] bg-surface rounded-[18px] border border-line p-8"
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        <h1
          className="text-[22px] font-bold text-ink mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Criar conta
        </h1>
        <p className="text-[14px] text-ink-3 mb-6">
          Preencha os dados para começar.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Nome completo"
            required
            placeholder="Maria da Silva"
            error={errors.nome?.message}
            {...register("nome")}
          />
          <Input
            label="E-mail"
            type="email"
            required
            placeholder="seuemail@fazenda.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Select
            label="Perfil"
            required
            options={perfilOptions}
            error={errors.perfil?.message}
            {...register("perfil")}
          />
          <Input
            label="Senha"
            type="password"
            required
            placeholder="Mínimo 6 caracteres"
            error={errors.senha?.message}
            {...register("senha")}
          />
          <Input
            label="Confirmar senha"
            type="password"
            required
            placeholder="••••••••"
            error={errors.confirmar?.message}
            {...register("confirmar")}
          />

          {apiError && (
            <p className="text-[13px] text-danger bg-danger-bg px-3 py-2 rounded-[8px]">
              {apiError}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            className="w-full mt-1"
          >
            Criar conta
          </Button>
        </form>

        <p className="text-center text-[14px] text-ink-3 mt-5">
          Já tem conta?{" "}
          <Link to="/login" className="text-green-700 font-medium hover:underline">
            Acessar
          </Link>
        </p>
      </div>
    </div>
  );
}
