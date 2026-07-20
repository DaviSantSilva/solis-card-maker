"use client";
import { useState, RefObject } from "react";
import { toPng, toJpeg } from "html-to-image";
import { useEditorStore } from "@/store/editorStore";
import { SolisCard } from "@/lib/cards/types";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function downloadBlob(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function downloadJson(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  downloadBlob(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toFilename(card: SolisCard, ext: string) {
  const slug = card.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `${slug}.${ext}`;
}

/* ─────────────────────────────────────────────
   Image export — renderiza a carta em tamanho
   nativo (864×1234) numa div oculta e captura
   com html-to-image para evitar distorções de
   transform:scale
───────────────────────────────────────────── */
async function captureCard(
  wrapperRef: RefObject<HTMLDivElement | null>,
  format: "png" | "jpeg"
): Promise<string> {
  const el = wrapperRef.current;
  if (!el) throw new Error("Referência da carta não encontrada");

  // O inner div (864×1234) é o primeiro filho direto do wrapper.
  // Capturamos ele em seu tamanho real, sem o scale visual.
  const inner = el.firstElementChild as HTMLElement;
  if (!inner) throw new Error("Inner canvas não encontrado");

  // Remove temporariamente o clip do wrapper para o inner não ser cortado
  const prevOverflow = el.style.overflow;
  const prevW = el.style.width;
  const prevH = el.style.height;
  el.style.overflow = "visible";
  el.style.width = "864px";
  el.style.height = "1234px";

  // Reseta o scale do inner div para scale(1) durante a captura
  const prevTransform = inner.style.transform;
  inner.style.transform = "scale(1)";

  try {
    const fn = format === "png" ? toPng : toJpeg;
    return await fn(inner, {
      width: 864,
      height: 1234,
      pixelRatio: 1,
      quality: format === "jpeg" ? 0.95 : 1,
      // Garante que imagens externas (data URLs e /public) sejam incluídas
      includeQueryParams: true,
    });
  } finally {
    // Restaura os estilos originais independente de erro
    el.style.overflow = prevOverflow;
    el.style.width = prevW;
    el.style.height = prevH;
    inner.style.transform = prevTransform;
  }
}

/* ─────────────────────────────────────────────
   Botão individual com estado de loading
───────────────────────────────────────────── */
function ExportButton({
  label,
  sublabel,
  icon,
  onClick,
  variant = "default",
}: {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onClick: () => Promise<void>;
  variant?: "default" | "primary";
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

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

  const base =
    "flex flex-col items-center justify-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all cursor-pointer select-none";
  const styles =
    variant === "primary"
      ? "border-blue-600 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20"
      : "border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200";

  const stateLabel =
    state === "loading" ? "exportando…" :
    state === "done"    ? "✓ pronto"    :
    state === "error"   ? "erro"        :
    label;

  return (
    <button type="button" onClick={handle} className={`${base} ${styles}`}>
      <span className="text-base leading-none">
        {state === "loading" ? (
          <span className="inline-block animate-spin">⟳</span>
        ) : icon}
      </span>
      <span className={state === "error" ? "text-red-400" : ""}>{stateLabel}</span>
      {sublabel && state === "idle" && (
        <span className="text-[9px] text-neutral-600">{sublabel}</span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────
   ExportPanel — componente principal
───────────────────────────────────────────── */
export function ExportPanel({
  cardRef,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
}) {
  const { activeCard, library } = useEditorStore();

  return (
    <div className="flex w-full flex-col gap-2">
      {/* rótulo de seção */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
          Exportar
        </span>
        <div className="flex-1 border-t border-neutral-800" />
      </div>

      {/* grid de botões */}
      <div className="grid grid-cols-3 gap-2">
        {/* ── PNG ── */}
        <ExportButton
          label="PNG"
          sublabel="864 × 1234 px"
          icon="🖼"
          variant="primary"
          onClick={async () => {
            const url = await captureCard(cardRef, "png");
            downloadBlob(url, toFilename(activeCard, "png"));
          }}
        />

        {/* ── JPEG ── */}
        <ExportButton
          label="JPEG"
          sublabel="qualidade 95%"
          icon="📷"
          onClick={async () => {
            const url = await captureCard(cardRef, "jpeg");
            downloadBlob(url, toFilename(activeCard, "jpeg"));
          }}
        />

        {/* ── JSON carta ── */}
        <ExportButton
          label="JSON"
          sublabel="esta carta"
          icon="{ }"
          onClick={async () => {
            downloadJson(activeCard, toFilename(activeCard, "json"));
          }}
        />
      </div>

      {/* exportar biblioteca completa */}
      <ExportButton
        label={`Exportar biblioteca (${library.length} carta${library.length !== 1 ? "s" : ""})`}
        icon="📦"
        onClick={async () => {
          downloadJson(library, "solis-biblioteca.json");
        }}
      />
    </div>
  );
}
