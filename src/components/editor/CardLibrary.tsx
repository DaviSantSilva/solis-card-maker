"use client";
import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { CardCanvas } from "@/components/card/CardCanvas";
import { CARD_TYPE_THEME } from "@/lib/cards/theme";
import { SolisCard } from "@/lib/cards/types";
import { FilterBar } from "@/components/filter/FilterBar";
import { FilterCriteria, EMPTY_FILTER, filterCards } from "@/lib/filter";

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

/* ── raio de borda exato do CardCanvas em width=168px ──
   CardCanvas: borderRadius = Math.round(26 * scale) = Math.round(26 * 168/864) = 5px
   Usado nos overlays de ring para que sigam a forma da carta */
const CARD_RADIUS_168 = Math.round(26 * (168 / 864)); // 5

/* ── modal de variantes ── */
function VariantModal({
  item, open, onClose, activeCardId, onLoad, onDuplicate, onDelete,
}: {
  item: Extract<LibraryItem, { type: "group" }>;
  open: boolean;
  onClose: () => void;
  activeCardId: string;
  onLoad: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!open) return null;

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* painel */}
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-neutral-100">{item.name}</p>
            <p className="text-xs text-neutral-500">{item.cards.length} variantes</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
          >
            ✕
          </button>
        </div>

        {/* grid de variantes */}
        <div className="grid grid-cols-2 gap-4 overflow-y-auto p-5 sm:grid-cols-3"
          style={{ maxHeight: "70vh" }}>
          {item.cards.map((card) => {
            const isActive = card.id === activeCardId;
            return (
              <div key={card.id} className="flex flex-col gap-2">
                {/* miniatura */}
                <div
                  className={`relative cursor-pointer rounded-xl transition-all ${
                    isActive ? "ring-2 ring-blue-500" : "hover:ring-1 hover:ring-neutral-600"
                  }`}
                  onClick={() => { onLoad(card.id); onClose(); }}
                >
                  <CardCanvas card={card} width={150} />
                  {/* dot de cor */}
                  {card.playerColor && (
                    <span
                      className="absolute right-1.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-neutral-900 shadow"
                      style={{ background: card.playerColor }}
                    />
                  )}
                </div>

                {/* ações */}
                <div className="flex gap-1">
                  <button
                    onClick={() => { onLoad(card.id); onClose(); }}
                    className="flex-1 rounded-md bg-blue-700/80 py-1 text-[10px] font-semibold text-white hover:bg-blue-600 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDuplicate(card.id)}
                    className="rounded-md border border-neutral-700 px-2 py-1 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
                    title="Duplicar"
                  >
                    ⊕
                  </button>
                  <button
                    onClick={() => { if (confirm(`Apagar variante?`)) onDelete(card.id); }}
                    className="rounded-md border border-neutral-700 px-2 py-1 text-[10px] text-red-500/70 hover:text-red-400 transition-colors"
                    title="Apagar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── stack de variantes ── */
function VariantStack({
  item, activeCardId, onLoad, onDuplicate, onDelete,
}: {
  item: Extract<LibraryItem, { type: "group" }>;
  activeCardId: string;
  onLoad: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const front  = item.cards[0];
  const others = item.cards.slice(1, 3); // máximo 2 camadas traseiras
  const isGroupActive = item.cards.some((c) => c.id === activeCardId);

  // offsets das camadas traseiras em repouso e no hover
  const restOffset  = [{ x: -4, y: 4, r: -1.2 }, { x: -8, y: 8, r: -2.4 }];
  const hoverOffset = [{ x: -14, y: 10, r: -6  }, { x: -26, y: 16, r: -11 }];

  return (
    <>
      <div
        className="relative cursor-pointer select-none"
        style={{
          width: 168,
          // altura extra para o fan não cortar
          paddingBottom: others.length * 10,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setModalOpen(true)}
      >
        {/* camadas traseiras */}
        {others.map((card, i) => {
          const off = hovered ? hoverOffset[i] : restOffset[i];
          return (
            <div
              key={card.id}
              className="absolute inset-0 overflow-hidden rounded-[10px]"
              style={{
                transform: `translate(${off.x}px, ${off.y}px) rotate(${off.r}deg)`,
                transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                zIndex: others.length - i,
                background: card.playerColor
                  ? `${card.playerColor}28`
                  : "#23252a",
                border: `2px solid ${card.playerColor ?? "#3a3d42"}44`,
              }}
            />
          );
        })}

        {/* carta da frente */}
        <div
          className="relative"
          style={{
            zIndex: 10,
            transform: hovered ? "translateY(-6px)" : "translateY(0)",
            transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            filter: hovered ? "drop-shadow(0 12px 24px rgba(0,0,0,.6))" : "none",
          }}
        >
          <CardCanvas card={front} width={168} />

          {/* ring quando uma variante está ativa */}
          {isGroupActive && (
            <div
              className="absolute inset-0 pointer-events-none ring-2 ring-blue-500"
              style={{ borderRadius: CARD_RADIUS_168 }}
            />
          )}

          {/* dots de cor dos jogadores */}
          <div className="absolute bottom-8 right-2 flex flex-col gap-1">
            {item.cards.map((c) =>
              c.playerColor ? (
                <span
                  key={c.id}
                  className="h-2.5 w-2.5 rounded-full border border-neutral-900 shadow"
                  style={{ background: c.playerColor }}
                />
              ) : null
            )}
          </div>

          {/* badge de contagem */}
          <div className="absolute left-1 top-1 rounded-md bg-neutral-900/80 px-1.5 py-0.5 text-[9px] font-bold text-neutral-400 backdrop-blur-sm">
            {item.cards.length} vars
          </div>
        </div>
      </div>

      <VariantModal
        item={item}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        activeCardId={activeCardId}
        onLoad={onLoad}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    </>
  );
}

/* ── card individual ── */
function CardItem({ card, isActive, onLoad, onDuplicate, onDelete }: {
  card: SolisCard; isActive: boolean;
  onLoad: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const theme = CARD_TYPE_THEME[card.cardType];
  return (
    /* w-fit garante que o div wrapper não se estique para preencher
       o flex-col pai (w-64), evitando que o ring ultrapasse o card */
    <div className="group relative w-fit cursor-pointer">
      <div onClick={onLoad}><CardCanvas card={card} width={168} /></div>

      {isActive ? (
        <div
          className="absolute inset-0 pointer-events-none ring-2 ring-blue-500"
          style={{ borderRadius: CARD_RADIUS_168 }}
        />
      ) : (
        <div
          className="absolute inset-0 pointer-events-none ring-1 ring-neutral-600 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ borderRadius: CARD_RADIUS_168 }}
        />
      )}

      <span
        className="absolute left-1 top-1 rounded-sm px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white"
        style={{ background: theme.accent }}
      >
        {theme.label}
      </span>
      <div
        className="absolute inset-0 flex flex-col items-center justify-end gap-1 bg-neutral-950/70 pb-2 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ borderRadius: CARD_RADIUS_168 }}
      >
        <button onClick={onLoad} className="rounded bg-blue-700 px-3 py-0.5 text-[10px] font-semibold text-white hover:bg-blue-600">Editar</button>
        <button onClick={onDuplicate} className="rounded bg-neutral-800 px-3 py-0.5 text-[10px] font-medium text-neutral-200 hover:bg-neutral-700">Duplicar</button>
        <button onClick={onDelete} className="rounded bg-red-900/60 px-3 py-0.5 text-[10px] font-medium text-red-300 hover:bg-red-800/60">Apagar</button>
      </div>
    </div>
  );
}

/* ── painel principal ── */
export function CardLibrary() {
  const { library, activeCard, loadCard, duplicateCard, deleteCard } = useEditorStore();
  const [filter, setFilter] = useState<FilterCriteria>(EMPTY_FILTER);

  const filtered    = filterCards(library, filter);

  // Sempre agrupa por variantGroup — o filtro só reduz quais cartas aparecem,
  // não remove o comportamento de stack. Grupos com 1 carta após o filtro
  // são rebaixados para carta individual.
  const rawItems = groupLibrary(filtered);
  const items = rawItems.map((item) =>
    item.type === "group" && item.cards.length === 1
      ? { type: "single" as const, card: item.cards[0] }
      : item
  );

  const groups  = items.filter((i) => i.type === "group").length;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-l border-neutral-800 bg-neutral-900">
      <div className="flex flex-col gap-3 border-b border-neutral-800 px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Biblioteca · {library.length}
          {groups > 0 && (
            <span className="ml-1 text-neutral-600">
              ({groups} grupo{groups !== 1 ? "s" : ""})
            </span>
          )}
        </p>
        <FilterBar
          filter={filter}
          onChange={setFilter}
          resultCount={filtered.length}
          totalCount={library.length}
        />
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto p-3">
        {items.map((item) =>
          item.type === "single" ? (
            <CardItem
              key={item.card.id}
              card={item.card}
              isActive={item.card.id === activeCard.id}
              onLoad={() => loadCard(item.card.id)}
              onDuplicate={() => duplicateCard(item.card.id)}
              onDelete={() => { if (confirm(`Apagar "${item.card.name}"?`)) deleteCard(item.card.id); }}
            />
          ) : (
            <VariantStack
              key={item.variantGroup}
              item={item}
              activeCardId={activeCard.id}
              onLoad={loadCard}
              onDuplicate={duplicateCard}
              onDelete={deleteCard}
            />
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
