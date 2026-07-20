/**
 * Empresas jogáveis do Solis.
 * Logos ainda a serem finalizados — SVGs abaixo são placeholders geométricos
 * para manter a estrutura de dados pronta. Substituir os componentes Icon
 * quando os designs das corporações forem decididos.
 */
import React from "react";

export interface Company {
  id: string;
  name: string;
  Icon: React.FC<{ className?: string }>;
}

type IconProps = { className?: string };

/** Solis Corp — sol radiante (símbolo central do jogo) */
const SolisIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="24" cy="24" r="7" fill="currentColor" stroke="none" />
    <line x1="24" y1="4"  x2="24" y2="12" />
    <line x1="24" y1="36" x2="24" y2="44" />
    <line x1="4"  y1="24" x2="12" y2="24" />
    <line x1="36" y1="24" x2="44" y2="24" />
    <line x1="10" y1="10" x2="15" y2="15" />
    <line x1="33" y1="33" x2="38" y2="38" />
    <line x1="38" y1="10" x2="33" y2="15" />
    <line x1="15" y1="33" x2="10" y2="38" />
  </svg>
);

/** Corporação A (placeholder) — hexágono */
const CorpAIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
    <polygon points="24,4 40,14 40,34 24,44 8,34 8,14" />
    <polygon points="24,12 33,17 33,31 24,36 15,31 15,17" fill="currentColor" stroke="none" opacity="0.6" />
  </svg>
);

/** Corporação B (placeholder) — diamante/losango */
const CorpBIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
    <polygon points="24,4 44,24 24,44 4,24" />
    <line x1="4" y1="24" x2="44" y2="24" />
    <line x1="24" y1="4" x2="24" y2="44" />
  </svg>
);

/** Corporação C (placeholder) — triângulo ascendente */
const CorpCIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
    <polygon points="24,4 44,40 4,40" />
    <polygon points="24,16 36,36 12,36" fill="currentColor" stroke="none" opacity="0.5" />
  </svg>
);

/** Corporação D (placeholder) — espiral / anéis concêntricos */
const CorpDIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="24" cy="24" r="4" fill="currentColor" stroke="none" />
    <circle cx="24" cy="24" r="10" />
    <circle cx="24" cy="24" r="18" />
  </svg>
);

export const COMPANIES: Company[] = [
  { id: "solis",  name: "Solis Corp",      Icon: SolisIcon },
  { id: "corp-a", name: "Corporação A",    Icon: CorpAIcon },
  { id: "corp-b", name: "Corporação B",    Icon: CorpBIcon },
  { id: "corp-c", name: "Corporação C",    Icon: CorpCIcon },
  { id: "corp-d", name: "Corporação D",    Icon: CorpDIcon },
];

export function getCompany(id: string): Company {
  return COMPANIES.find((c) => c.id === id) ?? COMPANIES[0];
}
