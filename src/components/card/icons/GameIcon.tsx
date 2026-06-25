import React from "react";
import { IconKey } from "@/lib/cards/types";

type IconProps = { className?: string };

/** Engrenagem — categoria "produção de Trabalho" */
const GearIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="3">
    <circle cx="24" cy="24" r="8" />
    <path
      strokeLinecap="round"
      d="M24 6v6M24 36v6M6 24h6M36 24h6M11.5 11.5l4.2 4.2M32.3 32.3l4.2 4.2M11.5 36.5l4.2-4.2M32.3 15.7l4.2-4.2"
    />
  </svg>
);

/** Bolsa de moedas — categoria "produção de Crédito" */
const CoinPouchIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 10h12l3 6c4 2 6 6 6 11 0 8-7 13-15 13S9 35 9 27c0-5 2-9 6-11l3-6z" />
    <path strokeLinecap="round" d="M19 10c0-3 2-5 5-5s5 2 5 5" />
    <circle cx="24" cy="26" r="4" />
  </svg>
);

/** Martelo — ícone de produção de Trabalho */
const HammerIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="3.2">
    <rect x="6" y="14" width="14" height="10" rx="2" transform="rotate(-35 13 19)" />
    <line x1="18" y1="24" x2="38" y2="44" strokeLinecap="round" />
  </svg>
);

/** Mão com moeda — ícone de produção de Crédito */
const CoinHandIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="3">
    <circle cx="24" cy="16" r="8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 40c2-7 7-11 16-11s14 4 16 11" />
  </svg>
);

/** Asas — selo de raridade/facção do exemplo "Operário" */
const WingsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="currentColor" stroke="none">
    <path d="M24 12c-3 6-10 9-18 8 5 5 8 12 7 19 6-3 9-9 11-15 2 6 5 12 11 15-1-7 2-14 7-19-8 1-15-2-18-8z" />
  </svg>
);

/** Urna — selo de raridade/facção do exemplo "Investidor" */
const UrnIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="3">
    <ellipse cx="24" cy="14" rx="9" ry="4" />
    <path strokeLinecap="round" d="M15 14c0 10 3 13 3 18a9 9 0 0 0 18 0c0-5 3-8 3-18" />
    <line x1="14" y1="36" x2="34" y2="36" strokeLinecap="round" />
  </svg>
);

const TitanioIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="currentColor"><path d="M24 4 44 16v16L24 44 4 32V16z" opacity="0.85" /></svg>
);
const CombustivelIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="currentColor"><path d="M24 4c8 9 13 16 13 23a13 13 0 1 1-26 0c0-7 5-14 13-23z" /></svg>
);
const NanoestruturaIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="3">
    <circle cx="24" cy="24" r="5" />
    <circle cx="10" cy="14" r="3" /><circle cx="38" cy="14" r="3" />
    <circle cx="10" cy="34" r="3" /><circle cx="38" cy="34" r="3" />
    <path d="M13 16l8 6M35 16l-8 6M13 32l8-6M35 32l-8-6" />
  </svg>
);
const MateriaExoticaIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="currentColor"><path d="M24 4l6 14 14 6-14 6-6 14-6-14-14-6 14-6z" /></svg>
);

const ICONS: Record<IconKey, React.FC<IconProps>> = {
  trabalho: HammerIcon,
  credito: CoinHandIcon,
  titanio: TitanioIcon,
  combustivel: CombustivelIcon,
  nanoestrutura: NanoestruturaIcon,
  "materia-exotica": MateriaExoticaIcon,
  "categoria-trabalho": GearIcon,
  "categoria-credito": CoinPouchIcon,
  "emblema-asas": WingsIcon,
  "emblema-urna": UrnIcon,
};

export function GameIcon({ icon, className }: { icon: IconKey; className?: string }) {
  const Cmp = ICONS[icon];
  return <Cmp className={className} />;
}
