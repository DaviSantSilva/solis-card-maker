"use client";
import { useEditorStore } from "@/store/editorStore";
import { FieldRow, TextInput, TextArea, SelectInput, NumberInput, SectionDivider } from "@/components/ui/fields";
import { ArtDropzone } from "./ArtDropzone";
import { IconPicker } from "./IconPicker";
import { CARD_TYPE_THEME, RARITY_LABEL, PLAYER_COLORS } from "@/lib/cards/theme";
import { COMPANIES } from "@/lib/cards/companies";
import { CardType, IconKey, Rarity, AbilityCategory, ABILITY_CATEGORIES } from "@/lib/cards/types";

const CARD_TYPE_OPTIONS = Object.entries(CARD_TYPE_THEME).map(([k, v]) => ({ value: k as CardType, label: v.label }));
const RARITY_OPTIONS    = Object.entries(RARITY_LABEL).map(([k, v]) => ({ value: k as Rarity, label: v }));
const ABILITY_CATEGORY_OPTIONS = ABILITY_CATEGORIES.map((c) => ({ value: c as AbilityCategory, label: c }));
const COMPANY_OPTIONS   = COMPANIES.map((c) => ({ value: c.id, label: c.name }));

export function EditorForm() {
  const { activeCard, setField, setTagIcon, setAbilityIcon, setAbilityValue,
          saveCard, newCard, createVariants, syncVariants } = useEditorStore();

  return (
    <div className="flex h-full flex-col">
      {/* toolbar */}
      <div className="flex items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: "var(--border)" }}>
        <button onClick={newCard}
          className="flex-1 rounded-lg border py-2 text-xs font-medium transition-colors hover:border-neutral-500 hover:text-white"
          style={{ borderColor: "var(--border)", color: "var(--text-2)", background: "transparent" }}>
          + Nova
        </button>
        <button onClick={() => saveCard()}
          className="flex-1 rounded-lg py-2 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
          style={{ background: "#3b82f6" }}>
          Salvar
        </button>
      </div>

      <div className="flex flex-col gap-3.5 overflow-y-auto px-4 py-4">

        <SectionDivider label="Identidade" />

        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Tipo">
            <SelectInput<CardType> value={activeCard.cardType}
              onChange={(v) => setField("cardType", v)} options={CARD_TYPE_OPTIONS} />
          </FieldRow>
          <FieldRow label="Raridade">
            <SelectInput<Rarity> value={activeCard.rarity}
              onChange={(v) => setField("rarity", v)} options={RARITY_OPTIONS} />
          </FieldRow>
        </div>

        {activeCard.rarity === "inicial" && (
          <FieldRow label="Cor do jogador">
            <div className="flex gap-2">
              {PLAYER_COLORS.map((p) => (
                <button key={p.id} type="button" title={p.name}
                  onClick={() => setField("playerColor", p.color)}
                  className="h-7 w-7 rounded-md border-2 transition-transform hover:scale-110"
                  style={{ background: p.color, borderColor: activeCard.playerColor === p.color ? "white" : "transparent" }} />
              ))}
            </div>
          </FieldRow>
        )}

        {activeCard.rarity === "inicial" && (
          <div className="flex flex-col gap-2 rounded-lg border p-3"
            style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
              Variantes por jogador
            </p>
            <button type="button" onClick={() => createVariants()}
              className="rounded-lg py-2 text-xs font-semibold text-white transition-all hover:brightness-110"
              style={{ background: "#059669" }}>
              {activeCard.variantGroup ? "↺ Sincronizar variantes" : "✦ Criar para todos os jogadores"}
            </button>
            {activeCard.variantGroup && (
              <button type="button" onClick={() => syncVariants()}
                className="rounded-lg border py-2 text-xs transition-colors hover:border-neutral-500 hover:text-white"
                style={{ borderColor: "var(--border)", color: "var(--text-2)" }}>
                ↺ Sincronizar só esta variante
              </button>
            )}
          </div>
        )}

        <FieldRow label="Nome">
          <TextInput value={activeCard.name} onChange={(v) => setField("name", v)} placeholder="Nome da carta" />
        </FieldRow>
        <FieldRow label="Subtítulo">
          <TextInput value={activeCard.subtitle} onChange={(v) => setField("subtitle", v)} placeholder="Ex: Ativo Operacional" />
        </FieldRow>
        <FieldRow label="Custo">
          <TextInput value={String(activeCard.cost)}
            onChange={(v) => setField("cost", v === "X" || v === "x" ? "X" : isNaN(Number(v)) ? "X" : Number(v))}
            placeholder="1 ou X" />
        </FieldRow>

        <SectionDivider label="Arte" />
        <ArtDropzone />

        <SectionDivider label="Coluna esquerda" />
        <FieldRow label="Ícone de categoria (caixa 2)">
          <IconPicker value={activeCard.categoryIcon}
            onChange={(v) => v && setField("categoryIcon", v as IconKey)} />
        </FieldRow>
        {[0, 1, 2].map((i) => (
          <FieldRow key={i} label={`Tag ${i + 1} (caixa ${i + 3})`}>
            <IconPicker value={activeCard.tagIcons?.[i] ?? null}
              onChange={(v) => setTagIcon(i, v as IconKey | null)} allowNull />
          </FieldRow>
        ))}

        <SectionDivider label="Habilidade" />
        <FieldRow label="Categoria">
          <SelectInput<AbilityCategory> value={activeCard.abilityCategory}
            onChange={(v) => setField("abilityCategory", v)} options={ABILITY_CATEGORY_OPTIONS} />
        </FieldRow>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Ícone">
            <IconPicker value={activeCard.abilityIcon}
              onChange={(v) => v && setAbilityIcon(v as IconKey)} />
          </FieldRow>
          <FieldRow label="Valor">
            <NumberInput value={activeCard.abilityValue ?? 1}
              onChange={(v) => setAbilityValue(v)} min={0} max={99} />
          </FieldRow>
        </div>
        <FieldRow label="Texto da habilidade">
          <TextArea value={activeCard.abilityText}
            onChange={(v) => setField("abilityText", v)} rows={2} />
        </FieldRow>

        <SectionDivider label="Rodapé" />
        <FieldRow label="Flavor text">
          <TextArea value={activeCard.flavorText ?? ""}
            onChange={(v) => setField("flavorText", v)} rows={3} />
        </FieldRow>
        <FieldRow label="Empresa (emblema)">
          <SelectInput<string> value={activeCard.companyId}
            onChange={(v) => setField("companyId", v)} options={COMPANY_OPTIONS} />
        </FieldRow>
      </div>
    </div>
  );
}
