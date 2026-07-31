"use client";
import { useCallback, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { parseImportJSON, ImportResult, ImportedCard } from "@/lib/cards/import";
import { CARD_TYPE_THEME } from "@/lib/cards/theme";
import { createPortal } from "react-dom";

type Step = "idle" | "preview" | "importing" | "done";

/* ── badge de rascunho ── */
function DraftBadge() {
  return (
    <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
      style={{ background: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b44" }}>
      Rascunho
    </span>
  );
}

/* ── linha de preview por carta ── */
function CardPreviewRow({ item }: { item: ImportedCard }) {
  const theme = CARD_TYPE_THEME[item.card.cardType];
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5"
      style={{ background: item.isDraft ? "#f59e0b08" : "var(--bg-raised)" }}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
            style={{ background: theme.accent }}>
            {theme.label}
          </span>
          <span className="truncate text-xs font-medium" style={{ color: "var(--text-1)" }}>
            {item.card.name || <em style={{ color: "var(--text-3)" }}>sem nome</em>}
          </span>
          {item.isDraft && <DraftBadge />}
        </div>
        {item.isDraft && item.missingFields.length > 0 && (
          <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
            Faltando: {item.missingFields.join(", ")}
          </p>
        )}
      </div>
      <span className="shrink-0 text-[10px]" style={{ color: "var(--text-3)" }}>
        qty {item.card.quantity ?? 1}
      </span>
    </div>
  );
}

/* ── modal principal ── */
export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { importCards } = useEditorStore();
  const [step,   setStep]   = useState<Step>("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [imported, setImported] = useState(0);

  const reset = () => {
    setStep("idle"); setResult(null);
    setError(null);  setImported(0);
  };

  const handleClose = () => { reset(); onClose(); };

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".json")) {
      setError("Apenas arquivos .json são aceitos."); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        const parsed = parseImportJSON(raw);
        setResult(parsed);
        setStep("preview");
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleConfirm = async () => {
    if (!result) return;
    setStep("importing");
    try {
      await importCards(result.cards.map((c) => c.card));
      setImported(result.cards.length);
      setStep("done");
    } catch (e) {
      setError((e as Error).message);
      setStep("preview");
    }
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}>
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.7)" }} />

      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{ background: "var(--bg-overlay)", borderColor: "var(--border)",
                 boxShadow: "0 32px 64px rgba(0,0,0,.7)", maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}>

        {/* header */}
        <div className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
            {step === "done" ? "Import concluído" : "Importar cartas"}
          </p>
          <button onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--text-3)", cursor: "pointer" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--text-1)")}
            onMouseOut={(e)  => (e.currentTarget.style.color = "var(--text-3)")}>
            ✕
          </button>
        </div>

        {/* conteúdo */}
        <div className="flex flex-col gap-4 overflow-y-auto p-5">

          {/* ── idle: dropzone ── */}
          {step === "idle" && (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 transition-colors"
              style={{
                borderColor: dragging ? "var(--accent)" : "var(--border)",
                background:  dragging ? "var(--accent-glow)" : "var(--bg-raised)",
                cursor: "pointer",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <svg className="h-8 w-8" style={{ color: "var(--text-3)" }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
                  Arraste um arquivo <span style={{ color: "var(--text-1)" }}>.json</span>
                </p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>ou clique para selecionar</p>
              </div>
              <input type="file" accept=".json"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
            </div>
          )}

          {error && (
            <p className="rounded-lg px-3 py-2 text-xs"
              style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444444" }}>
              {error}
            </p>
          )}

          {/* ── preview ── */}
          {step === "preview" && result && (
            <>
              {/* resumo */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total",     value: result.total,                    color: "var(--text-1)" },
                  { label: "Completas", value: result.total - result.drafts,    color: "#10b981"       },
                  { label: "Rascunhos", value: result.drafts,                   color: "#f59e0b"       },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5 rounded-lg py-3"
                    style={{ background: "var(--bg-raised)" }}>
                    <span className="text-xl font-bold" style={{ color }}>{value}</span>
                    <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* erros de parse */}
              {result.errors.length > 0 && (
                <p className="rounded-lg px-3 py-2 text-xs"
                  style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444444" }}>
                  {result.errors.length} item(s) ignorado(s) por erro de formato.
                </p>
              )}

              {/* lista */}
              <div className="flex flex-col gap-1.5">
                {result.cards.map((item) => (
                  <CardPreviewRow key={item.originalIndex} item={item} />
                ))}
              </div>

              {/* ações */}
              <div className="flex gap-2 pt-1">
                <button onClick={reset}
                  className="flex-1 rounded-lg border py-2 text-xs font-medium transition-colors hover:border-neutral-500 hover:text-white"
                  style={{ borderColor: "var(--border)", color: "var(--text-2)", cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={handleConfirm}
                  className="flex-1 rounded-lg py-2 text-xs font-semibold text-white transition-all hover:brightness-110"
                  style={{ background: "#3b82f6", cursor: "pointer" }}>
                  Importar {result.total} carta{result.total !== 1 ? "s" : ""}
                </button>
              </div>
            </>
          )}

          {/* ── importing ── */}
          {step === "importing" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <svg className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }}
                fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="3"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <p className="text-sm" style={{ color: "var(--text-2)" }}>Importando cartas…</p>
            </div>
          )}

          {/* ── done ── */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "#10b98122" }}>
                <span className="text-2xl">✓</span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                  {imported} carta{imported !== 1 ? "s" : ""} importada{imported !== 1 ? "s" : ""}
                </p>
                {result && result.drafts > 0 && (
                  <p className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>
                    {result.drafts} rascunho{result.drafts !== 1 ? "s" : ""} — edite para completar
                  </p>
                )}
              </div>
              <button onClick={handleClose}
                className="rounded-lg px-6 py-2 text-sm font-semibold text-white hover:brightness-110"
                style={{ background: "#3b82f6", cursor: "pointer" }}>
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
