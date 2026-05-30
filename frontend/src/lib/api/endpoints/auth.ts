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

  recuperarSenha: (email: string) =>
    client.post<ApiResponse<{ mensagem: string }>>("/auth/recuperar-senha", { email }).then((r) => r.data),

  redefinirSenha: (token: string, novaSenha: string) =>
    client.post<ApiResponse<{ mensagem: string }>>("/auth/redefinir-senha", { token, nova_senha: novaSenha }).then((r) => r.data),

  atualizarPerfil: (body: { nome?: string; telefone?: string }) =>
    client.put<ApiResponse<{ id: string; nome: string; email: string; perfil: Perfil }>>("/usuarios/me", body).then((r) => r.data),

  exportarDados: () =>
    client.get<ApiResponse<{ url: string; mensagem: string }>>("/usuarios/me/exportar").then((r) => r.data),
};
