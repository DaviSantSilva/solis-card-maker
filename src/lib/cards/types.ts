/**
 * Schema de dados de uma carta de Solis.
 *
 * Este tipo é a "fonte da verdade" consumida pelo CardCanvas para renderizar
 * qualquer carta do jogo. Qualquer editor, importador/exportador de JSON ou
 * futura API deve produzir/consumir objetos neste formato.
 */

/**
 * NOTA DE GAP DE DESIGN (não é decisão minha, é um buraco real no GDD v0.3):
 * a seção 6.1.2 define função mecânica para os tipos "trabalhador" (otimizar
 * geração de trabalho), Ferramenta, Agilista, Diretor, Técnico e Analista —
 * mas o "Investidor" (gerador de Crédito, presente no deck inicial) não tem
 * tipo mecânico mapeado em lugar nenhum do documento. Para os dois exemplos
 * de carta funcionarem aqui, adicionei "investidor" como um 7º valor solto.
 * Vale revisar isso no GDD: ou o Investidor é uma variação do tipo
 * "trabalhador" (produção de Crédito em vez de Trabalho), ou é um tipo à
 * parte com função própria — hoje ele não se encaixa em nenhum dos 6 tipos
 * listados na tabela 6.1.2.
 */
export type CardType =
  | "trabalhador" // Operário / Supervisor / Engenheiro / Especialista
  | "investidor" // gerador de Crédito — sem função mecânica definida no GDD
  | "ferramenta"
  | "agilista"
  | "diretor"
  | "tecnico"
  | "analista";

export type WorkerTier = "operario" | "supervisor" | "engenheiro" | "especialista";

export type Rarity = "comum" | "incomum" | "rara" | "unica";

/**
 * Chaves do conjunto fixo de ícones do jogo (recursos, categorias, raridade...).
 * Diferente da arte central, esses ícones NÃO são upload livre — vêm de uma
 * biblioteca fechada renderizada em SVG (ver src/components/card/icons).
 */
export type IconKey =
  | "trabalho"
  | "credito"
  | "titanio"
  | "combustivel"
  | "nanoestrutura"
  | "materia-exotica"
  | "categoria-trabalho" // engrenagem
  | "categoria-credito" // bolsa de moedas
  | "emblema-asas" // selo do rodapé do exemplo "Operário"
  | "emblema-urna"; // selo do rodapé do exemplo "Investidor"

/**
 * NOTA: o selo circular no rodapé (asas / urna nos dois exemplos) está
 * modelado aqui como "emblema" e não como ícone de raridade. Nos exemplos
 * enviados, os dois selos são símbolos diferentes entre si — isso parece
 * mais um emblema de corporação/facção por carta do que um indicador
 * incremental de raridade (comum→incomum→rara→única). Vale confirmar com
 * Davi o que esse selo representa de fato antes de expandir a biblioteca
 * de ícones — a resposta muda se for "1 emblema por carta" (dezenas de
 * ícones) ou "1 ícone por nível de raridade" (só 4 ícones).
 */

export interface CardArt {
  /** data URL ou caminho da imagem enviada pelo usuário */
  src: string;
  /** deslocamento horizontal em % do quadro de arte, para reenquadrar */
  offsetX?: number;
  /** deslocamento vertical em % do quadro de arte */
  offsetY?: number;
  /** escala (1 = encaixa no quadro) */
  scale?: number;
}

export interface SolisCard {
  id: string;

  cardType: CardType;
  /** Só relevante quando cardType === 'trabalhador' */
  workerTier?: WorkerTier;

  name: string;
  subtitle: string;

  /** Custo em Trabalho para jogar a carta. Pode ser número fixo ou "X". */
  cost: number | "X";

  /** Ícone exibido na 2ª caixa da coluna esquerda (categoria da carta). */
  categoryIcon: IconKey;

  /**
   * Ícones de palavra-chave/tag exibidos nas 3 caixas vazias da coluna
   * esquerda (caixas 3, 4 e 5). Array de até 3 posições; null = caixa vazia.
   */
  tagIcons?: (IconKey | null)[];

  art?: CardArt;

  /** Rótulo da categoria de habilidade, ex: "Produção", "Economia". */
  abilityCategory: string;
  abilityIcon: IconKey;
  /** Valor numérico mostrado dentro do ícone de habilidade (ex.: o "1" de "+1"). */
  abilityValue?: number;
  abilityText: string;

  flavorText?: string;

  rarity: Rarity;

  /** Selo circular do rodapé (ver nota em IconKey sobre emblema vs raridade). */
  emblemIcon: IconKey;

  /** Rótulo da expansão/set mostrado na faixa inferior, ex.: "Inicial". */
  expansionLabel: string;
}
