"use client";
import { SolisCard } from "@/lib/cards/types";
import { LOCALES, Locale } from "@/lib/localization/locales";
import { saveTranslation, updateTranslationStatus } from "@/lib/supabase/translations.service";
import { usePipelineStore } from "@/store/pipelineStore";
import { CARD_TYPE_THEME } from "@/lib/cards/theme";

interface TranslationFields {
  name:         string;
  subtitle:     string;
  ability_text: string;
  flavor_text:  string | null;
}

/* ── chamada ao DeepL via API route ─────────────────────────── */

async function callDeepL(texts: string[], locale: Locale): Promise<string[]> {
  const res = await fetch("/api/translate/deepl", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ texts, locale }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? "Falha no DeepL");
  }

  const data = await res.json();
  return data.translations as string[];
}

/* ── pipeline por locale ─────────────────────────────────────── */

async function translateLocale(
  card:      SolisCard,
  cardId:    string,
  versionId: string,
  locale:    Locale,
  store:     ReturnType<typeof usePipelineStore.getState>
): Promise<void> {
  store.updateLocaleStatus(cardId, locale, "translating");
  await updateTranslationStatus(cardId, locale, "translating");

  const ptFields: TranslationFields = {
    name:         card.name,
    subtitle:     card.subtitle,
    ability_text: card.abilityText,
    flavor_text:  card.flavorText ?? null,
  };

  const textsToTranslate = [
    ptFields.name,
    ptFields.subtitle,
    ptFields.ability_text,
    ptFields.flavor_text ?? "",
  ];

  // 1. DeepL
  store.addStep(cardId, { label: "Traduzindo com DeepL", status: "running", locale });
  const deepLTexts = await callDeepL(textsToTranslate, locale);
  store.addStep(cardId, { label: "DeepL concluído", status: "done", locale });

  // 2. Salva direto no banco (sem validação Claude por enquanto)
  store.addStep(cardId, { label: "Salvando no banco", status: "running", locale });
  await saveTranslation(cardId, locale, {
    name:              deepLTexts[0],
    subtitle:          deepLTexts[1],
    ability_text:      deepLTexts[2],
    flavor_text:       ptFields.flavor_text ? deepLTexts[3] : undefined,
    status:            "done",
    source_version_id: versionId,
    is_stale:          false,
    confidence:        undefined,
    pipeline_notes:    "Traduzido automaticamente via DeepL",
    translated_by:     "auto",
    is_reviewed:       false,
  });
  store.addStep(cardId, { label: "Salvo", status: "done", locale });

  store.updateLocaleStatus(cardId, locale, "done");
}

/* ── entrada pública da pipeline ────────────────────────────── */

/**
 * Traduz automaticamente a carta para os 5 idiomas configurados.
 * Todos os locales rodam em paralelo. Cada um atualiza o pipelineStore
 * e o banco em tempo real conforme avança.
 *
 * Não-bloqueante: deve ser chamado com .catch() mas sem await no saveCard.
 *
 * @param card      Carta com `_cardId` preenchido (retornado pelo saveCard)
 * @param versionId ID da versão recém-salva (card_versions.id)
 */
export async function translateCard(
  card:      SolisCard,
  versionId: string
): Promise<void> {
  const cardId = card._cardId;
  if (!cardId) {
    console.warn("translateCard: _cardId ausente, pipeline abortada");
    return;
  }

  const theme = CARD_TYPE_THEME[card.cardType];
  const store = usePipelineStore.getState();

  store.startJob({
    cardId,
    cardName:   card.name,
    cardType:   card.cardType,
    cardAccent: theme.accent,
  });

  // Todos os 5 idiomas em paralelo — cada um atualiza independentemente
  await Promise.all(
    LOCALES.map((locale) =>
      translateLocale(card, cardId, versionId, locale, store).catch(async (e) => {
        const msg = (e as Error).message;
        console.error(`Tradução ${locale} falhou:`, msg);
        store.addStep(cardId, { label: `Erro: ${msg}`, status: "error", locale });
        store.updateLocaleStatus(cardId, locale, "error", msg);
        await updateTranslationStatus(cardId, locale, "error", { error_message: msg }).catch(() => {});
      })
    )
  );
}
