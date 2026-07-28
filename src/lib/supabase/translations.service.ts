import { getSupabase } from "./client";
import { Locale, LOCALES, TranslationStatus } from "@/lib/localization/locales";

export interface CardTranslation {
  id:                string;
  card_id:           string;
  locale:            Locale;
  name:              string | null;
  subtitle:          string | null;
  ability_text:      string | null;
  flavor_text:       string | null;
  status:            TranslationStatus;
  error_message:     string | null;
  source_version_id: string | null;
  is_stale:          boolean;
  confidence:        number | null;
  pipeline_notes:    string | null;
  translated_by:     string;
  is_reviewed:       boolean;
  created_at:        string;
  updated_at:        string;
}

// ── Leitura ──────────────────────────────────────────────────

/** Retorna todas as traduções de uma carta (uma por idioma). */
export async function getTranslations(cardId: string): Promise<CardTranslation[]> {
  const { data, error } = await getSupabase()
    .from("card_translations")
    .select("*")
    .eq("card_id", cardId)
    .order("locale");

  if (error) throw new Error(`Erro ao carregar traduções: ${error.message}`);
  return (data ?? []) as CardTranslation[];
}

/** Retorna a tradução de um idioma específico ou null se não existe. */
export async function getTranslation(
  cardId: string,
  locale: Locale
): Promise<CardTranslation | null> {
  const { data, error } = await getSupabase()
    .from("card_translations")
    .select("*")
    .eq("card_id", cardId)
    .eq("locale", locale)
    .maybeSingle();

  if (error) throw new Error(`Erro ao carregar tradução: ${error.message}`);
  return data as CardTranslation | null;
}

// ── Escrita ───────────────────────────────────────────────────

/** Upsert de uma tradução. Cria se não existe, atualiza se já existe. */
export async function saveTranslation(
  cardId:  string,
  locale:  Locale,
  data: {
    name?:              string;
    subtitle?:          string;
    ability_text?:      string;
    flavor_text?:       string;
    status?:            TranslationStatus;
    error_message?:     string | null;
    source_version_id?: string;
    is_stale?:          boolean;
    confidence?:        number;
    pipeline_notes?:    string;
    translated_by?:     string;
    is_reviewed?:       boolean;
  }
): Promise<void> {
  const { error } = await getSupabase()
    .from("card_translations")
    .upsert(
      {
        card_id:    cardId,
        locale,
        updated_at: new Date().toISOString(),
        ...data,
      },
      { onConflict: "card_id,locale" }
    );

  if (error) throw new Error(`Erro ao salvar tradução (${locale}): ${error.message}`);
}

/**
 * Atualiza apenas o status e campos de pipeline de uma tradução.
 * Usado durante o processamento para atualizar o estado em tempo real.
 */
export async function updateTranslationStatus(
  cardId:  string,
  locale:  Locale,
  status:  TranslationStatus,
  extra?: {
    error_message?: string;
    name?:          string;
    subtitle?:      string;
    ability_text?:  string;
    flavor_text?:   string;
    confidence?:    number;
    pipeline_notes?:string;
    source_version_id?: string;
    is_stale?: boolean;
  }
): Promise<void> {
  const { error } = await getSupabase()
    .from("card_translations")
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq("card_id", cardId)
    .eq("locale", locale);

  if (error) throw new Error(`Erro ao atualizar status (${locale}): ${error.message}`);
}

// ── Staleness ─────────────────────────────────────────────────

/**
 * Verifica se os campos traduzíveis mudaram entre a versão anterior e a atual.
 * Retorna true se deve marcar as traduções como stale.
 */
export function translatableFieldsChanged(
  prev: Record<string, unknown>,
  next: Record<string, unknown>
): boolean {
  return (
    prev.name        !== next.name        ||
    prev.subtitle    !== next.subtitle    ||
    prev.abilityText !== next.abilityText ||
    prev.flavorText  !== next.flavorText
  );
}

/**
 * Marca todas as traduções existentes de uma carta como stale.
 * Chamado automaticamente em saveCard quando os campos traduzíveis mudam.
 */
export async function markTranslationsStale(cardId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("card_translations")
    .update({
      is_stale:   true,
      status:     "stale",
      updated_at: new Date().toISOString(),
    })
    .eq("card_id", cardId)
    .in("status", ["done"]); // só marca stale as que estavam done

  if (error) throw new Error(`Erro ao marcar stale: ${error.message}`);
}

/**
 * Inicializa registros 'pending' para todos os idiomas de uma carta nova.
 * Chamado quando a carta é criada pela primeira vez.
 */
export async function initializePendingTranslations(
  cardId:           string,
  sourceVersionId:  string
): Promise<void> {
  const rows = LOCALES.map((locale) => ({
    card_id:           cardId,
    locale,
    status:            "pending" as TranslationStatus,
    source_version_id: sourceVersionId,
    translated_by:     "auto",
  }));

  const { error } = await getSupabase()
    .from("card_translations")
    .upsert(rows, { onConflict: "card_id,locale", ignoreDuplicates: true });
  // ignoreDuplicates: não sobrescreve traduções existentes ao re-salvar

  if (error) throw new Error(`Erro ao inicializar traduções: ${error.message}`);
}

// ── Publicação ─────────────────────────────────────────────────

/**
 * Busca todas as traduções concluídas de uma lista de cards.
 * Retorna um mapa: { cardId: { locale: CardTranslation } }
 * Usado pelo publishCards para construir as versões localizadas.
 */
export async function getTranslationsForCards(
  cardIds: string[]
): Promise<Record<string, Record<string, CardTranslation>>> {
  if (!cardIds.length) return {};

  const { data, error } = await getSupabase()
    .from("card_translations")
    .select("*")
    .in("card_id", cardIds)
    .eq("status", "done")      // só traduções completas
    .eq("is_stale", false);    // só traduções atualizadas

  if (error) throw new Error(`Erro ao buscar traduções: ${error.message}`);

  const result: Record<string, Record<string, CardTranslation>> = {};
  for (const row of (data ?? []) as CardTranslation[]) {
    if (!result[row.card_id]) result[row.card_id] = {};
    result[row.card_id][row.locale] = row;
  }
  return result;
}
