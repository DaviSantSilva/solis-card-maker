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

import { CardType, Rarity, AbilityCategory } from "@/lib/cards/types";

/** Tradução do tipo da carta (exibido na faixa inferior) */
export const CARD_TYPE_TRANSLATIONS: Record<CardType, Record<Locale | "pt", string>> = {
  trabalhador: { pt: "Trabalhador", en: "Worker",      es: "Trabajador",    fr: "Ouvrier",           de: "Arbeiter",             zh: "工人"   },
  investidor:  { pt: "Investidor",  en: "Investor",    es: "Inversor",      fr: "Investisseur",      de: "Investor",             zh: "投资者" },
  ferramenta:  { pt: "Ferramenta",  en: "Tool",        es: "Herramienta",   fr: "Outil",             de: "Werkzeug",             zh: "工具"   },
  agilista:    { pt: "Agilista",    en: "Agile",       es: "Agilista",      fr: "Agiliste",          de: "Agilist",              zh: "敏捷者" },
  diretor:     { pt: "Diretor",     en: "Director",    es: "Director",      fr: "Directeur",         de: "Direktor",             zh: "总监"   },
  tecnico:     { pt: "Técnico",     en: "Technician",  es: "Técnico",       fr: "Technicien",        de: "Techniker",            zh: "技术员" },
  analista:    { pt: "Analista",    en: "Analyst",     es: "Analista",      fr: "Analyste",          de: "Analyst",              zh: "分析师" },
};

/** Tradução da raridade (exibida na faixa inferior ao lado do tipo) */
export const RARITY_TRANSLATIONS: Record<Rarity, Record<Locale | "pt", string>> = {
  comum:   { pt: "Comum",   en: "Common",   es: "Común",        fr: "Commun",       de: "Gewöhnlich",    zh: "普通" },
  incomum: { pt: "Incomum", en: "Uncommon", es: "Poco común",   fr: "Peu commun",   de: "Ungewöhnlich",  zh: "非普通" },
  rara:    { pt: "Rara",    en: "Rare",     es: "Rara",         fr: "Rare",         de: "Selten",        zh: "稀有" },
  unica:   { pt: "Única",   en: "Unique",   es: "Única",        fr: "Unique",       de: "Einzigartig",   zh: "独特" },
  inicial: { pt: "Inicial", en: "Starting", es: "Inicial",      fr: "Départ",       de: "Starter",       zh: "初始" },
};

/** Tradução da categoria de habilidade (exibida acima da caixa de habilidade) */
export const CATEGORY_TRANSLATIONS: Record<AbilityCategory, Record<Locale | "pt", string>> = {
  "Produção":       { pt: "Produção",      en: "Production",      es: "Producción",     fr: "Production",      de: "Produktion",              zh: "生产"   },
  "Economia":       { pt: "Economia",      en: "Economy",         es: "Economía",       fr: "Économie",        de: "Wirtschaft",              zh: "经济"   },
  "Mercado":        { pt: "Mercado",       en: "Market",          es: "Mercado",        fr: "Marché",          de: "Markt",                   zh: "市场"   },
  "Pesquisa":       { pt: "Pesquisa",      en: "Research",        es: "Investigación",  fr: "Recherche",       de: "Forschung",               zh: "研究"   },
  "Megaengenharia": { pt: "Megaengenharia",en: "Megaengineering", es: "Megaingeniería", fr: "Méga-ingénierie", de: "Megaingenieurwesen",       zh: "超级工程" },
};
