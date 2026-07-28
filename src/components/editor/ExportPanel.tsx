"use client";
import { useState, RefObject, useEffect, useRef } from "react";
import { toPng, toJpeg } from "html-to-image";
import { useEditorStore } from "@/store/editorStore";
import { SolisCard } from "@/lib/cards/types";

function downloadBlob(dataUrl: string, filename: string) {
  const a = document.createElement("a"); a.href = dataUrl; a.download = filename; a.click();
}
function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  downloadBlob(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function toSlug(card: SolisCard) {
  return card.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
async function captureCard(wrapperRef: RefObject<HTMLDivElement | null>, format: "png" | "jpeg"): Promise<string> {
  const el = wrapperRef.current;
  if (!el) throw new Error("ref não encontrada");
  const inner = el.firstElementChild as HTMLElement;
  if (!inner) throw new Error("inner canvas não encontrado");
  const prev = { overflow: el.style.overflow, width: el.style.width, height: el.style.height, transform: inner.style.transform };
  el.style.overflow = "visible"; el.style.width = "864px"; el.style.height = "1234px";
  inner.style.transform = "scale(1)";
  try {
    const fn = format === "png" ? toPng : toJpeg;
    return await fn(inner, { width: 864, height: 1234, pixelRatio: 1, quality: format === "jpeg" ? 0.95 : 1 });
  } finally {
    el.style.overflow = prev.overflow; el.style.width = prev.width; el.style.height = prev.height;
    inner.style.transform = prev.transform;
  }
}

type ItemState = "idle" | "loading" | "done" | "error";

function MenuItem({ label, detail, onClick }: { label: string; detail?: string; onClick: () => Promise<void> }) {
  const [state, setState] = useState<ItemState>("idle");
  const handle = async () => {
    if (state === "loading") return;
    setState("loading");
    try { await onClick(); setState("done"); setTimeout(() => setState("idle"), 2000); }
    catch (e) { console.error(e); setState("error"); setTimeout(() => setState("idle"), 3000); }
  };
  return (
    <button type="button" onClick={handle}
      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors"
      style={{ color: "var(--text-1)" }}
      onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-raised)")}
      onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
      <span>{label}</span>
      <span className="text-xs" style={{ color: state === "loading" ? "var(--accent)" : state === "done" ? "#10b981" : state === "error" ? "#f87171" : "var(--text-3)" }}>
        {state === "loading" ? "exportando…" : state === "done" ? "✓" : state === "error" ? "erro" : detail}
      </span>
    </button>
  );
}

export function ExportPanel({ cardRef }: { cardRef: RefObject<HTMLDivElement | null> }) {
  const { activeCard, library } = useEditorStore();
  const [open, setOpen]         = useState(false);
  const panelRef                = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!panelRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
        style={{ borderColor: "var(--border)", color: "var(--text-2)", background: "var(--bg-surface)" }}
        onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--text-3)")}
        onMouseOut={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v8m0 0L5 7m3 3 3-3M2 12h12" />
        </svg>
        Exportar
        <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6 5-6z" /></svg>
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-52 overflow-hidden rounded-xl border py-1 shadow-2xl"
          style={{ borderColor: "var(--border)", background: "var(--bg-overlay)", boxShadow: "0 24px 48px rgba(0,0,0,.5)" }}>
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Imagem</p>
          <MenuItem label="PNG" detail="864 × 1234" onClick={async () => { const u = await captureCard(cardRef, "png"); downloadBlob(u, `${toSlug(activeCard)}.png`); }} />
          <MenuItem label="JPEG" detail="qualidade 95%" onClick={async () => { const u = await captureCard(cardRef, "jpeg"); downloadBlob(u, `${toSlug(activeCard)}.jpeg`); }} />
          <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />
          <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Dados</p>
          <MenuItem label="JSON — esta carta" onClick={async () => downloadJson(activeCard, `${toSlug(activeCard)}.json`)} />
          <MenuItem label="JSON — biblioteca" detail={`${library.length} cartas`} onClick={async () => downloadJson(library, "solis-biblioteca.json")} />
        </div>
      )}
    </div>
  );
}
