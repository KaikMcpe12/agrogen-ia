import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useScrollLock } from "@/hooks/useScrollLock";
import client from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/error-messages";

const schema = z.object({
  senhaAtual: z.string().min(1, "Obrigatório"),
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

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Modal15AlterarSenha({ open, onClose }: Props) {
  useScrollLock(open);

  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ mode: 'onBlur', reValidateMode: 'onChange',
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await client.post("/usuarios/me/alterar-senha", {
        senha_atual: data.senhaAtual,
        nova_senha: data.novaSenha,
      });
      setSuccess(true);
      setTimeout(() => { reset(); setSuccess(false); onClose(); }, 2000);
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface w-full flex flex-col rounded-t-[24px] md:rounded-[16px] md:max-w-md md:border md:border-line md:shadow-[var(--shadow-lg)] md:mx-4 max-h-[85dvh] md:max-h-[90dvh]">
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Alterar Senha
          </h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-10 gap-3 px-5 text-center">
            <p className="text-3xl">✅</p>
            <p className="text-[15px] font-semibold text-ink">Senha alterada com sucesso!</p>
            <p className="text-[13px] text-ink-3">Fechando automaticamente…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
            <div className="relative">
              <Input
                label="Senha atual"
                type={showPwd ? "text" : "password"}
                required
                error={errors.senhaAtual?.message}
                {...register("senhaAtual")}
              />
              <button type="button" className="absolute right-3 top-[34px] text-ink-4 hover:text-ink" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? "Ocultar" : "Mostrar"}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Input label="Nova senha" type={showPwd ? "text" : "password"} required placeholder="Mín. 8 caracteres" error={errors.novaSenha?.message} {...register("novaSenha")} />
            <Input label="Confirmar nova senha" type={showPwd ? "text" : "password"} required error={errors.confirmarSenha?.message} {...register("confirmarSenha")} />
            {apiError && <p className="text-[13px] text-danger bg-danger-bg px-3 py-2 rounded-[8px]">{apiError}</p>}
          </form>
        )}

        {!success && (
          <div className="flex justify-between px-5 py-3 bg-beige border-t border-line shrink-0">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
              Alterar senha
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
