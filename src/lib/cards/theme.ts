import { CardType, Rarity } from "./types";

export const CARD_TYPE_THEME: Record<CardType, { label: string; accent: string; accentSoft: string }> = {
  trabalhador: { label: "Trabalhador", accent: "#E13B30", accentSoft: "#F3B3AD" },
  investidor:  { label: "Investidor",  accent: "#6E3FA3", accentSoft: "#C9B3DE" },
  ferramenta:  { label: "Ferramenta",  accent: "#2E8B57", accentSoft: "#A9D3BD" },
  agilista:    { label: "Agilista",    accent: "#1F8FBF", accentSoft: "#A8D6E8" },
  diretor:     { label: "Diretor",     accent: "#B8860B", accentSoft: "#E3CA8B" },
  tecnico:     { label: "Técnico",     accent: "#4A5BA6", accentSoft: "#B6BEE0" },
  analista:    { label: "Analista",    accent: "#C2622A", accentSoft: "#E8B894" },
};

export const RARITY_LABEL: Record<Rarity, string> = {
  comum:   "Comum",
  incomum: "Incomum",
  rara:    "Rara",
  unica:   "Única",
};

