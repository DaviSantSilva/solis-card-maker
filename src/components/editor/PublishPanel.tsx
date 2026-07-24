"use client";
import { useState } from "react";
import { publishCards, PublishProgress, PublishResult } from "@/lib/supabase/publish.service";

type Step =
  | { type: "idle" }
  | { type: "confirm" }
  | { type: "publishing"; progress: PublishProgress }
  | { type: "done"; result: PublishResult }
  | { type: "error"; message: string };

export function PublishPanel() {
  const [step, setStep]   = useState<Step>({ type: "idle" });
  const [notes, setNotes] = useState("");

  const startPublish = async () => {
    setStep({ type: "publishing", progress: { total: 0, current: 0, card: "" } });
    try {
      const result = await publishCards(
        (p) => setStep({ type: "publishing", progress: p }),
        notes.trim() || undefined
      );
      setStep({ type: "done", result });
      setNotes("");
    } catch (e) {
      setStep({ type: "error", message: (e as Error).message });
    }
  };

  const reset = () => setStep({ type: "idle" });

  // ── idle: botão principal ──
  if (step.type === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStep({ type: "confirm" })}
        className="flex items-center gap-1.5 rounded-md bg-emerald-700/80 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v8m0 0L5 7m3 3 3-3M2 13h12" />
        </svg>
        Publicar
      </button>
    );
  }

  // ── confirmação ──
  if (step.type === "confirm") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Nota da publicação (opcional)"
          className="h-7 rounded border border-neutral-700 bg-neutral-800 px-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-neutral-500 w-52"
        />
        <button
          type="button"
          onClick={startPublish}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          Confirmar
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  // ── publicando ──
  if (step.type === "publishing") {
    const { total, current, card } = step.progress;
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-neutral-500 truncate max-w-36">
          {card || "Preparando…"}
        </span>
      </div>
    );
  }

  // ── erro ──
  if (step.type === "error") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-400 max-w-56 truncate">{step.message}</span>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-neutral-700 px-2 py-0.5 text-[10px] text-neutral-500 hover:text-neutral-300"
        >
          ✕
        </button>
      </div>
    );
  }

  // ── concluído ──
  const { result } = step;
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-emerald-400">
          v{result.version} publicada — {result.published} nova{result.published !== 1 ? "s" : ""},
          {" "}{result.unchanged} sem alteração
        </span>
        <a
          href={result.manifestUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-neutral-600 hover:text-neutral-400 truncate max-w-72"
        >
          {result.manifestUrl}
        </a>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded border border-neutral-700 px-2 py-0.5 text-[10px] text-neutral-500 hover:text-neutral-300"
      >
        ✕
      </button>
    </div>
  );
}
