"use client";
import { forwardRef } from "react";
import { SolisCard } from "@/lib/cards/types";
import { CARD_TYPE_THEME, RARITY_LABEL } from "@/lib/cards/theme";
import { CardFrame } from "./CardFrame";
import { GameIcon } from "./icons/GameIcon";
import { ZONES } from "./layout";
import { getCompany } from "@/lib/cards/companies";
import {
  CARD_TYPE_TRANSLATIONS,
  RARITY_TRANSLATIONS,
  CATEGORY_TRANSLATIONS,
} from "@/lib/localization/locales";
import type { Locale } from "@/lib/localization/locales";

function abs(z: { x: number; y: number; w: number; h: number }) {
  return {
    position: "absolute" as const,
    left: z.x, top: z.y, width: z.w, height: z.h,
  };
}

/**
 * Renderiza no tamanho nativo (864×1234 px) e escala via transform:scale.
 * Qualquer width prop funciona sem recalcular nada.
 */
/**
 * `ref` aponta para o div externo (wrapper).
 * O ExportPanel usa esse ref para capturar o inner div (864×1234) em tamanho
 * nativo, removendo temporariamente o transform:scale durante a captura.
 */
export const CardCanvas = forwardRef<
  HTMLDivElement,
  { card: SolisCard; width?: number; locale?: Locale | "pt" }
