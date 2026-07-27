"use client";
import { useCallback, useState } from "react";

/* ── tipos ── */
interface ConfirmOptions {
  title:   string;
  body?:   string;
  confirm: string;
  cancel?: string;
  variant?: "default" | "danger";
}

/* ── modal visual ── */
function ConfirmModal({
  title, body, confirm, cancel = "Cancelar", variant = "default",
  onConfirm, onCancel,
}: ConfirmOptions & { onConfirm: () => void; onCancel: () => void }) {
  const confirmBg = variant === "danger" ? "#dc2626" : "#3b82f6";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.65)" }} />

      {/* painel */}
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          background:   "var(--bg-overlay)",
          borderColor:  "var(--border)",
          boxShadow:    "0 32px 64px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* cabeçalho com faixa colorida */}
        <div
          className="h-1 w-full"
          style={{ background: confirmBg, opacity: 0.8 }}
        />

        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
              {title}
            </p>
            {body && (
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                {body}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border px-4 py-2 text-xs font-medium transition-colors hover:border-neutral-500 hover:text-white"
              style={{ borderColor: "var(--border)", color: "var(--text-2)", background: "transparent" }}
            >
              {cancel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
              style={{ background: confirmBg }}
            >
              {confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── hook ── */
interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);

  /** Abre o modal e retorna uma Promise<boolean>. */
  const ask = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const close = useCallback((ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  }, [state]);

  const modal = state ? (
    <ConfirmModal
      {...state}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null;

  return { ask, modal };
}
