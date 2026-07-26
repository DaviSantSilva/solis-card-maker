"use client";
import { useEditorStore } from "@/store/editorStore";
import {
  FieldRow, TextInput, TextArea, SelectInput, NumberInput, SectionDivider,
} from "@/components/ui/fields";
import { ArtDropzone } from "./ArtDropzone";
import { IconPicker } from "./IconPicker";
import { CARD_TYPE_THEME, RARITY_LABEL } from "@/lib/cards/theme";
import { COMPANIES } from "@/lib/cards/companies";
import {
  CardType, IconKey, Rarity, AbilityCategory, ABILITY_CATEGORIES,
} from "@/lib/cards/types";

const CARD_TYPE_OPTIONS: { value: CardType; label: string }[] =
  Object.entries(CARD_TYPE_THEME).map(([k, v]) => ({ value: k as CardType, label: v.label }));

const RARITY_OPTIONS: { value: Rarity; label: string }[] =
  Object.entries(RARITY_LABEL).map(([k, v]) => ({ value: k as Rarity, label: v }));

const ABILITY_CATEGORY_OPTIONS: { value: AbilityCategory; label: string }[] =
  ABILITY_CATEGORIES.map((c) => ({ value: c, label: c }));

const COMPANY_OPTIONS = COMPANIES.map((c) => ({ value: c.id, label: c.name }));

export function EditorForm() {
  const { activeCard, setField, setTagIcon, setAbilityIcon, setAbilityValue, saveCard, newCard } =
    useEditorStore();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col overflow-y-auto border-r border-neutral-800 bg-neutral-900">
      {/* toolbar */}
      <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
        <button onClick={newCard}
          className="flex-1 rounded-md border border-neutral-700 py-1.5 text-xs font-medium text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors">
          + Nova
        </button>
        <button onClick={() => saveCard()}
          className="flex-1 rounded-md bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors">
          Salvar
        </button>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">

        {/* ── IDENTIDADE ── */}
        <SectionDivider label="Identidade" />

        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Tipo">
            <SelectInput<CardType>
              value={activeCard.cardType}
              onChange={(v) => setField("cardType", v)}
              options={CARD_TYPE_OPTIONS}
            />
          </FieldRow>
          <FieldRow label="Raridade">
            <SelectInput<Rarity>
              value={activeCard.rarity}
              onChange={(v) => setField("rarity", v)}
              options={RARITY_OPTIONS}
            />
          </FieldRow>
        </div>

        <FieldRow label="Nome">
          <TextInput value={activeCard.name} onChange={(v) => setField("name", v)} placeholder="Nome da carta" />
        </FieldRow>

        <FieldRow label="Subtítulo">
          <TextInput value={activeCard.subtitle} onChange={(v) => setField("subtitle", v)} placeholder="Ex: Ativo Operacional" />
        </FieldRow>

        <FieldRow label="Custo (número ou X)">
          <TextInput
            value={String(activeCard.cost)}
            onChange={(v) => setField("cost", v === "X" || v === "x" ? "X" : isNaN(Number(v)) ? "X" : Number(v))}
            placeholder="1 ou X"
          />
        </FieldRow>

        {/* ── ARTE ── */}
        <SectionDivider label="Arte" />
        <ArtDropzone />

        {/* ── COLUNA ESQUERDA ── */}
        <SectionDivider label="Coluna esquerda" />

        <FieldRow label="Ícone de categoria (caixa 2)">
          <IconPicker
            value={activeCard.categoryIcon}
            onChange={(v) => v && setField("categoryIcon", v as IconKey)}
          />
        </FieldRow>

        {[0, 1, 2].map((i) => (
          <FieldRow key={i} label={`Tag ${i + 1} (caixa ${i + 3})`}>
            <IconPicker
              value={activeCard.tagIcons?.[i] ?? null}
              onChange={(v) => setTagIcon(i, v as IconKey | null)}
              allowNull
            />
          </FieldRow>
        ))}

        {/* ── HABILIDADE ── */}
        <SectionDivider label="Habilidade" />

        <FieldRow label="Categoria">
          <SelectInput<AbilityCategory>
            value={activeCard.abilityCategory}
            onChange={(v) => setField("abilityCategory", v)}
            options={ABILITY_CATEGORY_OPTIONS}
          />
        </FieldRow>

        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Ícone">
            <IconPicker
              value={activeCard.abilityIcon}
              onChange={(v) => v && setAbilityIcon(v as IconKey)}
            />
          </FieldRow>
          <FieldRow label="Valor">
            <NumberInput
              value={activeCard.abilityValue ?? 1}
              onChange={(v) => setAbilityValue(v)}
              min={0} max={99}
            />
          </FieldRow>
        </div>

        <FieldRow label="Texto da habilidade">
          <TextArea
            value={activeCard.abilityText}
            onChange={(v) => setField("abilityText", v)}
            rows={2}
          />
        </FieldRow>

        {/* ── RODAPÉ ── */}
        <SectionDivider label="Rodapé" />

        <FieldRow label="Flavor text">
          <TextArea value={activeCard.flavorText ?? ""} onChange={(v) => setField("flavorText", v)} rows={3} />
        </FieldRow>

        <FieldRow label="Empresa (emblema)">
          <SelectInput<string>
            value={activeCard.companyId}
            onChange={(v) => setField("companyId", v)}
            options={COMPANY_OPTIONS}
          />
        </FieldRow>

      </div>
    </aside>
  );
}
