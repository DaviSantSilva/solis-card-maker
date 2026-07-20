"use client";
import { useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";
import { CardCanvas } from "@/components/card/CardCanvas";
import { EditorForm } from "@/components/editor/EditorForm";
import { CardLibrary } from "@/components/editor/CardLibrary";
import { ExportPanel } from "@/components/editor/ExportPanel";
import { CARD_TYPE_THEME, RARITY_LABEL } from "@/lib/cards/theme";

export default function EditorPage() {
  const { activeCard } = useEditorStore();
  const theme = CARD_TYPE_THEME[activeCard.cardType];

  const cardRef   = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(380);

  /* ── Calcula o maior tamanho de carta que cabe no centro ── */
  useEffect(() => {
    const el = centerRef.current;
    if (!el) return;

    const compute = (w: number, h: number) => {
      const PAD_X  = 64;   // padding horizontal total
      const PAD_Y  = 120;  // espaço para topbar + metadados + botão de exportar
      const ASPECT = 1234 / 864;
      const CAP    = 460;  // largura máxima (para não ficar gigante em telas wide)

      const maxByW = w - PAD_X;
      const maxByH = Math.floor((h - PAD_Y) / ASPECT);
      setCardWidth(Math.min(maxByW, maxByH, CAP));
    };

    const observer = new ResizeObserver(([entry]) => {
      compute(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(el);
    compute(el.clientWidth, el.clientHeight);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#16181b]">

      {/* ─── esquerda: formulário ─── */}
      <EditorForm />

      {/* ─── centro ─── */}
      <main
        ref={centerRef}
        className="flex flex-1 flex-col items-center justify-between gap-4 overflow-hidden py-6 px-8"
      >
        {/* topbar */}
        <div className="flex w-full items-center justify-between">
          <a
            href="/"
            className="text-xs text-neutral-600 transition-colors hover:text-neutral-400"
          >
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

        {/* carta — ocupa o espaço central */}
        <div className="flex flex-1 items-center justify-center">
          <CardCanvas ref={cardRef} card={activeCard} width={cardWidth} />
        </div>

        {/* rodapé: id + botão de exportar */}
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-neutral-700">
            ID:{" "}
            <span className="font-mono">{activeCard.id.slice(-8)}</span>
          </span>
          <ExportPanel cardRef={cardRef} />
        </div>
      </main>

      {/* ─── direita: biblioteca ─── */}
      <CardLibrary />
    </div>
  );
}
