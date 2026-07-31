import { SolisCard, CardType, Rarity, IconKey, AbilityCategory } from "@/lib/cards/types";
import { COMPANIES } from "@/lib/cards/companies";

/* ── campos obrigatórios para carta completa ── */
const REQUIRED_FIELDS: (keyof SolisCard | "art.src")[] = [
  "name", "subtitle", "cost", "cardType", "rarity", "companyId",
  "categoryIcon", "tagIcons",
  "abilityCategory", "abilityIcon", "abilityValue", "abilityText",
  "flavorText", "quantity", "art.src",
];

/** Retorna lista de campos obrigatórios ausentes ou vazios. */
export function getMissingFields(card: Partial<SolisCard>): string[] {
  const missing: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (field === "art.src") {
      if (!card.art?.src) missing.push("art (imagem)");
      continue;
    }
    if (field === "tagIcons") {
      if (!Array.isArray(card.tagIcons)) missing.push("tagIcons");
      continue;
    }
    if (field === "abilityValue") {
      if (card.abilityValue === undefined || card.abilityValue === null)
        missing.push("abilityValue");
      continue;
    }
    if (field === "cost") {
      if (card.cost === undefined || card.cost === null)
        missing.push("cost");
      continue;
    }
    const val = card[field as keyof SolisCard];
    if (val === undefined || val === null || val === "") missing.push(field);
  }

  return missing;
}

/** Valores padrão para campos ausentes — garante carta válida mesmo incompleta. */
const DEFAULTS: Partial<SolisCard> = {
  cardType:        "trabalhador"  as CardType,
  rarity:          "comum"        as Rarity,
  companyId:       COMPANIES[0].id,
  categoryIcon:    "trabalho"     as IconKey,
  tagIcons:        [null, null, null],
  abilityCategory: "Produção"     as AbilityCategory,
  abilityIcon:     "trabalho"     as IconKey,
  abilityValue:    1,
  abilityText:     "",
  subtitle:        "",
  flavorText:      "",
  quantity:        1,
  cost:            1,
};

/** Resultado do parse de um único item do JSON. */
export interface ImportedCard {
  card:          SolisCard;
  isDraft:       boolean;
  missingFields: string[];
  originalIndex: number;
}

/** Resultado completo do parse do arquivo. */
export interface ImportResult {
  cards:   ImportedCard[];
  total:   number;
  drafts:  number;
  errors:  { index: number; message: string }[];
}

/**
 * Faz o parse de um JSON de import (array de SolisCard parciais).
 * Normaliza campos, aplica defaults, detecta rascunhos.
 */
export function parseImportJSON(raw: unknown): ImportResult {
  if (!Array.isArray(raw)) {
    throw new Error("O arquivo deve conter um array JSON de cartas.");
  }

  const cards:  ImportedCard[] = [];
  const errors: { index: number; message: string }[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (typeof item !== "object" || item === null) {
      errors.push({ index: i, message: "Item não é um objeto válido." });
      continue;
    }

    try {
      const partial = item as Partial<SolisCard>;

      // Aplica defaults nos campos ausentes
      const normalized: SolisCard = {
        ...DEFAULTS,
        ...partial,
        // garante que tagIcons seja array mesmo se veio como null
        tagIcons: Array.isArray(partial.tagIcons)
          ? partial.tagIcons
          : [null, null, null],
        // ID temporário — será substituído pelo banco ao salvar
        id: crypto.randomUUID(),
      } as SolisCard;

      const missingFields = getMissingFields(normalized);
      const isDraft       = missingFields.length > 0;

      cards.push({
        card:          { ...normalized, isDraft },
        isDraft,
        missingFields,
        originalIndex: i,
      });
    } catch (e) {
      errors.push({ index: i, message: (e as Error).message });
    }
  }

  return {
    cards,
    total:  cards.length,
    drafts: cards.filter((c) => c.isDraft).length,
    errors,
  };
}
