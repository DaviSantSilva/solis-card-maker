"use client";
import { useEditorStore } from "@/store/editorStore";
import { CardCanvas } from "@/components/card/CardCanvas";
import { CARD_TYPE_THEME } from "@/lib/cards/theme";

export function CardLibrary() {
  const { library, activeCard, loadCard, duplicateCard, deleteCard } = useEditorStore();

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-l border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Biblioteca · {library.length}
        </p>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto p-3">
        {library.map((card) => {
          const isActive = card.id === activeCard.id;
          const theme = CARD_TYPE_THEME[card.cardType];

          return (
            <div
              key={card.id}
              className={`group relative cursor-pointer rounded-lg transition-all ${
                isActive ? "ring-2 ring-blue-500" : "hover:ring-1 hover:ring-neutral-600"
              }`}
            >
              {/* miniatura — clica para selecionar */}
              <div onClick={() => loadCard(card.id)}>
                <CardCanvas card={card} width={168} />
              </div>

              {/* badge de tipo */}
              <span
                className="absolute left-1 top-1 rounded-sm px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white"
                style={{ background: theme.accent }}
              >
                {theme.label}
              </span>

              {/* ações: aparecem no hover */}
              <div className="absolute inset-0 flex flex-col items-center justify-end gap-1 rounded-lg bg-neutral-950/70 pb-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => loadCard(card.id)}
                  className="rounded bg-blue-700 px-3 py-0.5 text-[10px] font-semibold text-white hover:bg-blue-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => duplicateCard(card.id)}
                  className="rounded bg-neutral-800 px-3 py-0.5 text-[10px] font-medium text-neutral-200 hover:bg-neutral-700"
                >
                  Duplicar
                </button>
                <button
                  onClick={() => { if (confirm(`Apagar "${card.name}"?`)) deleteCard(card.id); }}
                  className="rounded bg-red-900/60 px-3 py-0.5 text-[10px] font-medium text-red-300 hover:bg-red-800/60"
                >
                  Apagar
                </button>
              </div>
            </div>
          );
        })}

        {library.length === 0 && (
          <p className="pt-6 text-center text-[11px] text-neutral-600">Nenhuma carta salva</p>
        )}
      </div>
    </aside>
  );
}
