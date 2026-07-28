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
  inicial: "Inicial",
};

/**
 * Cores dos 5 jogadores — mesmas das corporações.
 * Usadas no swatch do canto inferior esquerdo das cartas iniciais.
 */
export const PLAYER_COLORS: { id: string; name: string; color: string }[] = [
  { id: "p1", name: "Vermelho", color: "#FF0000" }, // Tabajara Corporation
  { id: "p2", name: "Branco",   color: "#FFFFFE" }, // Zenite Industries
  { id: "p3", name: "Verde",    color: "#1E5C00" }, // Atomic Dynamics
  { id: "p4", name: "Azul",     color: "#0073DC" }, // Atto Tech
  { id: "p5", name: "Roxo",     color: "#6C1CB6" }, // Core Labs
];
