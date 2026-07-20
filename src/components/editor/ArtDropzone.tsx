"use client";
import { useCallback, useState } from "react";
import { useEditorStore } from "@/store/editorStore";

export function ArtDropzone() {
  const { activeCard, setArtField } = useEditorStore();
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setArtField("src", e.target.result as string);
    };
    reader.readAsDataURL(file);
  }, [setArtField]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const hasArt = !!activeCard.art?.src;
  const art = activeCard.art;

  return (
    <div className="flex flex-col gap-3">
      {/* drop zone */}
      <div
        className={`relative flex h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          dragging ? "border-blue-500 bg-blue-950/30" : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-500"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {hasArt ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art!.src} alt="arte" className="h-full w-full rounded-md object-cover object-top opacity-40" />
            <span className="absolute text-xs font-semibold text-white drop-shadow">Trocar imagem</span>
          </>
        ) : (
          <>
            <svg className="mb-2 h-6 w-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-xs text-neutral-500">Arraste ou <span className="text-neutral-300 underline">selecione</span></p>
            <p className="mt-0.5 text-[10px] text-neutral-600">PNG · JPG · WEBP</p>
          </>
        )}
        <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {/* controles de posicionamento — só aparecem quando há arte */}
      {hasArt && (
        <div className="flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-800/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Posicionamento</p>

          <label className="flex flex-col gap-1">
            <span className="flex justify-between text-[10px] text-neutral-500">
              <span>Posição X</span>
              <span className="font-mono text-neutral-400">{art?.offsetX ?? 0}%</span>
            </span>
            <input type="range" min="-80" max="80" step="1"
              value={art?.offsetX ?? 0}
              onChange={(e) => setArtField("offsetX", Number(e.target.value))}
              className="accent-blue-500" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="flex justify-between text-[10px] text-neutral-500">
              <span>Posição Y</span>
              <span className="font-mono text-neutral-400">{art?.offsetY ?? 0}%</span>
            </span>
            <input type="range" min="-80" max="80" step="1"
              value={art?.offsetY ?? 0}
              onChange={(e) => setArtField("offsetY", Number(e.target.value))}
              className="accent-blue-500" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="flex justify-between text-[10px] text-neutral-500">
              <span>Zoom</span>
              <span className="font-mono text-neutral-400">{((art?.scale ?? 1) * 100).toFixed(0)}%</span>
            </span>
            <input type="range" min="0.5" max="3" step="0.05"
              value={art?.scale ?? 1}
              onChange={(e) => setArtField("scale", Number(e.target.value))}
              className="accent-blue-500" />
          </label>

          <button
            onClick={() => { setArtField("offsetX", 0); setArtField("offsetY", 0); setArtField("scale", 1); }}
            className="mt-1 rounded border border-neutral-700 py-1 text-[10px] text-neutral-500 hover:border-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Resetar posição
          </button>
        </div>
      )}
    </div>
  );
}
