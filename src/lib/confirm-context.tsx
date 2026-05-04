"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { C } from "@/lib/colors";
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setPending({ ...opts, resolve });
    });
  }, []);

  const handleResolve = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "oklch(0.00 0 0 / 0.35)" }}
          onClick={() => handleResolve(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl border p-5 shadow-xl"
            style={{ background: C.bg, borderColor: C.border }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon + Title */}
            <div className="flex items-start gap-3">
              {pending.danger && (
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${C.danger}15` }}
                >
                  <AlertTriangle size={16} style={{ color: C.danger }} />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-[14px] font-semibold" style={{ color: C.text }}>
                  {pending.title}
                </h2>
                <p className="mt-1 text-[12px] leading-relaxed" style={{ color: C.muted }}>
                  {pending.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => handleResolve(false)}
                autoFocus
                className="rounded-md border px-3.5 py-1.5 text-[13px] font-medium transition-colors"
                style={{ borderColor: C.border, color: C.text, background: C.elevated }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.overlay; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.elevated; }}
              >
                {pending.cancelLabel ?? "Cancelar"}
              </button>
              <button
                onClick={() => handleResolve(true)}
                className="rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors"
                style={{
                  background: pending.danger ? C.danger : C.accent,
                  color: "oklch(1.00 0 0)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              >
                {pending.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
