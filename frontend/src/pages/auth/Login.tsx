import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/endpoints/auth";
import { useState } from "react";

const schema = z.object({
  email: z.string().min(1, "E-mail obrigatório").email("Formato inválido"),
  senha: z.string().min(1, "Senha obrigatória"),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const res = await authApi.login(data.email, data.senha);
      localStorage.setItem("agrogen_token", res.data.access_token);
      if (res.data.usuario.fazenda_ativa_id) {
        localStorage.setItem("agrogen_fazenda_id", res.data.usuario.fazenda_ativa_id);
      }
      void navigate("/dashboard");
    } catch {
      setApiError("E-mail ou senha incorretos. Tente novamente.");
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
          Acessar conta
        </h1>
        <p className="text-[14px] text-ink-3 mb-6">
          Faça login para gerenciar seu rebanho.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="E-mail"
            type="email"
            required
            placeholder="seuemail@fazenda.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Senha"
            type="password"
            required
            placeholder="••••••••"
            error={errors.senha?.message}
            {...register("senha")}
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
            Entrar
          </Button>
        </form>

        <p className="text-center text-[14px] text-ink-3 mt-5">
          Não tem conta?{" "}
          <Link to="/cadastro" className="text-green-700 font-medium hover:underline">
            Criar conta
          </Link>
        </p>
      </div>

      <p className="text-[12px] text-ink-4 mt-6">
        AgroGen IA · Hackathon Expoagro Crateús 2026
      </p>
    </div>
  );
}
