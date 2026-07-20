"use client";
import { useRef } from "react";
import { useEditorStore } from "@/store/editorStore";
import { CardCanvas } from "@/components/card/CardCanvas";
import { EditorForm } from "@/components/editor/EditorForm";
import { CardLibrary } from "@/components/editor/CardLibrary";
import { ExportPanel } from "@/components/editor/ExportPanel";
import { CARD_TYPE_THEME, RARITY_LABEL } from "@/lib/cards/theme";

export default function EditorPage() {
  const { activeCard } = useEditorStore();
  const theme = CARD_TYPE_THEME[activeCard.cardType];
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#16181b]">
      {/* ─── painel esquerdo: formulário ─── */}
      <EditorForm />

      {/* ─── centro: preview + exportar ─── */}
      <main className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto p-8">
        {/* topbar */}
        <div className="flex w-full max-w-sm items-center justify-between">
          <a href="/" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
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
        <CardCanvas ref={cardRef} card={activeCard} width={340} />

        {/* metadados */}
        <p className="text-xs text-neutral-600">
          ID: <span className="font-mono text-neutral-700">{activeCard.id.slice(-8)}</span>
        </p>

        {/* painel de exportação */}
        <div className="w-full max-w-sm">
          <ExportPanel cardRef={cardRef} />
        </div>
      </main>

      {/* ─── painel direito: biblioteca ─── */}
      <CardLibrary />
    </div>
  );
}
