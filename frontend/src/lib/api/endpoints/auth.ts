import client from "../client";
import type { ApiResponse, LoginResponse, Perfil } from "@/types";

export const authApi = {
  login: (email: string, senha: string) =>
    client.post<ApiResponse<LoginResponse>>("/auth/login", { email, senha }).then((r) => r.data),

  registro: (body: { nome: string; email: string; senha: string; perfil: Perfil; cpf: string; telefone?: string }) =>
    client.post<ApiResponse<{ id: string; mensagem: string }>>("/auth/registro", body).then((r) => r.data),

  logout: () =>
    client.post<ApiResponse<null>>("/auth/logout").then((r) => r.data),

  me: () =>
    client.get<ApiResponse<{ id: string; nome: string; email: string; perfil: Perfil }>>("/usuarios/me").then((r) => r.data),
};
