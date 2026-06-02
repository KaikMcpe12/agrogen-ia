import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/endpoints/auth";
import { getApiErrorMessage } from "@/lib/api/error-messages";

const schema = z.object({
  novaSenha: z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Deve conter pelo menos uma maiúscula")
    .regex(/[0-9]/, "Deve conter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "Deve conter pelo menos um símbolo"),
  confirmarSenha: z.string(),
}).refine((d) => d.novaSenha === d.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type FormData = z.infer<typeof schema>;

export function RedefinirSenhaPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const token = searchParams.get("token");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ mode: 'onBlur', reValidateMode: 'onChange',
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setApiError(null);
    try {
      await authApi.redefinirSenha(token, data.novaSenha);
      setSuccess(true);
      setTimeout(() => void navigate("/login"), 3000);
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
          {!token ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <AlertTriangle size={44} className="text-warn" />
              <h2 className="text-[1.2rem] font-bold text-ink">Link inválido</h2>
              <p className="text-[14px] text-ink-3">
                O link de redefinição está ausente ou expirou. Solicite um novo.
              </p>
              <Link to="/recuperar-senha" className="text-[14px] text-green-700 hover:underline">
                Solicitar novo link
              </Link>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <CheckCircle2 size={44} className="text-ok" />
              <h2 className="text-[1.25rem] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
                Senha redefinida!
              </h2>
              <p className="text-[14px] text-ink-3">
                Sua senha foi alterada com sucesso. Redirecionando para o login…
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-[1.25rem] font-bold text-ink mb-1" style={{ fontFamily: "var(--font-display)" }}>
                Redefinir senha
              </h2>
              <p className="text-[14px] text-ink-3 mb-6">
                Digite sua nova senha. O token expira em 1 hora.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="relative">
                  <Input
                    label="Nova senha"
                    type={showPwd ? "text" : "password"}
                    required
                    placeholder="Mínimo 8 caracteres"
                    error={errors.novaSenha?.message}
                    {...register("novaSenha")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-[34px] text-ink-4 hover:text-ink"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <Input
                  label="Confirmar nova senha"
                  type={showPwd ? "text" : "password"}
                  required
                  placeholder="Repita a nova senha"
                  error={errors.confirmarSenha?.message}
                  {...register("confirmarSenha")}
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
                  Redefinir senha
                </Button>
              </form>

              <p className="text-center text-[13px] text-ink-4 mt-4">
                Lembrou a senha?{" "}
                <Link to="/login" className="text-green-700 hover:underline">
                  Fazer login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
