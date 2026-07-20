"use client";
import { create } from "zustand";
import { SolisCard, IconKey, Rarity, ABILITY_TEXT_TEMPLATE } from "@/lib/cards/types";
import { SAMPLE_OPERARIO, SAMPLE_INVESTIDOR } from "@/lib/cards/sample-data";

function makeId() {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const BLANK_CARD: SolisCard = {
  id: makeId(),
  cardType: "trabalhador",
  name: "Nova Carta",
  subtitle: "Subtítulo",
  cost: 1,
  categoryIcon: "categoria-trabalho",
  tagIcons: [null, null, null],
  abilityCategory: "Produção",
  abilityIcon: "trabalho",
  abilityValue: 1,
  abilityText: "Gere 1 Trabalho",
  flavorText: "",
  rarity: "comum",
  companyId: "solis",
};

interface EditorState {
  activeCard: SolisCard;
  library: SolisCard[];

  setField: <K extends keyof SolisCard>(key: K, value: SolisCard[K]) => void;
  setTagIcon: (index: number, value: IconKey | null) => void;
  setArtField: (field: "src" | "offsetX" | "offsetY" | "scale", value: string | number) => void;

  /** Atualiza ícone/valor da habilidade e auto-preenche o texto se houver template */
  setAbilityIcon: (icon: IconKey) => void;
  setAbilityValue: (value: number) => void;

  saveCard: () => void;
  loadCard: (id: string) => void;
  duplicateCard: (id: string) => void;
  deleteCard: (id: string) => void;
  newCard: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeCard: { ...SAMPLE_OPERARIO },
  library: [{ ...SAMPLE_OPERARIO }, { ...SAMPLE_INVESTIDOR }],

  setField: (key, value) =>
    set((s) => ({ activeCard: { ...s.activeCard, [key]: value } })),

  setTagIcon: (index, value) =>
    set((s) => {
      const tags = [...(s.activeCard.tagIcons ?? [null, null, null])];
      tags[index] = value;
      return { activeCard: { ...s.activeCard, tagIcons: tags } };
    }),

  setArtField: (field, value) =>
    set((s) => ({
      activeCard: {
        ...s.activeCard,
        art: { ...(s.activeCard.art ?? { src: "" }), [field]: value },
      },
    })),

  setAbilityIcon: (icon) =>
    set((s) => {
      const value = s.activeCard.abilityValue ?? 1;
      const template = ABILITY_TEXT_TEMPLATE[icon];
      const abilityText = template ? template(value) : s.activeCard.abilityText;
      return { activeCard: { ...s.activeCard, abilityIcon: icon, abilityText } };
    }),

  setAbilityValue: (value) =>
    set((s) => {
      const template = ABILITY_TEXT_TEMPLATE[s.activeCard.abilityIcon];
      const abilityText = template ? template(value) : s.activeCard.abilityText;
      return { activeCard: { ...s.activeCard, abilityValue: value, abilityText } };
    }),

  saveCard: () =>
    set((s) => {
      const exists = s.library.some((c) => c.id === s.activeCard.id);
      if (exists) {
        return { library: s.library.map((c) => c.id === s.activeCard.id ? { ...s.activeCard } : c) };
      }
      return { library: [...s.library, { ...s.activeCard }] };
    }),

  loadCard: (id) =>
    set((s) => {
      const card = s.library.find((c) => c.id === id);
      return card ? { activeCard: { ...card } } : s;
    }),

  duplicateCard: (id) =>
    set((s) => {
      const card = s.library.find((c) => c.id === id);
      if (!card) return s;
      const copy = { ...card, id: makeId(), name: card.name + " (cópia)" };
      return { library: [...s.library, copy], activeCard: { ...copy } };
    }),

  deleteCard: (id) =>
    set((s) => {
      const lib = s.library.filter((c) => c.id !== id);
      const active = s.activeCard.id === id
        ? (lib.length > 0 ? { ...lib[0] } : { ...BLANK_CARD, id: makeId() })
        : s.activeCard;
      return { library: lib, activeCard: active };
    }),

  newCard: () =>
    set(() => ({ activeCard: { ...BLANK_CARD, id: makeId() } })),
}));
