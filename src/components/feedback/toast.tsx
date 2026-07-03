"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import Image from "next/image";

type ToastVariant = "error" | "pending";
type ToastAction = { label: string; onClick: () => void };
type ToastInput = { variant?: ToastVariant; title: string; description?: string; action?: ToastAction };
type ToastItem = ToastInput & { id: number };

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 6000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = (idRef.current += 1);
      setToasts((prev) => [...prev, { variant: "error", ...input, id }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed inset-x-0 bottom-4 z-[110] flex flex-col items-center gap-2.5 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const isPending = toast.variant === "pending";

  if (isPending) {
    return (
      <div
        role="status"
        className="flex w-full max-w-[400px] items-center gap-3 rounded-2xl px-4 py-3.5 shadow-[0_12px_30px_rgba(45,42,38,.18)]"
        style={{ backgroundColor: "#5B5048" }}
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#E0A24E", boxShadow: "0 0 0 4px rgba(224,162,78,.22)" }} />
        <div className="flex-1">
          <p className="text-sm font-bold text-[#F4EEE6]">{toast.title}</p>
          {toast.description && <p className="mt-0.5 text-xs text-[#C9BEB0]">{toast.description}</p>}
        </div>
        {toast.action && (
          <button type="button" onClick={toast.action.onClick} className="text-[13px] font-bold text-[#E8B58A]">
            {toast.action.label}
          </button>
        )}
        <button type="button" onClick={onDismiss} aria-label="닫기" className="text-lg leading-none text-[#C9BEB0] hover:text-[#F4EEE6]">
          ×
        </button>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="flex w-full max-w-[400px] items-center gap-3 rounded-2xl border border-[#E6C9BC] bg-card px-4 py-3.5 shadow-[0_12px_30px_rgba(45,42,38,.1)]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]" style={{ backgroundColor: "#FBEEE8" }}>
        <Image src="/icons/alert.png" alt="" width={22} height={22} unoptimized className="pixelated" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-foreground">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-xs text-muted-foreground">{toast.description}</p>}
      </div>
      {toast.action && (
        <button
          type="button"
          onClick={toast.action.onClick}
          className="rounded-[10px] px-3.5 py-2 text-[13px] font-bold text-focus"
          style={{ backgroundColor: "#FBEEE8" }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" onClick={onDismiss} aria-label="닫기" className="text-lg leading-none text-muted-foreground hover:text-foreground">
        ×
      </button>
    </div>
  );
}
