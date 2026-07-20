"use client";
import { useEditorStore } from "@/store/editorStore";
import { CardCanvas } from "@/components/card/CardCanvas";
import { EditorForm } from "@/components/editor/EditorForm";
import { CardLibrary } from "@/components/editor/CardLibrary";
import { CARD_TYPE_THEME, RARITY_LABEL } from "@/lib/cards/theme";

export default function EditorPage() {
  const { activeCard } = useEditorStore();
  const theme = CARD_TYPE_THEME[activeCard.cardType];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#16181b]">
      <EditorForm />

      <main className="flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden p-8">
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

        <CardCanvas card={activeCard} width={340} />

        <p className="text-xs text-neutral-600">
          ID: <span className="font-mono text-neutral-700">{activeCard.id.slice(-8)}</span>
        </p>
      </main>

      <CardLibrary />
    </div>
  );
}
