import axios from "axios";
import { setupMocks } from "./mocks/index";

export const apiClient = axios.create({
  baseURL: import.meta.env["VITE_API_URL"] ?? "https://api.agrogenia.com/api/v1",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("agrogen_token");
  const fazendaId = localStorage.getItem("agrogen_fazenda_id");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  if (fazendaId) config.headers["X-Fazenda-ID"] = fazendaId;
  return config;
});

/* Enable mocks in dev unless VITE_USE_REAL_API=true */
if (import.meta.env["VITE_USE_REAL_API"] !== "true") {
  setupMocks(apiClient);
}

export default apiClient;
