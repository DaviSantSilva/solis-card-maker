/**
 * Schema de dados de uma carta de Solis.
 * Fonte da verdade consumida pelo CardCanvas, editor, e futura persistência.
 */

/**
 * GAP DE DESIGN (GDD v0.3 §6.1.2): "Investidor" não tem tipo mecânico
 * definido na tabela dos 6 tipos. Adicionado como 7º tipo provisório —
 * decidir se é sub-variante de trabalhador ou tipo próprio.
 */
export type CardType =
  | "trabalhador"
  | "investidor"
  | "ferramenta"
  | "agilista"
  | "diretor"
  | "tecnico"
  | "analista";

export type WorkerTier = "operario" | "supervisor" | "engenheiro" | "especialista";

export type Rarity = "comum" | "incomum" | "rara" | "unica";

/**
 * Ícones fixos do jogo — NÃO são upload livre.
 * Vêm de uma biblioteca SVG fechada (GameIcon).
 */
export type IconKey =
  | "trabalho"
  | "credito"
  | "titanio"
  | "combustivel"
  | "nanoestrutura"
  | "materia-exotica"
  | "categoria-trabalho"
  | "categoria-credito";

/**
 * Categorias de habilidade disponíveis como select no editor.
 */
export const ABILITY_CATEGORIES = [
  "Produção",
  "Economia",
  "Mercado",
  "Pesquisa",
  "Megaengenharia",
  "Operações",
  "Finanças",
  "Comércio",
  "Pesquisa & Desenvolvimento",
  "Infraestrutura",
] as const;

export type AbilityCategory = typeof ABILITY_CATEGORIES[number];

/**
 * Template automático de texto de habilidade com base no ícone + valor.
 * Editável pelo usuário após auto-preenchimento.
 */
export const ABILITY_TEXT_TEMPLATE: Partial<Record<IconKey, (v: number) => string>> = {
  trabalho: (v) => `Gere ${v} Trabalho`,
  credito: (v) => `Receba ${v} Crédito`,
  titanio: (v) => `Produza ${v} Titânio`,
  combustivel: (v) => `Produza ${v} Combustível de Fusão`,
  nanoestrutura: (v) => `Produza ${v} Nanoestruturas`,
  "materia-exotica": (v) => `Produza ${v} Matéria Exótica`,
};

export interface CardArt {
  src: string;
  /** deslocamento horizontal em % — alimenta transform:translate */
  offsetX?: number;
  /** deslocamento vertical em % */
  offsetY?: number;
  /** escala (1 = preenche o quadro) */
  scale?: number;
}

export interface SolisCard {
  id: string;

  cardType: CardType;
  workerTier?: WorkerTier;

  name: string;
  subtitle: string;

  cost: number | "X";

  /** Ícone na 2ª caixa da coluna esquerda */
  categoryIcon: IconKey;
  /** Até 3 ícones de tag (caixas 3-5). null = caixa vazia */
  tagIcons?: (IconKey | null)[];

  art?: CardArt;

  abilityCategory: AbilityCategory;
  abilityIcon: IconKey;
  abilityValue?: number;
  /** Auto-preenchido a partir de abilityIcon + abilityValue, editável */
  abilityText: string;

  flavorText?: string;

  rarity: Rarity;

  /**
   * ID da empresa dona da carta — define o logo no círculo do rodapé.
   * Ver src/lib/cards/companies.ts.
   */
  companyId: string;
}
