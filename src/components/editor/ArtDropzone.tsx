"use client";
import { useCallback, useState } from "react";
import { useEditorStore } from "@/store/editorStore";

export function ArtDropzone() {
  const { activeCard, setArtField } = useEditorStore();
  const [dragging, setDragging]     = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setArtField("src", e.target.result as string);
        // reseta posição ao trocar a imagem
        setArtField("offsetX", 0);
        setArtField("offsetY", 0);
        setArtField("scale", 1);
      }
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
  const art    = activeCard.art;
  const scale  = art?.scale ?? 1;
  const offsetX = art?.offsetX ?? 0;
  const offsetY = art?.offsetY ?? 0;

  return (
    <div className="flex flex-col gap-3">

      {/* dropzone */}
      <div
        className="relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl transition-all"
        style={{
          height: 112,
          border: `2px dashed ${dragging ? "#3b82f6" : "var(--border)"}`,
          background: dragging ? "rgba(59,130,246,0.06)" : "var(--bg-raised)",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {hasArt ? (
          <>
            {/* preview da imagem com o mesmo crop que a carta */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={art!.src}
              alt="arte"
              className="absolute inset-0 h-full w-full"
              style={{
                objectFit: "contain",
                transformOrigin: "50% 50%",
                transform: `translate(${offsetX}%, ${offsetY}%) scale(${scale})`,
                opacity: 0.45,
              }}
            />
            <div className="relative flex flex-col items-center gap-1">
              <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-xs font-medium text-white/70">Trocar imagem</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="h-6 w-6" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              Arraste ou <span className="underline" style={{ color: "var(--text-2)" }}>selecione</span>
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-3)" }}>PNG · JPG · WEBP</p>
          </div>
        )}
        <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {/* controles de posicionamento — só quando há arte */}
      {hasArt && (
        <div className="flex flex-col gap-2 rounded-xl border p-3"
          style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>

          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
              Posicionamento
            </p>
            <button
              type="button"
              onClick={() => { setArtField("offsetX", 0); setArtField("offsetY", 0); setArtField("scale", 1); }}
              className="text-[10px] transition-colors"
              style={{ color: "var(--text-3)" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "var(--text-2)")}
              onMouseOut={(e)  => (e.currentTarget.style.color = "var(--text-3)")}>
              Resetar
            </button>
          </div>

          {/* zoom */}
          <Slider
            label="Zoom"
            value={scale}
            display={`${Math.round(scale * 100)}%`}
            min={0.5} max={3} step={0.02}
            onChange={(v) => setArtField("scale", v)}
          />

          {/* posição X */}
          <Slider
            label="Horizontal"
            value={offsetX}
            display={`${offsetX > 0 ? "+" : ""}${offsetX}%`}
            min={-80} max={80} step={1}
            onChange={(v) => setArtField("offsetX", v)}
          />

          {/* posição Y */}
          <Slider
            label="Vertical"
            value={offsetY}
            display={`${offsetY > 0 ? "+" : ""}${offsetY}%`}
            min={-80} max={80} step={1}
            onChange={(v) => setArtField("offsetY", v)}
          />
        </div>
      )}
    </div>
  );
}

function Slider({ label, value, display, min, max, step, onChange }: {
  label: string; value: number; display: string;
  min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{label}</span>
        <span className="font-mono text-[10px]" style={{ color: "var(--text-2)" }}>{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-blue-500"
        style={{ accentColor: "#3b82f6" }}
      />
    </label>
  );
}
