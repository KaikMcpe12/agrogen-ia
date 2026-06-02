// Wrapper imperativo sobre o ToastProvider — spec seção 10
// Deduplicação: mesma mensagem dentro de 2s não dispara novamente

import { getApiErrorMessage } from "@/lib/api/error-messages";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastInput {
  type: ToastType;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

type ToastFn = (message: string, type: "success" | "error") => void;

let _toast: ToastFn | null = null;

export function registerToastFn(fn: ToastFn) {
  _toast = fn;
}

// Deduplicação: armazena timestamp da última exibição por "type:message"
const recentToasts = new Map<string, number>();

function dispatch(input: ToastInput) {
  const key = `${input.type}:${input.message}`;
  const lastShown = recentToasts.get(key) ?? 0;
  if (Date.now() - lastShown < 2000) return;
  recentToasts.set(key, Date.now());

  const normalized: "success" | "error" =
    input.type === "success" || input.type === "info" ? "success" : "error";

  if (_toast) {
    _toast(input.message, normalized);
  } else {
    console.warn(`[toast:${input.type}]`, input.message);
  }
}

export function showSuccessToast(message: string) {
  dispatch({ type: "success", message });
}

export function showErrorToast(error: unknown) {
  const message = typeof error === "string" ? error : getApiErrorMessage(error);
  dispatch({ type: "error", message });
}

export function showInfoToast(message: string) {
  dispatch({ type: "info", message });
}

export function showWarningToast(message: string) {
  dispatch({ type: "warning", message });
}

export function showToastWithAction(
  type: ToastType,
  message: string,
  actionLabel: string,
  onAction: () => void
) {
  dispatch({ type, message, actionLabel, onAction });
}
