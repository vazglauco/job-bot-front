"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: { type: ToastType; message: string }) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ type, message }: { type: ToastType; message: string }) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notificações"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const colors = {
    success: { bg: "oklch(0.45 0.18 145 / 0.12)", border: "oklch(0.45 0.18 145 / 0.35)", text: "oklch(0.35 0.14 145)", dot: "oklch(0.45 0.18 145)" },
    error:   { bg: "oklch(0.52 0.20 25 / 0.12)",  border: "oklch(0.52 0.20 25 / 0.35)",  text: "oklch(0.42 0.16 25)",  dot: "oklch(0.52 0.20 25)" },
    info:    { bg: "oklch(0.50 0.18 270 / 0.10)", border: "oklch(0.50 0.18 270 / 0.30)", text: "oklch(0.35 0.14 270)", dot: "oklch(0.50 0.18 270)" },
  }[toast.type];

  return (
    <div
      role="alert"
      className="flex min-w-64 max-w-80 items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-[12px] shadow-lg"
      style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
    >
      <span className="mt-0.5 size-1.5 shrink-0 rounded-full" style={{ background: colors.dot }} />
      <span className="flex-1 leading-relaxed">{toast.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Fechar notificação"
        className="shrink-0 opacity-50 transition-opacity hover:opacity-100"
        style={{ color: colors.text }}
      >
        ✕
      </button>
    </div>
  );
}
