import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints/auth";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { Perfil } from "@/types";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: meResp } = useQuery({
    queryKey: ["usuarios", "me"],
    queryFn: ({ signal }) => authApi.me(signal),
    staleTime: 60 * 60 * 1000,
    enabled: !!(
      localStorage.getItem(STORAGE_KEYS.token) ??
      sessionStorage.getItem(STORAGE_KEYS.token)
    ),
  });
  const usuario = meResp?.data;

  const login = async (email: string, senha: string, lembrar: boolean) => {
    const resp = await authApi.login(email, senha);
    const { access_token, refresh_token } = resp.data as {
      access_token: string;
      refresh_token: string;
    };
    if (lembrar) {
      localStorage.setItem(STORAGE_KEYS.token, access_token);
      localStorage.setItem(STORAGE_KEYS.refreshToken, refresh_token);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.token, access_token);
      sessionStorage.setItem(STORAGE_KEYS.refreshToken, refresh_token);
    }
    await queryClient.invalidateQueries({ queryKey: ["usuarios", "me"] });
    return resp;
  };

  const logout = async () => {
    const refresh =
      localStorage.getItem(STORAGE_KEYS.refreshToken) ??
      sessionStorage.getItem(STORAGE_KEYS.refreshToken);
    if (refresh) {
      await authApi.logout(refresh).catch(() => {});
    }
    localStorage.clear();
    sessionStorage.clear();
    queryClient.clear();
    window.location.href = "/login";
  };

  return {
    usuario,
    login,
    logout,
    isAuthenticated: !!usuario,
    perfil: usuario?.perfil as Perfil | undefined,
  };
}
