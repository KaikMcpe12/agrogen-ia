import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/endpoints/auth";
import { getApiErrorMessage } from "@/lib/api/error-messages";

const schema = z.object({
  email: z.string().min(1, "E-mail obrigatório").email("Formato de e-mail inválido"),
});

type FormData = z.infer<typeof schema>;

export function RecuperarSenhaPage() {
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ mode: 'onBlur', reValidateMode: 'onChange',
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await authApi.recuperarSenha(data.email);
      setSuccess(true);
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-[2rem] font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <span className="text-green-900">AgroGen</span>{" "}
            <span className="text-amber font-extrabold">IA</span>
          </h1>
        </div>

        <div className="bg-surface rounded-[18px] border border-line p-7 shadow-[var(--shadow-sm)]">
          {success ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <CheckCircle2 size={44} className="text-ok" />
              <h2 className="text-[1.25rem] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
                E-mail enviado!
              </h2>
              <p className="text-[14px] text-ink-3 max-w-xs">
                Se o e-mail estiver cadastrado, você receberá as instruções de recuperação em instantes.
                O link é válido por <strong>1 hora</strong>.
              </p>
              <Link to="/login" className="text-[14px] text-green-700 hover:underline mt-2">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-2 text-[13px] text-ink-3 hover:text-ink mb-5">
                <ArrowLeft size={14} /> Voltar para o login
              </Link>

              <h2 className="text-[1.25rem] font-bold text-ink mb-1" style={{ fontFamily: "var(--font-display)" }}>
                Recuperar senha
              </h2>
              <p className="text-[14px] text-ink-3 mb-6">
                Digite seu e-mail cadastrado e enviaremos o link para redefinição.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Input
                  label="E-mail"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  error={errors.email?.message}
                  {...register("email")}
                />

                {apiError && (
                  <p className="text-[13px] text-danger bg-danger-bg px-3 py-2 rounded-[8px]">
                    {apiError}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  loading={isSubmitting}
                >
                  Enviar e-mail de recuperação
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
