// Wrapper imperativo sobre o ToastProvider do Toast.tsx
// O COMMIT 3 vai expandir com deduplicação, 4 tipos e aria-live

import { getApiErrorMessage } from "@/lib/api/error-messages";

type ToastFn = (message: string, type: "success" | "error") => void;

let _toast: ToastFn | null = null;

export function registerToastFn(fn: ToastFn) {
  _toast = fn;
}

function dispatch(message: string, type: "success" | "error") {
  if (_toast) {
    _toast(message, type);
  } else {
    // fallback antes da árvore React montar
    console.warn(`[toast:${type}]`, message);
  }
}

export function showSuccessToast(message: string) {
  dispatch(message, "success");
}

export function showErrorToast(error: unknown) {
  const message = typeof error === "string" ? error : getApiErrorMessage(error);
  dispatch(message, "error");
}

export function showInfoToast(message: string) {
  dispatch(message, "success");
}

export function showWarningToast(message: string) {
  dispatch(message, "error");
}
