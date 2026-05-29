import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, inputStyle, submitBtnStyle } from "../../components/auth/SharedStyles";

const loginSchema = z.object({
  email: z.string().email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginInputs = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } =
    useForm<LoginInputs>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginInputs) => console.log("Login:", data);

  return (
    <div>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.3rem", letterSpacing: "-0.02em" }}>
        Entrar
      </h2>
      <p style={{ fontSize: "0.875rem", color: "#6b6b5e", marginBottom: "1.5rem", marginTop: 0 }}>
        Acesse sua conta AgroGen IA.
      </p>

      <Field label="E-mail" required error={errors.email?.message}>
        <input type="email" placeholder="seu@email.com" style={inputStyle} {...register("email")} />
      </Field>

      <Field label="Senha" required error={errors.password?.message}>
        <input type="password" placeholder="••••••" style={inputStyle} {...register("password")} />
      </Field>

      <button
        type="button"
        onClick={handleSubmit(onSubmit)}
        style={submitBtnStyle}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2d5a3d")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#1a3a2a")}
      >
        Entrar
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
        </svg>
      </button>
    </div>
  );
}