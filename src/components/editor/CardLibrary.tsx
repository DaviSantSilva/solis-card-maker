"use client";
import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { CardCanvas } from "@/components/card/CardCanvas";
import { CARD_TYPE_THEME } from "@/lib/cards/theme";
import { SolisCard } from "@/lib/cards/types";
import { FilterBar } from "@/components/filter/FilterBar";
import { FilterCriteria, EMPTY_FILTER, filterCards, isFilterEmpty } from "@/lib/filter";

/* ── agrupamento ── */
type LibraryItem =
  | { type: "single"; card: SolisCard }
  | { type: "group"; variantGroup: string; name: string; cards: SolisCard[] };

function groupLibrary(cards: SolisCard[]): LibraryItem[] {
  const groups: Record<string, SolisCard[]> = {};
  const singles: SolisCard[] = [];
  for (const card of cards) {
    if (card.variantGroup) {
      if (!groups[card.variantGroup]) groups[card.variantGroup] = [];
      groups[card.variantGroup].push(card);
    } else {
      singles.push(card);
    }
  }
  return [
    ...singles.map((card) => ({ type: "single" as const, card })),
    ...Object.entries(groups).map(([key, cards]) => ({
      type: "group" as const,
      variantGroup: key,
      name: cards[0].name,
      cards,
    })),
  ];
}

/* ── card individual ── */
function CardItem({ card, isActive, onLoad, onDuplicate, onDelete }: {
  card: SolisCard; isActive: boolean;
  onLoad: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const theme = CARD_TYPE_THEME[card.cardType];
  return (
    <div className={`group relative cursor-pointer rounded-lg transition-all ${
      isActive ? "ring-2 ring-blue-500" : "hover:ring-1 hover:ring-neutral-600"
    }`}>
      <div onClick={onLoad}><CardCanvas card={card} width={168} /></div>
      <span className="absolute left-1 top-1 rounded-sm px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white"
        style={{ background: theme.accent }}>{theme.label}</span>
      {card.playerColor && (
        <span className="absolute right-1 top-1 h-3 w-3 rounded-full border border-neutral-900"
          style={{ background: card.playerColor }} title="Cor do jogador" />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-end gap-1 rounded-lg bg-neutral-950/70 pb-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onLoad} className="rounded bg-blue-700 px-3 py-0.5 text-[10px] font-semibold text-white hover:bg-blue-600">Editar</button>
        <button onClick={onDuplicate} className="rounded bg-neutral-800 px-3 py-0.5 text-[10px] font-medium text-neutral-200 hover:bg-neutral-700">Duplicar</button>
        <button onClick={onDelete} className="rounded bg-red-900/60 px-3 py-0.5 text-[10px] font-medium text-red-300 hover:bg-red-800/60">Apagar</button>
      </div>
    </div>
  );
}

/* ── grupo de variantes ── */
function VariantGroup({ item, activeCardId, onLoad, onDuplicate, onDelete }: {
  item: Extract<LibraryItem, { type: "group" }>;
  activeCardId: string;
  onLoad: (id: string) => void; onDuplicate: (id: string) => void; onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const colors = item.cards.map((c) => c.playerColor).filter(Boolean);
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-neutral-800 bg-neutral-800/20 p-2">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between text-left">
        <span className="text-[10px] font-semibold text-neutral-400 truncate">{item.name}</span>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {colors.map((c, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full border border-neutral-700"
              style={{ background: c! }} />
          ))}
          <svg className={`h-3 w-3 text-neutral-600 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6 5-6z" /></svg>
        </div>
      </button>
      {open && (
        <div className="flex flex-col gap-2 pt-1">
          {item.cards.map((card) => (
            <CardItem key={card.id} card={card} isActive={card.id === activeCardId}
              onLoad={() => onLoad(card.id)} onDuplicate={() => onDuplicate(card.id)}
              onDelete={() => { if (confirm(`Apagar variante?`)) onDelete(card.id); }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── painel principal ── */
export function CardLibrary() {
  const { library, activeCard, loadCard, duplicateCard, deleteCard } = useEditorStore();
  const [filter, setFilter] = useState<FilterCriteria>(EMPTY_FILTER);

  const filtered     = filterCards(library, filter);
  const useGrouping  = isFilterEmpty(filter); // agrupa só quando sem filtro
  const items        = useGrouping ? groupLibrary(filtered) : filtered.map((c) => ({ type: "single" as const, card: c }));
  const groups       = items.filter((i) => i.type === "group").length;

  return (
    /* w-64 = 256px — mais largo para comportar o filtro */
    <aside className="flex h-full w-64 shrink-0 flex-col border-l border-neutral-800 bg-neutral-900">
      {/* header + search */}
      <div className="flex flex-col gap-3 border-b border-neutral-800 px-3 py-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Biblioteca · {library.length}
            {groups > 0 && <span className="ml-1 text-neutral-600">({groups} grupo{groups !== 1 ? "s" : ""})</span>}
          </p>
        </div>
        <FilterBar
          filter={filter}
          onChange={setFilter}
          resultCount={filtered.length}
          totalCount={library.length}
        />
      </div>

      {/* lista */}
      <div className="flex flex-col gap-3 overflow-y-auto p-3">
        {items.map((item) =>
          item.type === "single" ? (
            <CardItem key={item.card.id} card={item.card}
              isActive={item.card.id === activeCard.id}
              onLoad={() => loadCard(item.card.id)}
              onDuplicate={() => duplicateCard(item.card.id)}
              onDelete={() => { if (confirm(`Apagar "${item.card.name}"?`)) deleteCard(item.card.id); }} />
          ) : (
            <VariantGroup key={item.variantGroup} item={item}
              activeCardId={activeCard.id}
              onLoad={loadCard} onDuplicate={duplicateCard} onDelete={deleteCard} />
          )
        )}
        {library.length === 0 && (
          <p className="pt-6 text-center text-[11px] text-neutral-600">Nenhuma carta salva</p>
        )}
        {library.length > 0 && filtered.length === 0 && (
          <p className="pt-6 text-center text-[11px] text-neutral-600">Nenhuma carta encontrada</p>
        )}
      </div>
    </aside>
  );
}
