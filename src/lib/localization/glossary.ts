import { Locale } from "./locales";

/**
 * Glossário oficial do jogo Solis.
 * Garante que termos de jogo sejam traduzidos de forma consistente
 * em todas as cartas, independente do motor de tradução usado.
 *
 * Atualizar este arquivo sempre que um novo termo for definido no GDD.
 * O glossário é injetado no prompt do Claude de validação.
 */
export const GLOSSARY: Record<string, Partial<Record<Locale, string>>> = {
  // ── Recursos ────────────────────────────────────────────────
  "Trabalho":              { en: "Labor",           es: "Trabajo",              fr: "Travail",              de: "Arbeit",               zh: "劳动"    },
  "Trabalhos":             { en: "Labor",            es: "Trabajos",             fr: "Travaux",              de: "Arbeit",               zh: "劳动"    },
  "Crédito":               { en: "Credit",           es: "Crédito",              fr: "Crédit",               de: "Kredit",               zh: "信用"    },
  "Créditos":              { en: "Credits",          es: "Créditos",             fr: "Crédits",              de: "Kredite",              zh: "信用点"  },
  "Titânio":               { en: "Titanium",         es: "Titanio",              fr: "Titane",               de: "Titan",                zh: "钛"      },
  "Combustível de Fusão":  { en: "Fusion Fuel",      es: "Combustible de Fusión",fr: "Carburant de Fusion",  de: "Fusionskraftstoff",    zh: "聚变燃料" },
  "Combustíveis de Fusão": { en: "Fusion Fuels",     es: "Combustibles de Fusión",fr: "Carburants de Fusion",de: "Fusionskraftstoffe",   zh: "聚变燃料" },
  "Nanoestrutura":         { en: "Nanostructure",    es: "Nanoestructura",       fr: "Nanostructure",        de: "Nanostruktur",         zh: "纳米结构" },
  "Nanoestruturas":        { en: "Nanostructures",   es: "Nanoestructuras",      fr: "Nanostructures",       de: "Nanostrukturen",       zh: "纳米结构" },
  "Matéria Exótica":       { en: "Exotic Matter",    es: "Materia Exótica",      fr: "Matière Exotique",     de: "Exotische Materie",    zh: "奇异物质" },
  "Matérias Exóticas":     { en: "Exotic Matters",   es: "Materias Exóticas",    fr: "Matières Exotiques",   de: "Exotische Materien",   zh: "奇异物质" },

  // ── Instalações ─────────────────────────────────────────────
  "Mina Orbital":          { en: "Orbital Mine",     es: "Mina Orbital",         fr: "Mine Orbitale",        de: "Orbitalmine",          zh: "轨道矿场" },
  "Refinaria de Fusão":    { en: "Fusion Refinery",  es: "Refinería de Fusión",  fr: "Raffinerie de Fusion", de: "Fusionsraffinerie",    zh: "聚变炼厂" },
  "Fábrica de Nanoestruturas": { en: "Nanostructure Factory", es: "Fábrica de Nanoestructuras", fr: "Usine de Nanostructures", de: "Nanostruktur-Fabrik", zh: "纳米结构工厂" },
  "Sintetizador Exótico":  { en: "Exotic Synthesizer",es: "Sintetizador Exótico", fr: "Synthétiseur Exotique",de: "Exotischer Synthesizer",zh: "奇异合成器" },
  "Terminal de Comércio":  { en: "Trade Terminal",   es: "Terminal de Comercio", fr: "Terminal Commercial",  de: "Handelsterminal",      zh: "贸易终端" },
  "Nó de Distribuição":    { en: "Distribution Node",es: "Nodo de Distribución", fr: "Nœud de Distribution", de: "Verteilungsknoten",    zh: "分配节点" },

  // ── Megaestruturas ──────────────────────────────────────────
  "Esfera de Dyson":       { en: "Dyson Sphere",     es: "Esfera de Dyson",      fr: "Sphère de Dyson",      de: "Dyson-Sphäre",         zh: "戴森球"  },
  "Infraestrutura Orbital":{ en: "Orbital Infrastructure", es: "Infraestructura Orbital", fr: "Infrastructure Orbitale", de: "Orbitalinfrastruktur", zh: "轨道基础设施" },
  "Anel Primário":         { en: "Primary Ring",     es: "Anillo Primario",      fr: "Anneau Primaire",      de: "Primärring",           zh: "主环"    },
  "Anel Secundário":       { en: "Secondary Ring",   es: "Anillo Secundario",    fr: "Anneau Secondaire",    de: "Sekundärring",         zh: "次级环"  },
  "Esfera Completa":       { en: "Complete Sphere",  es: "Esfera Completa",      fr: "Sphère Complète",      de: "Vollständige Sphäre",  zh: "完整球体" },

  // ── Pontuação e mecânicas ────────────────────────────────────
  "Influência Galáctica":  { en: "Galactic Influence",es: "Influencia Galáctica", fr: "Influence Galactique", de: "Galaktischer Einfluss",zh: "银河影响力" },
  "IG":                    { en: "GI",                es: "IG",                   fr: "IG",                   de: "GE",                   zh: "GI"      },
  "Direito de Construção": { en: "Construction Right",es: "Derecho de Construcción",fr: "Droit de Construction",de: "Baurecht",            zh: "建设权"  },

  // ── Tipos de carta ───────────────────────────────────────────
  "Trabalhador":           { en: "Worker",            es: "Trabajador",           fr: "Ouvrier",              de: "Arbeiter",             zh: "工人"    },
  "Investidor":            { en: "Investor",          es: "Inversor",             fr: "Investisseur",         de: "Investor",             zh: "投资者"  },
  "Ferramenta":            { en: "Tool",              es: "Herramienta",          fr: "Outil",                de: "Werkzeug",             zh: "工具"    },
  "Agilista":              { en: "Agile",             es: "Agilista",             fr: "Agiliste",             de: "Agilist",              zh: "敏捷者"  },
  "Diretor":               { en: "Director",          es: "Director",             fr: "Directeur",            de: "Direktor",             zh: "总监"    },
  "Técnico":               { en: "Technician",        es: "Técnico",              fr: "Technicien",           de: "Techniker",            zh: "技术员"  },
  "Analista":              { en: "Analyst",           es: "Analista",             fr: "Analyste",             de: "Analyst",              zh: "分析师"  },

  // ── Ações comuns em textos de cartas ────────────────────────
  "Gere":                  { en: "Generate",          es: "Genera",               fr: "Générez",              de: "Erzeuge",              zh: "生成"    },
  "Produza":               { en: "Produce",           es: "Produce",              fr: "Produisez",            de: "Produziere",           zh: "生产"    },
  "Receba":                { en: "Gain",              es: "Recibe",               fr: "Recevez",              de: "Erhalte",              zh: "获得"    },
  "Descarte":              { en: "Discard",           es: "Descarta",             fr: "Défaussez",            de: "Wirf ab",              zh: "弃置"    },
  "Remova":                { en: "Remove",            es: "Elimina",              fr: "Retirez",              de: "Entferne",             zh: "移除"    },
  "Compre":                { en: "Draw",              es: "Roba",                 fr: "Piochez",              de: "Ziehe",                zh: "抽取"    },
};

/**
 * Serializa o glossário em formato de texto para injeção no prompt do Claude.
 */
export function buildGlossaryPrompt(locale: Locale): string {
  const lines = Object.entries(GLOSSARY)
    .filter(([, translations]) => translations[locale])
    .map(([ptTerm, translations]) => `  "${ptTerm}" → "${translations[locale]}"`)
    .join("\n");

  return `GLOSSÁRIO OFICIAL DO JOGO SOLIS (PT → ${locale.toUpperCase()}):\n${lines}`;
}
