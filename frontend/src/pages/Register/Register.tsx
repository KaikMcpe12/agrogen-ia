import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, inputStyle, submitBtnStyle, selectStyle } from "../../components/auth/SharedStyles";

const registerSchema = z
  .object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    cpf: z
      .string()
      .min(11, "CPF inválido")
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, "CPF inválido"),
    phone: z.string().min(10, "Telefone inválido"),
    email: z.string().email("Formato de e-mail inválido"),
    userType: z.string().min(1, "Selecione o tipo de usuário"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterInputs = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register, handleSubmit, formState: { errors } } =
    useForm<RegisterInputs>({ resolver: zodResolver(registerSchema) });

  const onSubmit = (data: RegisterInputs) => console.log("Cadastro:", data);

  const formatCPF = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    e.target.value = v;
  };

  const formatPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) v = v.replace(/(\d{2})(\d{5})(\d{1,4})/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,5})/, "($1) $2");
    e.target.value = v;
  };

  return (
    <div>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.3rem", letterSpacing: "-0.02em" }}>
        Criar conta
      </h2>
      <p style={{ fontSize: "0.875rem", color: "#6b6b5e", marginBottom: "1.5rem", marginTop: 0 }}>
        Comece a usar a AgroGen IA hoje.
      </p>

      <Field label="Nome completo" required error={errors.name?.message}>
        <input type="text" style={inputStyle} {...register("name")} />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Field label="CPF" required error={errors.cpf?.message}>
          <input
            type="text"
            placeholder="000.000.000-00"
            style={inputStyle}
            {...register("cpf")}
            onChange={formatCPF}
          />
        </Field>
        <Field label="Telefone" required error={errors.phone?.message}>
          <input
            type="text"
            placeholder="(88) 90000-0000"
            style={inputStyle}
            {...register("phone")}
            onChange={formatPhone}
          />
        </Field>
      </div>

      <Field label="E-mail" required error={errors.email?.message}>
        <input type="email" style={inputStyle} {...register("email")} />
      </Field>

      <Field label="Tipo de usuário" required error={errors.userType?.message}>
        <select style={selectStyle} {...register("userType")}>
          <option value="produtor">Produtor Rural</option>
          <option value="tecnico">Técnico/Veterinário</option>
          <option value="gestor">Gestor de Fazenda</option>
          <option value="admin">Administrador</option>
        </select>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Field label="Senha" required error={errors.password?.message}>
          <input type="password" style={inputStyle} {...register("password")} />
        </Field>
        <Field label="Confirmar" required error={errors.confirmPassword?.message}>
          <input type="password" style={inputStyle} {...register("confirmPassword")} />
        </Field>
      </div>

      <button
        type="button"
        onClick={handleSubmit(onSubmit)}
        style={submitBtnStyle}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2d5a3d")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#1a3a2a")}
      >
        Criar conta
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </button>
    </div>
  );
}