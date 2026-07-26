import { SolisCard } from "./types";

export const SAMPLE_OPERARIO: SolisCard = {
  id: "operario-001",
  cardType: "trabalhador",
  workerTier: "operario",
  name: "Operário",
  subtitle: "Ativo Operacional",
  cost: "X",
  categoryIcon: "cat-producao",
  tagIcons: [null, null, null],
  art: { src: "/sample-art/operario.png" },
  abilityCategory: "Produção",
  abilityIcon: "trabalho",
  abilityValue: 1,
  abilityText: "Gere 1 Trabalho",
  flavorText: "Milhões de quilômetros de estruturas orbitais não se constroem sozinhos.",
  rarity: "comum",
  companyId: "solis",
};

export const SAMPLE_INVESTIDOR: SolisCard = {
  id: "investidor-001",
  cardType: "investidor",
  name: "Investidor",
  subtitle: "Rentista Institucional",
  cost: "X",
  categoryIcon: "cat-economia",
  tagIcons: [null, null, null],
  art: { src: "/sample-art/investidor.png" },
  abilityCategory: "Economia",
  abilityIcon: "credito",
  abilityValue: 1,
  abilityText: "Receba 1 Crédito",
  flavorText: "O dinheiro já não move montanhas. Move sistemas estelares inteiros.",
  rarity: "comum",
  companyId: "corp-a",
};
