import { supabase } from "./client";
import { uploadCardImage, getPublicImageUrl } from "./storage.service";
import { SolisCard } from "@/lib/cards/types";
import { LatestCardVersionRow } from "./db.types";

/** Deriva slug do nome da carta (igual ao export de imagem) */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Determina se um src é data URL (base64) ou URL normal */
function isDataUrl(src: string): boolean {
  return src.startsWith("data:");
}

/**
 * Converte uma linha do banco + image_path em um SolisCard completo,
 * injetando a URL pública da imagem em art.src.
 */
function rowToCard(row: LatestCardVersionRow): SolisCard {
  const card = (row.data as unknown) as SolisCard;

  if (row.image_path) {
    card.art = {
      ...(card.art ?? {}),
      src: getPublicImageUrl(row.image_path),
    };
  }

  return { ...card, id: row.id };
}

// ─── Leitura ─────────────────────────────────────────────────

/**
 * Carrega a versão mais recente de todas as cartas.
 * Usa a view latest_card_versions.
 */
export async function fetchAllCards(): Promise<SolisCard[]> {
  const { data, error } = await supabase
    .from("latest_card_versions")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Erro ao carregar cartas: ${error.message}`);
  return (data ?? []).map(rowToCard);
}

/**
 * Retorna o histórico completo de versões de uma carta pelo slug.
 */
export async function fetchCardHistory(slug: string) {
  const { data: cardRows, error: cardError } = await supabase
    .from("cards")
    .select("id, slug")
    .eq("slug", slug);

  if (cardError) throw new Error(`Erro ao buscar carta: ${cardError.message}`);
  const rows = cardRows as Array<{ id: string; slug: string }> | null;
  if (!rows?.length) throw new Error(`Carta "${slug}" não encontrada`);
  const cardId = rows[0].id;

  const { data, error } = await supabase
    .from("card_versions")
    .select("*")
    .eq("card_id", cardId)
    .order("version", { ascending: false });

  if (error) throw new Error(`Erro ao carregar histórico: ${error.message}`);
  return data ?? [];
}

// ─── Escrita ──────────────────────────────────────────────────

/**
 * Salva uma nova versão de uma carta.
 * - Se a carta não existe, cria o registro em `cards`.
 * - Faz upload da imagem se art.src for um data URL.
 * - Insere uma nova linha em `card_versions`.
 *
 * Retorna o SolisCard atualizado com a URL pública da imagem.
 */
export async function saveCard(
  card:   SolisCard,
  label?: string
): Promise<SolisCard> {
  const slug = toSlug(card.name);

  // 1. Upsert da entidade da carta
  const { data: cardRow, error: cardError } = await supabase
    .from("cards")
    .upsert({ slug, name: card.name }, { onConflict: "slug" })
    .select()
    .single();

  if (cardError || !cardRow) {
    throw new Error(`Erro ao salvar carta: ${cardError?.message}`);
  }

  // 2. Próximo número de versão
  const { count } = await supabase
    .from("card_versions")
    .select("*", { count: "exact", head: true })
    .eq("card_id", cardRow.id);

  const version = (count ?? 0) + 1;

  // 3. Upload da imagem se for data URL
  let imagePath: string | null = null;
  const artSrc = card.art?.src;

  if (artSrc && isDataUrl(artSrc)) {
    imagePath = await uploadCardImage(cardRow.id, version, artSrc);
  } else if (artSrc) {
    // já é uma URL do Storage — extrai só o path
    const match = artSrc.match(/\/cards\/(.+)$/);
    imagePath = match ? match[1] : null;
  }

  // 4. Serializa a carta sem art.src (imagem fica no Storage)
  const dataToStore: Omit<SolisCard, "id"> & { id?: string } = { ...card };
  if (dataToStore.art) {
    dataToStore.art = { ...dataToStore.art, src: "" };
  }
  delete dataToStore.id;

  // 5. Insere a versão
  const { data: versionRow, error: versionError } = await supabase
    .from("card_versions")
    .insert({
      card_id:    cardRow.id,
      version,
      label:      label ?? null,
      data:       dataToStore as Record<string, unknown>,
      image_path: imagePath,
    })
    .select()
    .single();

  if (versionError || !versionRow) {
    throw new Error(`Erro ao salvar versão: ${versionError?.message}`);
  }

  // 6. Retorna a carta com a URL pública da imagem
  const savedCard: SolisCard = {
    ...card,
    id: versionRow.id,
    art: imagePath
      ? { ...(card.art ?? {}), src: getPublicImageUrl(imagePath) }
      : card.art,
  };

  return savedCard;
}

/**
 * Remove uma carta e todas as suas versões do banco.
 * As imagens no Storage são mantidas (podem ser usadas em publicações).
 */
export async function deleteCard(slug: string): Promise<void> {
  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("slug", slug);

  if (error) throw new Error(`Erro ao apagar carta: ${error.message}`);
}
