"use client";
import { useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";
import { CardCanvas } from "@/components/card/CardCanvas";
import { EditorForm } from "@/components/editor/EditorForm";
import { CardLibrary } from "@/components/editor/CardLibrary";
import { ExportPanel } from "@/components/editor/ExportPanel";
import { PublishPanel } from "@/components/editor/PublishPanel";
import { CARD_TYPE_THEME, RARITY_LABEL } from "@/lib/cards/theme";

export default function EditorPage() {
  const { activeCard, isLoading, dbError, fetchLibrary } = useEditorStore();
  const theme     = CARD_TYPE_THEME[activeCard.cardType];
  const cardRef   = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(380);

  useEffect(() => { fetchLibrary(); }, []); // eslint-disable-line

  useEffect(() => {
    const el = centerRef.current;
    if (!el) return;
    const compute = (w: number, h: number) => {
      const maxByW = w - 64;
      const maxByH = Math.floor((h - 120) / (1234 / 864));
      setCardWidth(Math.min(maxByW, maxByH, 460));
    };
    const obs = new ResizeObserver(([e]) => compute(e.contentRect.width, e.contentRect.height));
    obs.observe(el);
    compute(el.clientWidth, el.clientHeight);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* ── EditorForm ── */}
      <aside className="flex h-full w-72 shrink-0 flex-col border-r"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <EditorForm />
      </aside>

      {/* ── Preview central ── */}
      <main ref={centerRef}
        className="relative flex flex-1 flex-col items-center justify-between overflow-hidden py-5 px-6"
        style={{ background: "var(--bg-base)" }}>

        {/* glow radial ao redor da carta */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${theme.accentSoft}18, transparent 70%)` }} />

        {/* topbar */}
        <div className="relative z-10 flex w-full items-center justify-between">
          <a href="/" className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: "var(--text-3)" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--text-2)")}
            onMouseOut={(e)  => (e.currentTarget.style.color = "var(--text-3)")}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 12L6 8l4-4" />
            </svg>
            Galeria
          </a>

          <PublishPanel />

          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
            style={{ background: theme.accent }}>
            {theme.label} · {RARITY_LABEL[activeCard.rarity]}
          </span>
        </div>

        {/* carta */}
        <div className="relative z-10 flex flex-1 items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3" style={{ color: "var(--text-3)" }}>
              <svg className="h-7 w-7 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <span className="text-xs">Sincronizando…</span>
            </div>
          ) : (
            <CardCanvas ref={cardRef} card={activeCard} width={cardWidth} />
          )}
        </div>

        {/* erro */}
        {dbError && (
          <div className="relative z-10 w-full rounded-lg border px-4 py-2 text-xs"
            style={{ borderColor: "#7f1d1d44", background: "#7f1d1d22", color: "#f87171" }}>
            {dbError}
          </div>
        )}

        {/* rodapé */}
        <div className="relative z-10 flex w-full items-center justify-between">
          <span className="text-xs" style={{ color: "var(--text-3)" }}>
            <span className="font-mono">{activeCard.id.slice(-8)}</span>
          </span>
          <ExportPanel cardRef={cardRef} />
        </div>
      </main>

      {/* ── Biblioteca ── */}
      <aside className="flex h-full shrink-0 border-l"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <CardLibrary />
      </aside>
    </div>
  );
}
