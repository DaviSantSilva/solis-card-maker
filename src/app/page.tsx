import { CardCanvas } from "@/components/card/CardCanvas";
import { SAMPLE_OPERARIO, SAMPLE_INVESTIDOR } from "@/lib/cards/sample-data";
import { CARD_TYPE_THEME, RARITY_LABEL } from "@/lib/cards/theme";

export default function Home() {
  const cards = [SAMPLE_OPERARIO, SAMPLE_INVESTIDOR];

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden"
      style={{ background: "var(--bg-base)" }}>

      {/* glow de fundo sutil */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />
      </div>

      {/* hero */}
      <section className="relative z-10 flex w-full max-w-5xl flex-col items-center px-6 pb-16 pt-24 text-center">
        {/* badge */}
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text-3)", background: "var(--bg-surface)" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Solis Card Maker
        </span>

        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ color: "var(--text-1)" }}>
          Crie e publique<br />
          <span style={{ color: "var(--text-3)" }}>cartas para o seu mod</span>
        </h1>

        <p className="mb-10 max-w-md text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
          Editor visual com exportação em alta resolução e publicação automática
          para o Tabletop Simulator via manifest público.
        </p>

        <div className="flex items-center gap-3">
          <a href="/editor"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
            style={{ background: "var(--accent)", boxShadow: "0 0 24px var(--accent-glow)" }}>
            Abrir Editor
          </a>
          <a href="/publicadas"
            className="rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-2)", background: "var(--bg-surface)" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--text-1)")}
            onMouseOut={(e)  => (e.currentTarget.style.color = "var(--text-2)")}>
            Ver publicadas
          </a>
        </div>
      </section>

      {/* preview de cartas */}
      <section className="relative z-10 flex w-full justify-center gap-8 px-6 pb-24">
        {cards.map((card) => {
          const theme = CARD_TYPE_THEME[card.cardType];
          return (
            <div key={card.id} className="flex flex-col items-center gap-3">
              <div className="transition-transform duration-300 hover:-translate-y-2"
                style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.6))" }}>
                <CardCanvas card={card} width={240} />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: theme.accent }} />
                <span className="text-xs" style={{ color: "var(--text-3)" }}>
                  {theme.label} · {RARITY_LABEL[card.rarity]}
                </span>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
