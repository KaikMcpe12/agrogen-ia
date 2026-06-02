import axios from "axios";
import { setupMocks } from "./mocks/index";
import { STORAGE_KEYS } from "@/lib/storage-keys";

export const apiClient = axios.create({
  baseURL: import.meta.env["VITE_API_URL"] ?? "/api/v1",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor ───────────────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem(STORAGE_KEYS.token) ??
    localStorage.getItem(STORAGE_KEYS.token);
  const fazendaId = localStorage.getItem(STORAGE_KEYS.fazendaAtivaId);

  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  if (fazendaId && !config.url?.startsWith("/auth/"))
    config.headers["X-Fazenda-ID"] = fazendaId;

  return config;
});

// ── Response interceptor ─────────────────────────────────────────────────────
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh =
    localStorage.getItem(STORAGE_KEYS.refreshToken) ??
    sessionStorage.getItem(STORAGE_KEYS.refreshToken);
  const resp = await apiClient.post<{ data: { access_token: string } }>(
    "/auth/refresh",
    { refresh_token: refresh }
  );
  const newToken = resp.data.data.access_token;
  // Persist in whichever storage held the original token
  if (localStorage.getItem(STORAGE_KEYS.token)) {
    localStorage.setItem(STORAGE_KEYS.token, newToken);
  } else {
    sessionStorage.setItem(STORAGE_KEYS.token, newToken);
  }
  return newToken;
}

function handleNetworkError() {
  // Offline module picks this up; no toast here to avoid duplication
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    const status = error.response?.status as number | undefined;

    // 401: token expirado — tenta refresh uma única vez
    if (
      status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/refresh")
    ) {
      original._retry = true;
      try {
        // Deduplicação: se já há refresh em andamento, aguarda o mesmo
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken();
        }
        const novoToken = await refreshPromise;
        refreshPromise = null;
        original.headers["Authorization"] = `Bearer ${novoToken}`;
        return apiClient(original);
      } catch (refreshError) {
        refreshPromise = null;
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.refreshToken);
        sessionStorage.removeItem(STORAGE_KEYS.token);
        sessionStorage.removeItem(STORAGE_KEYS.refreshToken);
        window.location.href = "/login?session=expired";
        return Promise.reject(refreshError);
      }
    }

    // 403: sem permissão
    if (status === 403) {
      // Import dinâmico para evitar dependência circular na inicialização
      const { showErrorToast } = await import("@/components/ui/toast");
      showErrorToast("Você não tem permissão para esta ação.");
    }

    // Sem resposta: offline
    if (!error.response) {
      handleNetworkError();
    }

    return Promise.reject(error);
  }
);

/* Enable mocks in dev unless VITE_USE_REAL_API=true */
if (import.meta.env["VITE_USE_REAL_API"] !== "true") {
  setupMocks(apiClient);
}

export default apiClient;
