import { CardCanvas } from "@/components/card/CardCanvas";
import { SAMPLE_OPERARIO, SAMPLE_INVESTIDOR } from "@/lib/cards/sample-data";
import { CARD_TYPE_THEME } from "@/lib/cards/theme";

export default function Home() {
  const cards = [SAMPLE_OPERARIO, SAMPLE_INVESTIDOR];

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#16181b] px-6 py-12">
      {/* ===== header ===== */}
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-widest text-neutral-100 uppercase">
          Solis
          <span className="ml-3 text-base font-normal tracking-normal text-neutral-500 normal-case">
            Card Maker
          </span>
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          CardCanvas MVP — renderização fiel ao template
        </p>
      </header>

      {/* ===== grade de preview ===== */}
      <div className="flex flex-wrap justify-center gap-14">
        {cards.map((card) => {
          const theme = CARD_TYPE_THEME[card.cardType];
          return (
            <div key={card.id} className="flex flex-col items-center gap-4">
              {/* badge do tipo */}
              <span
                className="rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-white"
                style={{ background: theme.accent }}
              >
                {theme.label}
              </span>

              {/* a carta em si — largura fixa para o MVP */}
              <div className="w-[320px]">
                <CardCanvas card={card} />
              </div>

              {/* rarity pill */}
              <span className="text-xs text-neutral-500">
                {card.rarity} · {card.expansionLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* ===== rodapé de status ===== */}
      <footer className="mt-16 text-center text-xs text-neutral-600">
        <p>Fase 1 — CardCanvas estático · Próximo: editor de campos + upload de arte</p>
      </footer>
    </main>
  );
}
