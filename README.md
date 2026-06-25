# Solis Card Maker

Editor de cartas para o jogo de tabuleiro **Solis** — renderização pixel-fiel ao template, exportação PNG, suporte a todos os tipos e raridades.

---

## Setup rápido

```bash
npm install
npm run dev
```

Abra `http://localhost:3000` no browser.

---

## Arquitetura do CardCanvas

A carta renderiza em **dois estágios**:

```
wrapper div  ← define o espaço de display (ex.: 320 × 457 px)
  └─ inner div (864 × 1234 px, reduzido via transform:scale)
       ├─ <img> arte de fundo (clipada pela art box)
       ├─ <CardFrame> SVG da moldura (sobre a arte)
       └─ divs absolutas de texto/ícones (sobre o SVG)
```

Passar `width` no prop escala a carta para qualquer tamanho:

```tsx
<CardCanvas card={card} width={280} />   // sidebar
<CardCanvas card={card} width={1728} />  // export 2x
```

---

## Estrutura de ficheiros

```
src/
├── app/
│   ├── layout.tsx
│   └── page.tsx             — preview MVP (dois exemplos)
├── components/card/
│   ├── CardCanvas.tsx       — componente principal
│   ├── CardFrame.tsx        — moldura SVG recolorida por tipo
│   ├── layout.ts            — coordenadas das zonas (canvas 864×1234)
│   └── icons/GameIcon.tsx   — ícones fixos do jogo
└── lib/cards/
    ├── types.ts             — schema SolisCard
    ├── theme.ts             — paletas por tipo
    └── sample-data.ts       — Operário e Investidor
```

---

## ⚠️ Design gap detectado

O Investidor (deck inicial, gerador de Crédito) não tem tipo mecânico definido
na seção 6.1.2 do GDD — foi adicionado aqui como 7º tipo provisório.
Decisão pendente: sub-variante de `trabalhador` ou tipo próprio?

---

## Roadmap

| # | Fase | Status |
|---|---|---|
| 1 | CardCanvas MVP — renderização fiel | ✅ |
| 2 | Editor de campos + upload de arte | ⬜ |
| 3 | Biblioteca de cartas (grid + CRUD) | ⬜ |
| 4 | Persistência IndexedDB + import/export JSON | ⬜ |
| 5 | Exportação PNG individual + ZIP em lote | ⬜ |
| 6 | Print sheet A4 com marcas de corte | ⬜ |
