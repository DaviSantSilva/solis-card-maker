"use client";
import { SolisCard } from "@/lib/cards/types";
import { CARD_TYPE_THEME } from "@/lib/cards/theme";
import { CardFrame } from "./CardFrame";
import { GameIcon } from "./icons/GameIcon";
import { ZONES } from "./layout";

/**
 * Posiciona um elemento no canvas nativo de 864×1234, em px absolutos.
 * O container externo (wrapper) escala tudo via transform:scale.
 */
function abs(z: { x: number; y: number; w: number; h: number }) {
  return {
    position: "absolute" as const,
    left: z.x,
    top: z.y,
    width: z.w,
    height: z.h,
  };
}

/**
 * A carta sempre renderiza no tamanho nativo (864 × 1234 px) e é escalonada
 * para caber no `width` desejado via `transform: scale`. Isso garante que:
 *  - rem/px funcionam no SSR sem container queries
 *  - a carta fica pixel-perfect em qualquer tamanho de display
 *  - html-to-image para exportação funciona ao renderizar em escala 1
 *
 * @prop width  largura de exibição em px (default: 320)
 */
export function CardCanvas({ card, width = 320 }: { card: SolisCard; width?: number }) {
  const NATIVE_W = 864;
  const NATIVE_H = 1234;
  const scale = width / NATIVE_W;
  const theme = CARD_TYPE_THEME[card.cardType];
  const tags = card.tagIcons ?? [null, null, null];
  const tagZones = [ZONES.tagBox1, ZONES.tagBox2, ZONES.tagBox3];

  return (
    /* wrapper: define o espaço de display real */
    <div
      style={{
        position: "relative",
        width,
        height: Math.round(NATIVE_H * scale),
        overflow: "hidden",
        borderRadius: Math.round(26 * scale),
        boxShadow: "0 8px 32px rgba(0,0,0,.45)",
      }}
    >
      {/* inner: canvas nativo escalado */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: NATIVE_W,
          height: NATIVE_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {/* arte — fica por baixo da moldura SVG */}
        {card.art && (
          <div
            style={{
              ...abs(ZONES.artBox),
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.art.src}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
                transform: `translate(${card.art.offsetX ?? 0}%, ${card.art.offsetY ?? 0}%) scale(${card.art.scale ?? 1})`,
              }}
            />
          </div>
        )}

        {/* moldura SVG (sobre a arte, abaixo do texto) */}
        <CardFrame accent={theme.accent} accentSoft={theme.accentSoft} />

        {/* ===== CUSTO ===== */}
        <div
          style={{
            ...abs(ZONES.costBox),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 68,
            fontWeight: 900,
            color: "#9b3fc4",
          }}
        >
          {card.cost}
        </div>

        {/* ===== ÍCONE DE CATEGORIA ===== */}
        <div
          style={{
            ...abs(ZONES.categoryBox),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
        >
          <GameIcon icon={card.categoryIcon} className="h-full w-full text-white" />
        </div>

        {/* ===== SLOTS DE TAG ===== */}
        {tagZones.map((z, i) => (
          <div
            key={i}
            style={{
              ...abs(z),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            {tags[i] && <GameIcon icon={tags[i]!} className="h-full w-full text-neutral-600" />}
          </div>
        ))}

        {/* ===== NOME ===== */}
        <div
          style={{
            ...abs(ZONES.nameBar),
            display: "flex",
            alignItems: "center",
            fontSize: 58,
            fontWeight: 800,
            color: "#111",
            paddingLeft: 14,
            lineHeight: 1,
          }}
        >
          {card.name}
        </div>

        {/* ===== SUBTÍTULO ===== */}
        <div
          style={{
            ...abs(ZONES.subtitleBar),
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            color: "#555",
            paddingLeft: 14,
          }}
        >
          {card.subtitle}
        </div>

        {/* ===== RÓTULO CATEGORIA HABILIDADE ===== */}
        <div
          style={{
            ...abs(ZONES.abilityCategoryLabel),
            display: "flex",
            alignItems: "flex-end",
            fontSize: 30,
            fontWeight: 600,
            color: "#222",
            paddingLeft: 12,
            marginTop: 10,
          }}
        >
          {card.abilityCategory}
        </div>

        {/* ===== ÍCONE HABILIDADE ===== */}
        <div
          style={{
            ...abs(ZONES.abilityIconBox),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            color: theme.accent,
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <GameIcon icon={card.abilityIcon} className="h-full w-full" />
            {card.abilityValue !== undefined && (
              <span
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 4,
                  fontSize: 26,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: theme.accent,
                }}
              >
                {card.abilityValue}
              </span>
            )}
          </div>
        </div>

        {/* ===== TEXTO HABILIDADE ===== */}
        <div
          style={{
            ...abs(ZONES.abilityText),
            display: "flex",
            alignItems: "center",
            fontSize: 30,
            fontWeight: 600,
            color: "#111",
            paddingLeft: 12,
          }}
        >
          {card.abilityText}
        </div>

        {/* ===== FLAVOR TEXT ===== */}
        {card.flavorText && (
          <div
            style={{
              ...abs(ZONES.flavorText),
              display: "flex",
              alignItems: "center",
              fontSize: 22,
              fontStyle: "italic",
              color: "#666",
              lineHeight: 1.35,
              paddingLeft: 12,
              paddingRight: 8,
            }}
          >
            &ldquo;{card.flavorText}&rdquo;
          </div>
        )}

        {/* ===== EMBLEMA (círculo no rodapé) ===== */}
        <div
          style={{
            position: "absolute",
            left: ZONES.emblem.x - ZONES.emblem.r,
            top: ZONES.emblem.y - ZONES.emblem.r,
            width: ZONES.emblem.r * 2,
            height: ZONES.emblem.r * 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.accent,
          }}
        >
          <GameIcon icon={card.emblemIcon} className="h-[60%] w-[60%]" />
        </div>

        {/* ===== RÓTULO DE EXPANSÃO ===== */}
        <div
          style={{
            ...abs(ZONES.expansionLabel),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 500,
            color: "#444",
          }}
        >
          {card.expansionLabel}
        </div>
      </div>
    </div>
  );
}
