import { CardCanvas } from "@/components/card/CardCanvas";
import { SAMPLE_OPERARIO, SAMPLE_INVESTIDOR } from "@/lib/cards/sample-data";
import { CARD_TYPE_THEME, RARITY_LABEL } from "@/lib/cards/theme";

export default function Home() {
  const cards = [SAMPLE_OPERARIO, SAMPLE_INVESTIDOR];

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#16181b] px-6 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-widest text-neutral-100 uppercase">
          Solis <span className="text-base font-normal tracking-normal text-neutral-500 normal-case">Card Maker</span>
        </h1>
      </header>

      <a href="/editor"
        className="mb-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-500 transition-colors">
        Abrir Editor →
      </a>

      <a href="/publicadas"
        className="mb-12 text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
        Ver cartas publicadas
      </a>

      <div className="flex flex-wrap justify-center gap-14">
        {cards.map((card) => {
          const theme = CARD_TYPE_THEME[card.cardType];
          return (
            <div key={card.id} className="flex flex-col items-center gap-4">
              <span className="rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-white"
                style={{ background: theme.accent }}>
                {theme.label}
              </span>
              <CardCanvas card={card} width={320} />
              <span className="text-xs text-neutral-500">
                {theme.label} · {RARITY_LABEL[card.rarity]}
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
