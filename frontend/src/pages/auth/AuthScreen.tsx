import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { authApi } from "@/lib/api/endpoints/auth";
import type { Perfil } from "@/types";

/* ── Helpers de máscara ──────────────────────────────────────── */

function maskCPF(value: string) {
  let v = value.replace(/\D/g, "").slice(0, 11);
  if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  return v;
}

function maskPhone(value: string) {
  let v = value.replace(/\D/g, "").slice(0, 11);
  if (v.length > 6) v = v.replace(/(\d{2})(\d{5})(\d{1,4})/, "($1) $2-$3");
  else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,5})/, "($1) $2");
  return v;
}

/* ── Login Form ──────────────────────────────────────────────── */

const loginSchema = z.object({
  email: z.string().min(1, "E-mail obrigatório").email("Formato inválido"),
  senha: z.string().min(1, "Senha obrigatória"),
});
type LoginData = z.infer<typeof loginSchema>;

function LoginForm() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema) as Resolver<LoginData>,
  });

  const onSubmit = async (data: LoginData) => {
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
    <div>
      <h2 className="text-[1.4rem] font-bold text-ink mb-1 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        Entrar
      </h2>
      <p className="text-[0.875rem] text-ink-3 mb-6">Acesse sua conta AgroGen IA.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="E-mail"
          type="email"
          required
          placeholder="seu@email.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Senha"
          type="password"
          required
          placeholder="••••••"
          error={errors.senha?.message}
          {...register("senha")}
        />

        {apiError && (
          <p className="text-[13px] text-danger bg-danger-bg px-3 py-2 rounded-[8px]">{apiError}</p>
        )}

        <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="w-full mt-1">
          Entrar
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
          </svg>
        </Button>
      </form>
    </div>
  );
}

/* ── Register Form ───────────────────────────────────────────── */

const registerSchema = z
  .object({
    nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
    cpf: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().min(1, "E-mail obrigatório").email("Formato inválido"),
    perfil: z.enum(["PRODUTOR", "TECNICO", "VETERINARIO"] as const),
    senha: z.string().min(6, "Mínimo 6 caracteres"),
    confirmar: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.senha === d.confirmar, {
    message: "As senhas não coincidem",
    path: ["confirmar"],
  });

type RegisterData = z.infer<typeof registerSchema>;

const perfilOptions = [
  { value: "PRODUTOR", label: "Produtor Rural" },
  { value: "TECNICO", label: "Técnico Agropecuário" },
  { value: "VETERINARIO", label: "Veterinário" },
];

function RegisterForm() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema) as Resolver<RegisterData>,
    defaultValues: { perfil: "PRODUTOR" },
  });

  const onSubmit = async (data: RegisterData) => {
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

  const cpfReg = register("cpf");
  const telReg = register("telefone");

  return (
    <div>
      <h2 className="text-[1.4rem] font-bold text-ink mb-1 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        Criar conta
      </h2>
      <p className="text-[0.875rem] text-ink-3 mb-6">Comece a usar a AgroGen IA hoje.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <Input
          label="Nome completo"
          required
          placeholder="Maria da Silva"
          error={errors.nome?.message}
          {...register("nome")}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="CPF"
            placeholder="000.000.000-00"
            error={errors.cpf?.message}
            {...cpfReg}
            onChange={(e) => {
              e.target.value = maskCPF(e.target.value);
              void cpfReg.onChange(e);
            }}
          />
          <Input
            label="Telefone"
            placeholder="(88) 90000-0000"
            error={errors.telefone?.message}
            {...telReg}
            onChange={(e) => {
              e.target.value = maskPhone(e.target.value);
              void telReg.onChange(e);
            }}
          />
        </div>

        <Input
          label="E-mail"
          type="email"
          required
          placeholder="seu@email.com"
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

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Senha"
            type="password"
            required
            placeholder="Mín. 6 caracteres"
            error={errors.senha?.message}
            {...register("senha")}
          />
          <Input
            label="Confirmar"
            type="password"
            required
            placeholder="••••••"
            error={errors.confirmar?.message}
            {...register("confirmar")}
          />
        </div>

        {apiError && (
          <p className="text-[13px] text-danger bg-danger-bg px-3 py-2 rounded-[8px]">{apiError}</p>
        )}

        <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="w-full mt-1">
          Criar conta
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </Button>
      </form>
    </div>
  );
}

