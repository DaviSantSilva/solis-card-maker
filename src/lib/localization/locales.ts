/**
 * Idiomas suportados pelo sistema de localização.
 * Português (pt) é a língua principal — não está nesta lista
 * porque nunca é "traduzido", é sempre a fonte.
 */
export const LOCALES = ["en", "es", "fr", "de", "zh"] as const;
export type Locale = typeof LOCALES[number];

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "Inglês",
  es: "Espanhol",
  fr: "Francês",
  de: "Alemão",
  zh: "Chinês Simplificado",
};

export const LOCALE_FLAG: Record<Locale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  zh: "🇨🇳",
};

/** Campos de uma SolisCard que precisam de tradução manual */
export const TRANSLATABLE_FIELDS = ["name", "subtitle", "abilityText", "flavorText"] as const;
export type TranslatableField = typeof TRANSLATABLE_FIELDS[number];

/** Status possíveis de uma tradução */
export type TranslationStatus = "pending" | "translating" | "done" | "stale" | "error";
