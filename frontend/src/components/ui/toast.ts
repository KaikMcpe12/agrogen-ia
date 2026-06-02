// Wrapper imperativo sobre o ToastProvider — spec seção 10
// Deduplicação: mesma mensagem dentro de 2s não dispara novamente

import { getApiErrorMessage } from "@/lib/api/error-messages";

export type ToastType = "success" | "error" | "info" | "warning";

type ToastFn = (message: string, type: ToastType) => void;

let _toast: ToastFn | null = null;

export function registerToastFn(fn: ToastFn) {
  _toast = fn;
}

// Deduplicação: armazena timestamp da última exibição por "type:message"
const recentToasts = new Map<string, number>();

function dispatch(type: ToastType, message: string) {
  const key = `${type}:${message}`;
  const lastShown = recentToasts.get(key) ?? 0;
  if (Date.now() - lastShown < 2000) return;
  recentToasts.set(key, Date.now());

  if (_toast) {
    _toast(message, type);
  } else {
    console.warn(`[toast:${type}]`, message);
  }
}

export function showSuccessToast(message: string) {
  dispatch("success", message);
}

export function showErrorToast(error: unknown) {
  const message = typeof error === "string" ? error : getApiErrorMessage(error);
  dispatch("error", message);
}

export function showInfoToast(message: string) {
  dispatch("info", message);
}

export function showWarningToast(message: string) {
  dispatch("warning", message);
}

export function showToastWithAction(
  type: ToastType,
  message: string,
  _actionLabel: string,
  _onAction: () => void
) {
  dispatch(type, message);
}
