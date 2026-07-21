"use client";
import { useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";
import { CardCanvas } from "@/components/card/CardCanvas";
import { EditorForm } from "@/components/editor/EditorForm";
import { CardLibrary } from "@/components/editor/CardLibrary";
import { ExportPanel } from "@/components/editor/ExportPanel";
import { CARD_TYPE_THEME, RARITY_LABEL } from "@/lib/cards/theme";

export default function EditorPage() {
  const { activeCard, isLoading, dbError, fetchLibrary } = useEditorStore();
  const theme     = CARD_TYPE_THEME[activeCard.cardType];
  const cardRef   = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(380);

  // Carrega a biblioteca do banco ao abrir o editor
  useEffect(() => {
    fetchLibrary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carta responsiva ao espaço disponível
  useEffect(() => {
    const el = centerRef.current;
    if (!el) return;
    const compute = (w: number, h: number) => {
      const ASPECT = 1234 / 864;
      const maxByW = w - 64;
      const maxByH = Math.floor((h - 120) / ASPECT);
      setCardWidth(Math.min(maxByW, maxByH, 460));
    };
    const observer = new ResizeObserver(([entry]) =>
      compute(entry.contentRect.width, entry.contentRect.height)
    );
    observer.observe(el);
    compute(el.clientWidth, el.clientHeight);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#16181b]">
      <EditorForm />

      <main
        ref={centerRef}
        className="flex flex-1 flex-col items-center justify-between gap-4 overflow-hidden py-6 px-8"
      >
        {/* topbar */}
        <div className="flex w-full items-center justify-between">
          <a href="/" className="text-xs text-neutral-600 transition-colors hover:text-neutral-400">
            ← Galeria
          </a>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
            Preview ao vivo
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
            style={{ background: theme.accent }}
          >
            {theme.label} · {RARITY_LABEL[activeCard.rarity]}
          </span>
        </div>

        {/* carta */}
        <div className="flex flex-1 items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-neutral-600">
              <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-xs">Sincronizando com o banco…</span>
            </div>
          ) : (
            <CardCanvas ref={cardRef} card={activeCard} width={cardWidth} />
          )}
        </div>

        {/* erro do banco */}
        {dbError && (
          <div className="w-full rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 text-xs text-red-400">
            {dbError}
          </div>
        )}

        {/* rodapé */}
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-neutral-700">
            ID: <span className="font-mono">{activeCard.id.slice(-8)}</span>
          </span>
          <ExportPanel cardRef={cardRef} />
        </div>
      </main>

      <CardLibrary />
    </div>
  );
}
