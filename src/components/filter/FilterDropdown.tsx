"use client";
import { CardType, Rarity, IconKey, AbilityCategory, ABILITY_CATEGORIES } from "@/lib/cards/types";
import { CARD_TYPE_THEME, RARITY_LABEL } from "@/lib/cards/theme";
import { COMPANIES } from "@/lib/cards/companies";
import { GameIcon } from "@/components/card/icons/GameIcon";
import { FilterCriteria } from "@/lib/filter";

/* ── helpers ── */
function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

function Chip({
  active, onClick, children, color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all border ${
        active
          ? "border-blue-500 bg-blue-500/20 text-blue-300"
          : "border-neutral-700 bg-neutral-800/60 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
      }`}
    >
      {color && (
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
      )}
      {children}
    </button>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

const CARD_TYPES = Object.entries(CARD_TYPE_THEME) as [CardType, typeof CARD_TYPE_THEME[CardType]][];
const RARITIES   = Object.entries(RARITY_LABEL)   as [Rarity,   string][];
const COSTS: (number | "X")[] = ["X", 0, 1, 2, 3, 4, 5, 6, 7, 8];

const TAG_ICONS: { key: IconKey; label: string }[] = [
  { key: "trabalho",           label: "Trabalho" },
  { key: "credito",            label: "Crédito" },
  { key: "titanio",            label: "Titânio" },
  { key: "combustivel",        label: "Combustível" },
  { key: "nanoestrutura",      label: "Nanoest." },
  { key: "materia-exotica",    label: "Mat. Exótica" },
  { key: "cat-producao",       label: "Produção" },
  { key: "cat-economia",       label: "Economia" },
  { key: "cat-mercado",        label: "Mercado" },
  { key: "cat-pesquisa",       label: "Pesquisa" },
  { key: "cat-megaengenharia", label: "Megaeng." },
];

export function FilterDropdown({
  filter,
  onChange,
}: {
  filter: FilterCriteria;
  onChange: (f: FilterCriteria) => void;
}) {
  const set = (partial: Partial<FilterCriteria>) => onChange({ ...filter, ...partial });

  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4">

      {/* Tipo */}
      <Section label="Tipo">
        {CARD_TYPES.map(([key, theme]) => (
          <Chip
            key={key}
            active={filter.types.includes(key)}
            color={theme.accent}
            onClick={() => set({ types: toggle(filter.types, key) })}
          >
            {theme.label}
          </Chip>
        ))}
      </Section>

      {/* Raridade */}
      <Section label="Raridade">
        {RARITIES.map(([key, label]) => (
          <Chip
            key={key}
            active={filter.rarities.includes(key)}
            onClick={() => set({ rarities: toggle(filter.rarities, key) })}
          >
            {label}
          </Chip>
        ))}
      </Section>

      {/* Custo */}
      <Section label="Custo">
        {COSTS.map((cost) => (
          <Chip
            key={String(cost)}
            active={filter.costs.includes(cost)}
            onClick={() => set({ costs: toggle(filter.costs, cost) })}
          >
            {cost === "X" ? "X" : cost}
          </Chip>
        ))}
      </Section>

      {/* Tags (coluna esquerda) */}
      <Section label="Tags (coluna esquerda)">
        {TAG_ICONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => set({ tags: toggle(filter.tags, key) })}
            title={label}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
              filter.tags.includes(key)
                ? "border-blue-500 bg-blue-500/20"
                : "border-neutral-700 bg-neutral-800/60 hover:border-neutral-500"
            }`}
          >
            <GameIcon icon={key} className="h-4 w-4 text-neutral-300" />
          </button>
        ))}
      </Section>

      {/* Categoria */}
      <Section label="Categoria de habilidade">
        {ABILITY_CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            active={filter.categories.includes(cat)}
            onClick={() => set({ categories: toggle(filter.categories, cat) })}
          >
            {cat}
          </Chip>
        ))}
      </Section>

      {/* Ícone de habilidade */}
      <Section label="Ícone de habilidade">
        {TAG_ICONS.slice(0, 6).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => set({ abilityIcons: toggle(filter.abilityIcons, key) })}
            title={label}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
              filter.abilityIcons.includes(key)
                ? "border-blue-500 bg-blue-500/20"
                : "border-neutral-700 bg-neutral-800/60 hover:border-neutral-500"
            }`}
          >
            <GameIcon icon={key} className="h-4 w-4 text-neutral-300" />
          </button>
        ))}
      </Section>

      {/* Valor de habilidade (range) */}
      <Section label="Valor da habilidade">
        <div className="flex items-center gap-2 w-full">
          <input
            type="number"
            min={0} max={99}
            placeholder="mín"
            value={filter.abilityValueMin}
            onChange={(e) => set({ abilityValueMin: e.target.value === "" ? "" : Number(e.target.value) })}
            className="w-20 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-neutral-500"
          />
          <span className="text-xs text-neutral-600">até</span>
          <input
            type="number"
            min={0} max={99}
            placeholder="máx"
            value={filter.abilityValueMax}
            onChange={(e) => set({ abilityValueMax: e.target.value === "" ? "" : Number(e.target.value) })}
            className="w-20 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-neutral-500"
          />
        </div>
      </Section>

      {/* Corporação */}
      <Section label="Corporação">
        {COMPANIES.map((company) => (
          <Chip
            key={company.id}
            active={filter.companies.includes(company.id)}
            onClick={() => set({ companies: toggle(filter.companies, company.id) })}
          >
            {company.name}
          </Chip>
        ))}
      </Section>
    </div>
  );
}
