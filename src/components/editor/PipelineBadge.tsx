"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  usePipelineStore,
  getGlobalStatus,
  PipelineJob,
} from "@/store/pipelineStore";
import { LOCALES, LOCALE_FLAG, TranslationStatus } from "@/lib/localization/locales";

/* ── ícones de status por locale ── */
const STATUS_CONFIG: Record<TranslationStatus, { icon: string; color: string; spin?: boolean }> = {
  pending:     { icon: "●", color: "#4a5168" },
  translating: { icon: "⟳", color: "#3b82f6", spin: true },
  done:        { icon: "✓", color: "#10b981" },
  stale:       { icon: "⚠", color: "#f59e0b" },
  error:       { icon: "✗", color: "#ef4444" },
};

/* ── cor do badge global ── */
const GLOBAL_COLOR = {
  idle:        "transparent",
  translating: "#f59e0b",
  done:        "#10b981",
  error:       "#ef4444",
};

/* ── formatação de tempo decorrido ── */
function elapsed(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)  return `há ${secs}s`;
  if (secs < 3600) return `há ${Math.floor(secs / 60)}min`;
  return `há ${Math.floor(secs / 3600)}h`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/* ── status icon inline ── */
function StatusIcon({ status }: { status: TranslationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cfg.spin ? "inline-block animate-spin" : ""}
      style={{ color: cfg.color, fontSize: 11, fontWeight: 700, lineHeight: 1 }}
    >
      {cfg.icon}
    </span>
  );
}

/* ── job card dentro do dropdown ── */
function JobRow({ job, onToggle }: { job: PipelineJob; onToggle: () => void }) {
  const allDone = LOCALES.every((l) =>
    ["done", "stale", "error"].includes(job.locales[l].status)
  );

  return (
    <div className="flex flex-col gap-2 border-b py-3 px-4 last:border-b-0"
      style={{ borderColor: "var(--border)" }}>

      {/* cabeçalho do job */}
      <div className="flex items-start gap-3">
        {/* placeholder visual da carta */}
        <div
          className="flex h-[54px] w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
          style={{ background: `${job.cardAccent}cc` }}
        >
          {job.cardName.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-semibold" style={{ color: "var(--text-1)" }}>
              {job.cardName}
            </p>
            <span className="shrink-0 text-[10px]" style={{ color: "var(--text-3)" }}>
              {elapsed(job.startedAt)}
            </span>
          </div>

          {/* dots por idioma */}
          <div className="flex items-center gap-2">
            {LOCALES.map((locale) => (
              <span key={locale} className="flex items-center gap-0.5">
                <span className="text-[9px]" style={{ color: "var(--text-3)" }}>
                  {LOCALE_FLAG[locale]}
                </span>
                <StatusIcon status={job.locales[locale].status} />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* toggle de passos */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1 text-[10px] transition-colors"
        style={{ color: "var(--text-3)" }}
      >
        <svg className={`h-2.5 w-2.5 transition-transform ${job.expanded ? "rotate-90" : ""}`}
          viewBox="0 0 6 10" fill="currentColor">
          <path d="M0 0l6 5-6 5z" />
        </svg>
        {job.expanded ? "Ocultar passos" : `Ver passos (${job.steps.length})`}
      </button>

      {/* log de passos */}
      {job.expanded && (
        <div className="flex flex-col gap-1 rounded-lg p-2"
          style={{ background: "var(--bg-base)" }}>
          {job.steps.length === 0 ? (
            <p className="text-[10px]" style={{ color: "var(--text-3)" }}>Aguardando…</p>
          ) : (
            job.steps.map((step) => {
              const cfg = step.status === "done"
                ? { icon: "✓", color: "#10b981" }
                : step.status === "error"
                ? { icon: "✗", color: "#ef4444" }
                : { icon: "⟳", color: "#3b82f6" };

              return (
                <div key={step.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={step.status === "running" ? "animate-spin" : ""}
                      style={{ color: cfg.color, fontSize: 10, fontWeight: 700 }}>
                      {cfg.icon}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-2)" }}>
                      {step.locale && (
                        <span className="mr-1">{LOCALE_FLAG[step.locale]}</span>
                      )}
                      {step.label}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[9px]" style={{ color: "var(--text-3)" }}>
                    {formatTime(step.timestamp)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ── componente principal ── */
export function PipelineBadge() {
  const { jobs, setExpanded, clearCompleted } = usePipelineStore();
  const [open, setOpen]           = useState(false);
  const [dropPos, setDropPos]     = useState({ top: 0, left: 0 });
  const btnRef                    = useRef<HTMLButtonElement>(null);
  const dropRef                   = useRef<HTMLDivElement>(null);

  const jobList      = Object.values(jobs);
  const globalStatus = getGlobalStatus(jobs);
  const badgeColor   = GLOBAL_COLOR[globalStatus];
  const completedCount = jobList.filter((j) =>
    LOCALES.every((l) => ["done", "stale", "error"].includes(j.locales[l].status))
  ).length;

  /* calcula posição do dropdown com base no botão */
  const openDropdown = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({
        top:  rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }
    setOpen((o) => !o);
  }, []);

  /* fecha ao clicar fora */
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !dropRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <>
      {/* botão com ícone de tradutor */}
      <button
        ref={btnRef}
        type="button"
        onClick={openDropdown}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
        style={{
          borderColor: open ? "var(--accent)" : "var(--border)",
          background:  open ? "var(--accent-glow)" : "var(--bg-raised)",
          color:       "var(--text-2)",
        }}
        title="Pipeline de tradução"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="10"/>
          <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
        </svg>

        {globalStatus !== "idle" ? (
          <span
            className={`absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 text-[7px] font-black text-white ${
              globalStatus === "translating" ? "animate-pulse" : ""
            }`}
            style={{ background: badgeColor, borderColor: "var(--bg-base)" }}
          >
            {globalStatus === "translating" ? "⟳" : globalStatus === "done" ? "✓" : "✗"}
          </span>
        ) : (
          <span
            className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2"
            style={{ background: "#4a5168", borderColor: "var(--bg-base)" }}
          />
        )}
      </button>

      {/* dropdown via Portal — escapa do overflow:hidden do editor */}
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dropRef}
          className="fixed z-[200] w-80 overflow-hidden rounded-xl border shadow-2xl"
          style={{
            top:         dropPos.top,
            left:        dropPos.left,
            transform:   "translateX(-50%)",
            borderColor: "var(--border)",
            background:  "var(--bg-overlay)",
            boxShadow:   "0 24px 48px rgba(0,0,0,.6)",
          }}
        >
          {/* header */}
          <div className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--border)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
              Pipeline de tradução
            </p>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={clearCompleted}
                className="text-[10px] transition-colors"
                style={{ color: "var(--text-3)" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "var(--text-2)")}
                onMouseOut={(e)  => (e.currentTarget.style.color = "var(--text-3)")}>
                Limpar concluídas
              </button>
            )}
          </div>

          {/* lista de jobs */}
          <div className="max-h-[70vh] overflow-y-auto">
            {jobList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <svg className="h-8 w-8" style={{ color: "var(--text-3)" }} fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10"/>
                  <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
                </svg>
                <p className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
                  Nenhuma tradução em andamento
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                  As traduções serão iniciadas automaticamente<br/>
                  ao salvar uma carta
                </p>
              </div>
            ) : (
              jobList.map((job) => (
                <JobRow
                  key={job.cardId}
                  job={job}
                  onToggle={() => setExpanded(job.cardId, !job.expanded)}
                />
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