>(function CardCanvas({ card, width = 320, locale = "pt" }, ref) {
  const NATIVE_W = 864;
  const NATIVE_H = 1234;
  const scale = width / NATIVE_W;
  const theme = CARD_TYPE_THEME[card.cardType];
  const tags = card.tagIcons ?? [null, null, null];
  const tagZones = [ZONES.tagBox1, ZONES.tagBox2, ZONES.tagBox3];
  const company = getCompany(card.companyId);

  // Labels estáticos traduzidos pelo locale
  const typeLabel     = CARD_TYPE_TRANSLATIONS[card.cardType]?.[locale]       ?? theme.label;
  const rarityLabel   = RARITY_TRANSLATIONS[card.rarity]?.[locale]             ?? RARITY_LABEL[card.rarity];
  const categoryLabel = CATEGORY_TRANSLATIONS[card.abilityCategory]?.[locale]  ?? card.abilityCategory;

  return (
    <div ref={ref} style={{
      position: "relative",
      width,
      height: Math.round(NATIVE_H * scale),
      overflow: "hidden",
      borderRadius: Math.round(26 * scale),
      boxShadow: "0 8px 32px rgba(0,0,0,.45)",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: NATIVE_W, height: NATIVE_H,
        /*
         * Este background é o cinza de fundo da carta.
         * Não pode estar no SVG (CardFrame) porque o SVG fica na frente
         * da <img> da arte no DOM — qualquer fill sólido no SVG esconde a imagem.
         */
        background: "#d9dadc",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}>

        {/*
         * ── Área da arte ──
         * Sempre renderizada (com fundo cinza fallback).
         * A <img> fica aqui, ANTES do CardFrame SVG no DOM,
         * então o SVG fica por cima só com suas linhas/bordas,
         * e a área da arte no SVG não tem fill → imagem aparece.
         */}
        <div style={{
          ...abs(ZONES.artBox),
          overflow: "hidden",
          background: "#e0e1e3", // cinza fallback quando não há arte
        }}>
          {card.art?.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.art.src}
              alt=""
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                /* objectPosition omitido — padrão "50% 50%" (centro)
                   permite que translate() e scale() controlem o crop livremente */
                transformOrigin: "50% 50%",
                transform: `translate(${card.art.offsetX ?? 0}%, ${card.art.offsetY ?? 0}%) scale(${card.art.scale ?? 1})`,
              }}
            />
          )}
        </div>

        {/* ── Moldura SVG ── */}
        <CardFrame
          accent={theme.accent}
          accentSoft={theme.accentSoft}
          showSwatch={card.rarity === "inicial"}
          swatchColor={card.playerColor}
        />

        {/* ── Custo ── */}
        <div style={{
          ...abs(ZONES.costBox),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 68, fontWeight: 900, color: "#9b3fc4",
        }}>
          {card.cost}
        </div>

        {/* ── Ícone de categoria (caixa 2 — fundo preto fixo no frame) ── */}
        <div style={{
          ...abs(ZONES.categoryBox),
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 18,
        }}>
          <GameIcon icon={card.categoryIcon} className="h-full w-full text-white" />
        </div>

        {/* ── Slots de tag (caixas 3-5) ── */}
        {tagZones.map((z, i) => (
          <div key={i} style={{ ...abs(z), display: "flex", alignItems: "center", justifyContent: "center" }}>
            {tags[i] ? (
              /* fundo preto quando preenchida, igual à caixa de categoria */
              <div style={{
                position: "absolute", inset: 6,
                borderRadius: 8,
                background: "#16181b",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 14,
              }}>
                <GameIcon icon={tags[i]!} className="h-full w-full text-white" />
              </div>
            ) : null}
          </div>
        ))}

        {/* ── Nome ── */}
        <div style={{
          ...abs(ZONES.nameBar),
          display: "flex", alignItems: "center",
          fontSize: 58, fontWeight: 800, color: "#111",
          paddingLeft: 14, lineHeight: 1,
        }}>
          {card.name}
        </div>

        {/* ── Subtítulo ── */}
        <div style={{
          ...abs(ZONES.subtitleBar),
          display: "flex", alignItems: "center",
          fontSize: 28, color: "#555",
          paddingLeft: 14,
        }}>
          {card.subtitle}
        </div>

        {/* ── Rótulo categoria de habilidade ── */}
        <div style={{
          ...abs(ZONES.abilityCategoryLabel),
          display: "flex", alignItems: "flex-end",
          fontSize: 30, fontWeight: 600, color: "#222",
          paddingLeft: 12, marginTop: 10,
        }}>
          {categoryLabel}
        </div>

        {/* ── Ícone de habilidade ── */}
        <div style={{
          ...abs(ZONES.abilityIconBox),
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {/* ícone com tamanho fixo — não cobre o span do valor */}
          <GameIcon
            icon={card.abilityIcon}
            style={{ width: 72, height: 72, color: "white", flexShrink: 0 }}
          />
          {/* valor no canto inferior direito, sempre branco */}
          {card.abilityValue !== undefined && (
            <span style={{
              position: "absolute", bottom: 6, right: 8,
              fontSize: 28, fontWeight: 800, lineHeight: 1,
              color: "white",
            }}>
              {card.abilityValue}
            </span>
          )}
        </div>

        {/* ── Texto de habilidade ── */}
        <div style={{
          ...abs(ZONES.abilityText),
          display: "flex", alignItems: "center",
          fontSize: 30, fontWeight: 600, color: "#111",
          paddingLeft: 12,
        }}>
          {card.abilityText}
        </div>

        {/* ── Flavor text ── */}
        {card.flavorText && (
          <div style={{
            ...abs(ZONES.flavorText),
            display: "flex", alignItems: "center",
            fontSize: 22, fontStyle: "italic", color: "#666",
            lineHeight: 1.35, paddingLeft: 12, paddingRight: 8,
          }}>
            &ldquo;{card.flavorText}&rdquo;
          </div>
        )}

        {/* ── Logo da empresa (ocupa o espaço do emblema, sem círculo) ── */}
        <company.Icon style={{
          position: "absolute",
          left: ZONES.emblem.x - ZONES.emblem.r,
          top:  ZONES.emblem.y - ZONES.emblem.r,
          width:  ZONES.emblem.r * 2,
          height: ZONES.emblem.r * 2,
        }} />

        {/* ── Faixa inferior: Tipo · Raridade (centralizado) ── */}
        <div style={{
          ...abs(ZONES.expansionLabel),
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, fontSize: 26, fontWeight: 500, color: "#444",
        }}>
          <span>{typeLabel}</span>
          <span style={{ color: "#bbb" }}>·</span>
          <span>{rarityLabel}</span>
        </div>

      </div>
    </div>
  );
});
