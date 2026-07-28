"use client";
import { create } from "zustand";
import { SolisCard, IconKey, Rarity, ABILITY_TEXT_TEMPLATE } from "@/lib/cards/types";
import { SAMPLE_OPERARIO, SAMPLE_INVESTIDOR } from "@/lib/cards/sample-data";
import { COMPANIES, COMPANY_PLAYER_COLOR } from "@/lib/cards/companies";
import {
  fetchAllCards,
  saveCard as saveCardToDb,
  deleteCard as deleteCardFromDb,
} from "@/lib/supabase/cards.service";

function makeId() {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const BLANK_CARD: SolisCard = {
  id: makeId(),
  cardType: "trabalhador",
  name: "Nova Carta",
  subtitle: "Subtítulo",
  cost: 1,
  categoryIcon: "cat-producao",
  tagIcons: [null, null, null],
  abilityCategory: "Produção",
  abilityIcon: "trabalho",
  abilityValue: 1,
  abilityText: "Gere 1 Trabalho",
  flavorText: "",
  rarity: "comum",
  companyId: "tabajara",
};

interface EditorState {
  activeCard: SolisCard;
  library:    SolisCard[];
  isLoading:  boolean;
  dbError:    string | null;

  // edição local (síncrona)
  setField:        <K extends keyof SolisCard>(key: K, value: SolisCard[K]) => void;
  setTagIcon:      (index: number, value: IconKey | null) => void;
  setArtField:     (field: "src" | "offsetX" | "offsetY" | "scale", value: string | number) => void;
  setAbilityIcon:  (icon: IconKey) => void;
  setAbilityValue: (value: number) => void;
  newCard:         () => void;
  loadCard:        (id: string) => void;

  // operações com banco (assíncronas)
  fetchLibrary:  () => Promise<void>;
  saveCard:      (label?: string) => Promise<void>;
  duplicateCard: (id: string) => Promise<void>;
  deleteCard:    (id: string) => Promise<void>;

  /**
   * Cria 5 variantes da carta ativa — uma por corporação/jogador.
   * Slug: {nomeBase}-{companyId} (ex: "operario-tabajara").
   * Se variantes já existem (mesmo variantGroup), sincroniza-as.
   */
  createVariants: () => Promise<void>;

  /**
   * Propaga o conteúdo da carta ativa para todas as variantes do mesmo grupo,
   * preservando companyId, playerColor e variantGroup de cada uma.
   */
  syncVariants: () => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeCard: { ...SAMPLE_OPERARIO },
  library:    [],          // começa vazio — populado pelo fetchLibrary
  isLoading:  false,
  dbError:    null,

  // ── edição local ────────────────────────────────────────────

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

  newCard: () =>
    set(() => ({ activeCard: { ...BLANK_CARD, id: makeId() } })),

  loadCard: (id) =>
    set((s) => {
      const card = s.library.find((c) => c.id === id);
      return card ? { activeCard: { ...card } } : s;
    }),

  // ── operações com banco ──────────────────────────────────────

  fetchLibrary: async () => {
    set({ isLoading: true, dbError: null });
    try {
      const cards = await fetchAllCards();
      set({
        library:    cards,
        // se não há carta ativa ainda, carrega a primeira da biblioteca
        activeCard: cards.length > 0 ? { ...cards[0] } : { ...BLANK_CARD, id: makeId() },
        isLoading:  false,
      });
    } catch (e) {
      set({ isLoading: false, dbError: (e as Error).message });
    }
  },

  saveCard: async (label) => {
    set({ isLoading: true, dbError: null });
    try {
      const saved = await saveCardToDb(get().activeCard, label);
      // refaz a biblioteca para garantir consistência com o banco
      const library = await fetchAllCards();
      set({ activeCard: saved, library, isLoading: false });
    } catch (e) {
      set({ isLoading: false, dbError: (e as Error).message });
    }
  },

  duplicateCard: async (id) => {
    const card = get().library.find((c) => c.id === id);
    if (!card) return;
    set({ isLoading: true, dbError: null });
    try {
      const copy = { ...card, id: makeId(), name: `${card.name} (cópia)` };
      const saved   = await saveCardToDb(copy, "Duplicada de " + card.name);
      const library = await fetchAllCards();
      set({ activeCard: saved, library, isLoading: false });
    } catch (e) {
      set({ isLoading: false, dbError: (e as Error).message });
    }
  },

  deleteCard: async (id) => {
    const card = get().library.find((c) => c.id === id);
    if (!card) return;
    set({ isLoading: true, dbError: null });
    try {
      // slug derivado do nome (mesma lógica do service)
      const slug = card.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      await deleteCardFromDb(slug);
      const library = await fetchAllCards();
      const active  = library.length > 0 ? { ...library[0] } : { ...BLANK_CARD, id: makeId() };
      set({ library, activeCard: active, isLoading: false });
    } catch (e) {
      set({ isLoading: false, dbError: (e as Error).message });
    }
  },

  createVariants: async () => {
    const base = get().activeCard;
    const variantGroup = base.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    set({ isLoading: true, dbError: null });
    try {
      // Variantes existentes no mesmo grupo
      const existing = get().library.filter((c) => c.variantGroup === variantGroup);
      const existingByCompany = Object.fromEntries(
        existing.map((c) => [c.companyId, c])
      );

      for (const company of COMPANIES) {
        const playerColor = COMPANY_PLAYER_COLOR[company.id];
        const customSlug  = `${variantGroup}-${company.id}`;
        const existing    = existingByCompany[company.id];

        const variant: SolisCard = {
          ...(existing ?? base),   // base para novas, existing para sincronizar
          ...(!existing ? {} : {}), // preserva campos da existente se sincronizando
          // campos que vêm sempre do base (exceto os de identidade da variante)
          ...base,
          id:           existing?.id ?? makeId(),
          companyId:    company.id,
          playerColor,
          variantGroup,
        };

        await saveCardToDb(
          variant,
          existing ? `Sincronização — ${company.name}` : `Criação — ${company.name}`,
          customSlug
        );
      }

      const library = await fetchAllCards();
      set({ library, isLoading: false });
    } catch (e) {
      set({ isLoading: false, dbError: (e as Error).message });
    }
  },

  syncVariants: async () => {
    const base = get().activeCard;
    if (!base.variantGroup) return;

    set({ isLoading: true, dbError: null });
    try {
      const variants = get().library.filter(
        (c) => c.variantGroup === base.variantGroup
      );

      for (const variant of variants) {
        const customSlug = `${base.variantGroup}-${variant.companyId}`;
        const updated: SolisCard = {
          ...base,
          id:           variant.id,
          companyId:    variant.companyId,
          playerColor:  variant.playerColor,
          variantGroup: variant.variantGroup,
        };
        await saveCardToDb(updated, `Sincronização — ${variant.companyId}`, customSlug);
      }

      const library = await fetchAllCards();
      set({ library, isLoading: false });
    } catch (e) {
      set({ isLoading: false, dbError: (e as Error).message });
    }
  },
}));
