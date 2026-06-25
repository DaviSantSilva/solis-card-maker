/**
 * Coordenadas (em px, no canvas de desenho 864x1234) de cada zona da carta,
 * medidas a partir do template de margens. Fonte única usada tanto pelo
 * CardFrame (SVG) quanto pelo CardCanvas (overlay de texto/ícones em HTML),
 * para os dois nunca ficarem dessincronizados.
 */
export const CANVAS_W = 864;
export const CANVAS_H = 1234;

export const pctX = (px: number) => (px / CANVAS_W) * 100;
export const pctY = (px: number) => (px / CANVAS_H) * 100;

export const ZONES = {
  costBox: { x: 36, y: 34, w: 114, h: 171 },
  categoryBox: { x: 36, y: 208, w: 114, h: 157 },
  tagBox1: { x: 36, y: 369, w: 114, h: 157 },
  tagBox2: { x: 36, y: 529, w: 114, h: 156 },
  tagBox3: { x: 36, y: 689, w: 114, h: 164 },

  nameBar: { x: 174, y: 34, w: 635, h: 86 },
  subtitleBar: { x: 174, y: 121, w: 580, h: 44 },

  artBox: { x: 154, y: 166, w: 675, h: 686 },

  abilityCategoryLabel: { x: 56, y: 858, w: 300, h: 30 },
  abilityIconBox: { x: 56, y: 905, w: 130, h: 130 },
  abilityText: { x: 206, y: 905, w: 600, h: 130 },

  flavorText: { x: 56, y: 1066, w: 490, h: 78 },
  emblem: { x: 698, y: 1103, r: 38 },

  expansionLabel: { x: 36, y: 1158, w: 793, h: 38 },
} as const;
