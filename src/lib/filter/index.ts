import { SolisCard, CardType, Rarity, IconKey, AbilityCategory } from "@/lib/cards/types";

/** Critérios de filtro — todos opcionais. Arrays vazios = sem filtro naquela dimensão. */
export interface FilterCriteria {
  name:            string;           // busca parcial no nome (case-insensitive)
  types:           CardType[];       // OR entre tipos selecionados
  rarities:        Rarity[];
  costs:           (number | "X")[]; // OR entre custos selecionados
  tags:            IconKey[];        // carta deve ter PELO MENOS UMA das tags
  categories:      AbilityCategory[];
  abilityIcons:    IconKey[];
  abilityValueMin: number | "";      // "" = sem limite inferior
  abilityValueMax: number | "";      // "" = sem limite superior
  companies:       string[];         // companyId
}

export const EMPTY_FILTER: FilterCriteria = {
  name:            "",
  types:           [],
  rarities:        [],
  costs:           [],
  tags:            [],
  categories:      [],
  abilityIcons:    [],
  abilityValueMin: "",
  abilityValueMax: "",
  companies:       [],
};

/** Retorna true se nenhum critério está ativo. */
export function isFilterEmpty(f: FilterCriteria): boolean {
  return (
    !f.name &&
    !f.types.length &&
    !f.rarities.length &&
    !f.costs.length &&
    !f.tags.length &&
    !f.categories.length &&
    !f.abilityIcons.length &&
    f.abilityValueMin === "" &&
    f.abilityValueMax === "" &&
    !f.companies.length
  );
}

/** Conta o número de dimensões de filtro avançado ativas (excluindo nome). */
export function activeFilterCount(f: FilterCriteria): number {
  let n = 0;
  if (f.types.length)        n++;
  if (f.rarities.length)     n++;
  if (f.costs.length)        n++;
  if (f.tags.length)         n++;
  if (f.categories.length)   n++;
  if (f.abilityIcons.length) n++;
  if (f.abilityValueMin !== "" || f.abilityValueMax !== "") n++;
  if (f.companies.length)    n++;
  return n;
}

/** Filtra uma lista de SolisCard com AND entre dimensões, OR dentro de cada uma. */
export function filterCards(cards: SolisCard[], f: FilterCriteria): SolisCard[] {
  if (isFilterEmpty(f)) return cards;

  const name = f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return cards.filter((card) => {
    // nome
    if (name) {
      const cardName = card.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!cardName.includes(name)) return false;
    }

    // tipo
    if (f.types.length && !f.types.includes(card.cardType)) return false;

    // raridade
    if (f.rarities.length && !f.rarities.includes(card.rarity)) return false;

    // custo
    if (f.costs.length && !f.costs.includes(card.cost)) return false;

    // tags — considera TODOS os ícones da coluna esquerda (caixa 2 + caixas 3-5)
    if (f.tags.length) {
      const cardTags: IconKey[] = [
        card.categoryIcon,
        ...((card.tagIcons ?? []).filter(Boolean) as IconKey[]),
      ];
      if (!f.tags.some((t) => cardTags.includes(t))) return false;
    }

    // categoria
    if (f.categories.length && !f.categories.includes(card.abilityCategory)) return false;

    // ícone de habilidade
    if (f.abilityIcons.length && !f.abilityIcons.includes(card.abilityIcon)) return false;

    // valor de habilidade (range)
    const val = card.abilityValue ?? 0;
    if (f.abilityValueMin !== "" && val < Number(f.abilityValueMin)) return false;
    if (f.abilityValueMax !== "" && val > Number(f.abilityValueMax)) return false;

    // corporação
    if (f.companies.length && !f.companies.includes(card.companyId)) return false;

    return true;
  });
}
