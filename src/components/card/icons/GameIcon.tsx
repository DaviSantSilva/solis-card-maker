import React from "react";
import { IconKey } from "@/lib/cards/types";

type IconProps = { className?: string };

const GearIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="3">
    <circle cx="24" cy="24" r="8" />
    <path strokeLinecap="round"
      d="M24 6v6M24 36v6M6 24h6M36 24h6M11.5 11.5l4.2 4.2M32.3 32.3l4.2 4.2M11.5 36.5l4.2-4.2M32.3 15.7l4.2-4.2" />
  </svg>
);

const CoinPouchIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M18 10h12l3 6c4 2 6 6 6 11 0 8-7 13-15 13S9 35 9 27c0-5 2-9 6-11l3-6z" />
    <path strokeLinecap="round" d="M19 10c0-3 2-5 5-5s5 2 5 5" />
    <circle cx="24" cy="26" r="4" />
  </svg>
);

const HammerIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="3.2">
    <rect x="6" y="14" width="14" height="10" rx="2" transform="rotate(-35 13 19)" />
    <line x1="18" y1="24" x2="38" y2="44" strokeLinecap="round" />
  </svg>
);

const CoinHandIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="3">
    <circle cx="24" cy="16" r="8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 40c2-7 7-11 16-11s14 4 16 11" />
  </svg>
);

const TitanioIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="currentColor">
    <path d="M24 4 44 16v16L24 44 4 32V16z" opacity="0.85" />
  </svg>
);

const CombustivelIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} fill="currentColor">
    <path d="M24 4c8 9 13 16 13 23a13 13 0 1 1-26 0c0-7 5-14 13-23z" />
  </svg>
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
  <svg viewBox="0 0 48 48" className={className} fill="currentColor">
    <path d="M24 4l6 14 14 6-14 6-6 14-6-14-14-6 14-6z" />
  </svg>
);

const ICONS: Record<IconKey, React.FC<IconProps>> = {
  trabalho:           HammerIcon,
  credito:            CoinHandIcon,
  titanio:            TitanioIcon,
  combustivel:        CombustivelIcon,
  nanoestrutura:      NanoestruturaIcon,
  "materia-exotica":  MateriaExoticaIcon,
  "categoria-trabalho": GearIcon,
  "categoria-credito":  CoinPouchIcon,
};

export function GameIcon({ icon, className }: { icon: IconKey; className?: string }) {
  const Cmp = ICONS[icon];
  return <Cmp className={className} />;
}
