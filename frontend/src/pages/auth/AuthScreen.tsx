import { useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { authApi } from "@/lib/api/endpoints/auth";
import { fazendasApi } from "@/lib/api/endpoints/fazendas";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { getApiErrorMessage } from "@/lib/api/error-messages";
import { useAuth } from "@/hooks/useAuth";
import type { Perfil } from "@/types";

/* ── Máscaras via react-imask ──────────────────────────────── */
const CPF_MASK = "000.000.000-00";
const PHONE_MASK = "(00) 00000-0000";

function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11 || /^(\d)\1+$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(clean[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== Number(clean[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(clean[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === Number(clean[10]);
}

/* ── Password strength indicator ──────────────────────────────── */

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Fraca", "Razoável", "Boa", "Forte"];
  const colors = ["", "bg-danger", "bg-warn", "bg-amber", "bg-ok"];

  if (!password) return null;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? colors[score] : "bg-line"}`}
          />
        ))}
      </div>
      <span className="text-[11px] text-ink-4">{labels[score]}</span>
    </div>
  );
}

/* ── Login Form ──────────────────────────────────────────────── */

const loginSchema = z.object({
  email: z.string().min(1, "E-mail obrigatório").email("Formato inválido"),
  senha: z.string().min(1, "Senha obrigatória"),
  lembrar: z.boolean().optional(),
});
type LoginData = z.infer<typeof loginSchema>;

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginData>({ mode: 'onBlur', reValidateMode: 'onChange',
    resolver: zodResolver(loginSchema) as Resolver<LoginData>,
    defaultValues: { lembrar: false },
  });

  const onSubmit = async (data: LoginData) => {
    setApiError(null);
    try {
      const res = await login(data.email, data.senha, data.lembrar ?? false);
      if (res.data.usuario.fazenda_ativa_id) {
        localStorage.setItem(STORAGE_KEYS.fazendaAtivaId, res.data.usuario.fazenda_ativa_id);
      }
      void navigate("/dashboard");
    } catch (err) {
      setApiError(getApiErrorMessage(err));
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
          type={showPwd ? "text" : "password"}
          required
          placeholder="••••••••"
          error={errors.senha?.message}
          rightIcon={
            <button
              type="button"
              className="text-ink-4 hover:text-ink"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register("senha")}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[13px] text-ink-3 cursor-pointer select-none">
            <input type="checkbox" className="accent-green-700" {...register("lembrar")} />
            Lembrar-me
          </label>
          <Link to="/recuperar-senha" className="text-[13px] text-green-700 hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        {apiError && (
          <p className="text-[13px] text-danger bg-danger-bg px-3 py-2 rounded-[8px]" role="alert">
            {apiError}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="w-full mt-1">
          Entrar
        </Button>
      </form>

      <p className="text-[13px] text-ink-3 text-center mt-5">
        Não tem conta?{" "}
        <Link to="/cadastro" className="text-green-700 font-semibold hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}

/* ── Register Form ───────────────────────────────────────────── */

const senhaRule = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Deve conter letra maiúscula")
  .regex(/[0-9]/, "Deve conter número")
  .regex(/[^A-Za-z0-9]/, "Deve conter símbolo");

const registerSchema = z
  .object({
    nome: z.string().min(3, "Mínimo 3 caracteres"),
    cpf: z
      .string()
      .min(1, "CPF obrigatório")
      .refine((v) => validateCPF(v), { message: "CPF inválido" }),
    telefone: z.string().optional().refine(
      (v) => !v || /^\(\d{2}\) \d{5}-\d{4}$/.test(v),
      { message: "Telefone inválido" }
    ),
    email: z.string().min(1, "E-mail obrigatório").email("Formato inválido"),
    perfil: z.enum(["PRODUTOR", "TECNICO", "VETERINARIO"] as const),
    senha: senhaRule,
    confirmar: z.string().min(1, "Confirme a senha"),
    termos: z.boolean().refine((v) => v === true, { message: "Aceite os termos para continuar" }),
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
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, watch, control, formState: { errors, isSubmitting } } = useForm<RegisterData>({ mode: 'onBlur', reValidateMode: 'onChange',
    resolver: zodResolver(registerSchema) as Resolver<RegisterData>,
    defaultValues: { perfil: "PRODUTOR" },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const senhaValue = watch("senha") ?? "";

  const onSubmit = async (data: RegisterData) => {
    setApiError(null);
    try {
      await authApi.registro({
        nome: data.nome,
        cpf: data.cpf,
        email: data.email,
        senha: data.senha,
        perfil: data.perfil as Perfil,
      });

      // FLUXO-07: login automático após cadastro
      const loginRes = await login(data.email, data.senha, false);
      if (loginRes.data.usuario.fazenda_ativa_id) {
        localStorage.setItem(STORAGE_KEYS.fazendaAtivaId, loginRes.data.usuario.fazenda_ativa_id);
      }

      // Verifica se usuário tem fazendas
      const fazendasRes = await fazendasApi.listar();
      const temFazendas = fazendasRes.data.length > 0;
      void navigate(temFazendas ? "/dashboard" : "/perfil?tab=fazendas&onboarding=true");
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    }
  };

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
          <Controller
            name="cpf"
            control={control}
            render={({ field }) => (
              <MaskedInput
                mask={CPF_MASK}
                label="CPF"
                required
                placeholder="000.000.000-00"
                error={errors.cpf?.message}
                value={field.value ?? ""}
                onAccept={(v) => field.onChange(v)}
                onBlur={field.onBlur}
              />
            )}
          />
          <Controller
            name="telefone"
            control={control}
            render={({ field }) => (
              <MaskedInput
                mask={PHONE_MASK}
                label="Telefone"
                placeholder="(88) 90000-0000"
                error={errors.telefone?.message}
                value={field.value ?? ""}
                onAccept={(v) => field.onChange(v)}
                onBlur={field.onBlur}
              />
            )}
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
          <div>
            <Input
              label="Senha"
              type={showPwd ? "text" : "password"}
              required
              placeholder="Mín. 8 caracteres"
              error={errors.senha?.message}
              rightIcon={
                <button
                  type="button"
                  className="text-ink-4 hover:text-ink"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register("senha")}
            />
            <PasswordStrength password={senhaValue} />
          </div>
          <Input
            label="Confirmar senha"
            type="password"
            required
            placeholder="••••••••"
            error={errors.confirmar?.message}
            {...register("confirmar")}
          />
        </div>

        {/* Aceite dos termos */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="accent-green-700 mt-0.5 shrink-0"
            {...register("termos")}
          />
          <span className="text-[13px] text-ink-3">
            Li e aceito os{" "}
            <a href="/termos" target="_blank" className="text-green-700 hover:underline">Termos de Uso</a>
            {" "}e a{" "}
            <a href="/politica-privacidade" target="_blank" className="text-green-700 hover:underline">Política de Privacidade</a>
            {" "}(LGPD).
          </span>
        </label>
        {errors.termos && (
          <p className="text-[12px] text-danger -mt-1">{errors.termos.message}</p>
        )}

        {apiError && (
          <p className="text-[13px] text-danger bg-danger-bg px-3 py-2 rounded-[8px]" role="alert">
            {apiError}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="w-full mt-1">
          Criar conta
        </Button>
      </form>

      <p className="text-[13px] text-ink-3 text-center mt-5">
        Já tem conta?{" "}
        <Link to="/login" className="text-green-700 font-semibold hover:underline">
          Faça login
        </Link>
      </p>
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
  const { isDark, toggle } = useTheme();

  const switchTab = (t: "login" | "register") => {
    setTab(t);
    void navigate(t === "login" ? "/login" : "/cadastro", { replace: true });
  };

  return (
    <>
      <style>{`body,#root{margin:0;padding:0;height:100%}*{box-sizing:border-box}`}</style>
      <div className="fixed inset-0 flex overflow-hidden" style={{ fontFamily: "var(--font-body)" }}>

        {/* Painel esquerdo (oculto no mobile) */}
        <div
          className="hidden md:flex flex-1 flex-col justify-between p-10 relative overflow-hidden text-white"
          style={{ background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 40%, #4a7c45 70%, #8b5e3c 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 60% 80%, rgba(212,160,23,0.25) 0%, transparent 60%)" }} />

          <div className="flex items-center gap-2 z-10">
            <Logo variant="icon-only" size={44} />
            <span className="text-[1.15rem] font-bold tracking-tight text-white">AgroGen <span style={{ color: "#d4a017" }}>IA</span></span>
          </div>

          <div className="z-10 flex-1 flex flex-col justify-center">
            <h1 className="font-extrabold leading-tight tracking-tight mb-5 text-white" style={{ fontSize: "clamp(2rem, 3.2vw, 2.8rem)", letterSpacing: "-0.03em" }}>
              Genética inteligente<br />para o{" "}
              <span style={{ color: "#d4a017" }}>sertão que<br />produz.</span>
            </h1>
            <p className="text-[1rem] leading-relaxed mb-10 max-w-[420px]" style={{ color: "rgba(255,255,255,0.78)" }}>
              Plataforma de coleta de dados genéticos e monitoramento de inseminação artificial com IA para bovinos, ovinos e caprinos.
            </p>
            <div className="flex gap-10 flex-wrap">
              {[
                { value: "+62%", label: "Taxa de prenhez" },
                { value: "3 espécies", label: "Bovino · Ovino · Caprino" },
                { value: "100%", label: "Offline-ready" },
              ].map((s) => (
                <div key={s.value} className="flex flex-col">
                  <span className="text-[1.6rem] font-extrabold leading-none" style={{ color: "#d4a017" }}>{s.value}</span>
                  <span className="text-[0.78rem] mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[0.7rem] z-10" style={{ color: "rgba(255,255,255,0.42)" }}>
            Hackathon Expoagro Crateús 2026 · Prefeitura Municipal de Crateús/CE
          </p>
        </div>

        {/* Painel direito (formulário) */}
        <div
          className="w-full md:w-[520px] md:min-w-[440px] flex flex-col md:justify-center px-6 py-10 md:px-14 overflow-y-auto"
          style={{ backgroundColor: "var(--color-beige, #f5efe6)" }}
        >
          <div className="flex items-center justify-between mb-8">
            <Logo size={40} />
            <button
              onClick={toggle}
              className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-black/5 transition-colors"
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="flex rounded-[10px] p-1 gap-1 mb-8" style={{ backgroundColor: "#e8e4da" }}>
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={[
                  "flex-1 py-2 rounded-[7px] text-[14px] border-none cursor-pointer transition-all font-[inherit]",
                  tab === t ? "font-semibold bg-surface text-ink shadow-sm" : "font-medium text-ink-3 bg-transparent",
                ].join(" ")}
              >
                {t === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {tab === "login" ? <LoginForm /> : <RegisterForm />}

          <p className="text-[0.7rem] text-ink-4 mt-8 md:hidden text-center">
            Hackathon Expoagro Crateús 2026
          </p>
        </div>
      </div>
    </>
  );
}