/* ── AuthScreen (split panel) ────────────────────────────────── */

interface Props {
  initialTab?: "login" | "register";
}

export function AuthScreen({ initialTab = "login" }: Props) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const navigate = useNavigate();

  const switchTab = (t: "login" | "register") => {
    setTab(t);
    void navigate(t === "login" ? "/login" : "/cadastro", { replace: true });
  };

  return (
    <>
      <style>{`body,#root{margin:0;padding:0;height:100%}*{box-sizing:border-box}`}</style>
      <div className="fixed inset-0 flex overflow-hidden" style={{ fontFamily: "var(--font-body)" }}>

        {/* ── Painel esquerdo (oculto no mobile) ── */}
        <div
          className="hidden md:flex flex-1 flex-col justify-between p-10 relative overflow-hidden text-white"
          style={{ background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 40%, #4a7c45 70%, #8b5e3c 100%)" }}
        >
          {/* Glow radial decorativo */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 60% 80%, rgba(212,160,23,0.25) 0%, transparent 60%)" }}
          />

          {/* Logo */}
          <div className="flex items-center gap-2 z-10">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[18px]"
              style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.28)" }}>
              ✦
            </div>
            <span className="text-[1.15rem] font-bold tracking-tight">
              AgroGen <span style={{ color: "#d4a017" }}>IA</span>
            </span>
          </div>

          {/* Copy central */}
          <div className="z-10 flex-1 flex flex-col justify-center">
            <h1 className="font-extrabold leading-tight tracking-tight mb-5"
              style={{ fontSize: "clamp(2rem, 3.2vw, 2.8rem)", letterSpacing: "-0.03em" }}>
              Genética inteligente
              <br />para o{" "}
              <span style={{ color: "#d4a017" }}>
                sertão que<br />produz.
              </span>
            </h1>
            <p className="text-[1rem] leading-relaxed mb-10 max-w-[420px]"
              style={{ color: "rgba(255,255,255,0.78)" }}>
              Plataforma de coleta de dados genéticos e monitoramento de
              inseminação artificial com IA para bovinos, ovinos e caprinos.
            </p>
            <div className="flex gap-10 flex-wrap">
              {[
                { value: "+62%", label: "Taxa de prenhez" },
                { value: "3 espécies", label: "Bovino · Ovino · Caprino" },
                { value: "100%", label: "Offline-ready" },
              ].map((s) => (
                <div key={s.value} className="flex flex-col">
                  <span className="text-[1.6rem] font-extrabold leading-none" style={{ color: "#d4a017" }}>
                    {s.value}
                  </span>
                  <span className="text-[0.78rem] mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <p className="text-[0.7rem] z-10" style={{ color: "rgba(255,255,255,0.42)" }}>
            Hackathon Expoagro Crateús 2026 · Prefeitura Municipal de Crateús/CE
          </p>
        </div>

        {/* ── Painel direito (formulário) ── */}
        <div
          className="w-full md:w-[500px] md:min-w-[420px] flex flex-col justify-center px-6 py-10 md:px-14 overflow-y-auto"
          style={{ backgroundColor: "var(--color-beige, #f5efe6)" }}
        >
          {/* Logo mobile + mini logo desktop */}
          <div className="flex items-center gap-2 mb-8">
            <div
              className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-[15px] text-white"
              style={{ background: "#2d6a4f" }}
            >
              ✦
            </div>
            <span className="text-[1.05rem] font-bold tracking-tight text-ink">
              AgroGen <span style={{ color: "#d4a017" }}>IA</span>
            </span>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-[10px] p-1 gap-1 mb-8" style={{ backgroundColor: "#e8e4da" }}>
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={[
                  "flex-1 py-2 rounded-[7px] text-[14px] border-none cursor-pointer transition-all",
                  "font-[inherit]",
                  tab === t
                    ? "font-semibold bg-surface text-ink shadow-sm"
                    : "font-medium text-ink-3 bg-transparent",
                ].join(" ")}
              >
                {t === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {/* Formulário ativo */}
          {tab === "login" ? <LoginForm /> : <RegisterForm />}

          {/* Rodapé mobile */}
          <p className="text-[0.7rem] text-ink-4 mt-8 md:hidden text-center">
            Hackathon Expoagro Crateús 2026
          </p>
        </div>
      </div>
    </>
  );
}
