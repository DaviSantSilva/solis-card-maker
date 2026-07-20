"use client";
import { useState, RefObject, useEffect, useRef } from "react";
import { toPng, toJpeg } from "html-to-image";
import { useEditorStore } from "@/store/editorStore";
import { SolisCard } from "@/lib/cards/types";

/* ── helpers ── */
function downloadBlob(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  downloadBlob(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toSlug(card: SolisCard) {
  return card.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function captureCard(
  wrapperRef: RefObject<HTMLDivElement | null>,
  format: "png" | "jpeg"
): Promise<string> {
  const el = wrapperRef.current;
  if (!el) throw new Error("ref não encontrada");
  const inner = el.firstElementChild as HTMLElement;
  if (!inner) throw new Error("inner canvas não encontrado");

  const prev = {
    overflow: el.style.overflow,
    width: el.style.width,
    height: el.style.height,
    transform: inner.style.transform,
  };

  el.style.overflow  = "visible";
  el.style.width     = "864px";
  el.style.height    = "1234px";
  inner.style.transform = "scale(1)";

  try {
    const fn = format === "png" ? toPng : toJpeg;
    return await fn(inner, {
      width: 864,
      height: 1234,
      pixelRatio: 1,
      quality: format === "jpeg" ? 0.95 : 1,
    });
  } finally {
    el.style.overflow  = prev.overflow;
    el.style.width     = prev.width;
    el.style.height    = prev.height;
    inner.style.transform = prev.transform;
  }
}

/* ── item individual do menu ── */
type ItemState = "idle" | "loading" | "done" | "error";

function MenuItem({
  label,
  detail,
  onClick,
}: {
  label: string;
  detail?: string;
  onClick: () => Promise<void>;
}) {
  const [state, setState] = useState<ItemState>("idle");

  const handle = async () => {
    if (state === "loading") return;
    setState("loading");
    try {
      await onClick();
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch (e) {
      console.error(e);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const stateText =
    state === "loading" ? "exportando…" :
    state === "done"    ? "✓ baixado"   :
    state === "error"   ? "erro"        : null;

  return (
    <button
      type="button"
      onClick={handle}
      disabled={state === "loading"}
      className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-700/60 disabled:opacity-50"
    >
      <span className="text-neutral-200">{label}</span>
      <span className="text-xs text-neutral-500">
        {stateText ?? detail}
      </span>
    </button>
  );
}

/* ── componente principal ── */
export function ExportPanel({
  cardRef,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
}) {
  const { activeCard, library } = useEditorStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  /* fecha ao clicar fora */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      {/* botão trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-800/60 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-200"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v8m0 0L5 7m3 3 3-3M2 12h12" />
        </svg>
        Exportar
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 10 6" fill="currentColor"
        >
          <path d="M0 0l5 6 5-6z" />
        </svg>
      </button>

      {/* dropdown */}
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-56 rounded-lg border border-neutral-700 bg-neutral-900 py-1 shadow-xl shadow-black/40">
          {/* imagem */}
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
            Imagem
          </p>
          <MenuItem
            label="PNG"
            detail="864 × 1234 px"
            onClick={async () => {
              const url = await captureCard(cardRef, "png");
              downloadBlob(url, `${toSlug(activeCard)}.png`);
            }}
          />
          <MenuItem
            label="JPEG"
            detail="qualidade 95%"
            onClick={async () => {
              const url = await captureCard(cardRef, "jpeg");
              downloadBlob(url, `${toSlug(activeCard)}.jpeg`);
            }}
          />

          {/* divisor */}
          <div className="my-1 border-t border-neutral-800" />

          {/* json */}
          <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
            Dados
          </p>
          <MenuItem
            label="JSON — esta carta"
            onClick={async () => downloadJson(activeCard, `${toSlug(activeCard)}.json`)}
          />
          <MenuItem
            label="JSON — biblioteca"
            detail={`${library.length} cartas`}
            onClick={async () => downloadJson(library, "solis-biblioteca.json")}
          />
        </div>
      )}
    </div>
  );
}
