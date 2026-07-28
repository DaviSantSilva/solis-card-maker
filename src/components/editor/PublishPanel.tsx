"use client";
import { useState } from "react";
import { publishCards, PublishProgress, PublishResult } from "@/lib/supabase/publish.service";

type Step = { type: "idle" } | { type: "confirm" } | { type: "publishing"; progress: PublishProgress } | { type: "done"; result: PublishResult } | { type: "error"; message: string };

export function PublishPanel() {
  const [step, setStep]   = useState<Step>({ type: "idle" });
  const [notes, setNotes] = useState("");

  const startPublish = async () => {
    setStep({ type: "publishing", progress: { total: 0, current: 0, card: "" } });
    try {
      const result = await publishCards((p) => setStep({ type: "publishing", progress: p }), notes.trim() || undefined);
      setStep({ type: "done", result }); setNotes("");
    } catch (e) { setStep({ type: "error", message: (e as Error).message }); }
  };
  const reset = () => setStep({ type: "idle" });

  if (step.type === "idle") return (
    <button type="button" onClick={() => setStep({ type: "confirm" })}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
      style={{ background: "#059669" }}>
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 14V6m0 0L5 9m3-3 3 3M2 3h12" />
      </svg>
      Publicar
    </button>
  );

  if (step.type === "confirm") return (
    <div className="flex items-center gap-2">
      <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
        placeholder="Nota (opcional)"
        className="h-7 rounded-lg border px-2 text-xs outline-none"
        style={{ borderColor: "var(--border)", background: "var(--bg-raised)", color: "var(--text-1)", width: 160 }} />
      <button type="button" onClick={startPublish}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#059669" }}>
        Confirmar
      </button>
      <button type="button" onClick={reset}
        className="rounded-lg border px-3 py-1.5 text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-2)" }}>
        Cancelar
      </button>
    </div>
  );

  if (step.type === "publishing") {
    const { total, current, card } = step.progress;
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    return (
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-36 overflow-hidden rounded-full" style={{ background: "var(--bg-raised)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "#059669" }} />
        </div>
        <span className="max-w-32 truncate text-xs" style={{ color: "var(--text-3)" }}>{card || "Preparando…"}</span>
      </div>
    );
  }

  if (step.type === "error") return (
    <div className="flex items-center gap-2">
      <span className="max-w-48 truncate text-xs" style={{ color: "#f87171" }}>{step.message}</span>
      <button type="button" onClick={reset} className="text-xs" style={{ color: "var(--text-3)" }}>✕</button>
    </div>
  );

  const { result } = step;
  const localeEntries = Object.entries(result.localeManifests ?? {});

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold" style={{ color: "#10b981" }}>
          v{result.version} · {result.published} novas, {result.unchanged} inalteradas
        </span>
        <a href={result.manifestUrl} target="_blank" rel="noreferrer"
          className="max-w-64 truncate text-[10px]" style={{ color: "var(--text-3)" }}>
          🇧🇷 PT: {result.manifestUrl}
        </a>
        {localeEntries.map(([locale, url]) => (
          <a key={locale} href={url} target="_blank" rel="noreferrer"
            className="max-w-64 truncate text-[10px]" style={{ color: "var(--text-3)" }}>
            {locale.toUpperCase()}: {url}
          </a>
        ))}
      </div>
      <button type="button" onClick={reset} className="text-xs" style={{ color: "var(--text-3)" }}>✕</button>
    </div>
  );
}
