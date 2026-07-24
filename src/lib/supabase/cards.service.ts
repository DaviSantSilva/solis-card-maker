import { getSupabase } from "./client";
import { uploadCardImage, getPublicImageUrl } from "./storage.service";
import { SolisCard } from "@/lib/cards/types";
import { LatestCardVersionRow } from "./db.types";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function isDataUrl(src: string): boolean {
  return src.startsWith("data:");
}

function rowToCard(row: LatestCardVersionRow): SolisCard {
  const card = (row.data as unknown) as SolisCard;
  if (row.image_path) {
    card.art = { ...(card.art ?? {}), src: getPublicImageUrl(row.image_path) };
  }
  return { ...card, id: row.id };
}

// ─── Leitura ────────────────────────────────────────────────

export async function fetchAllCards(): Promise<SolisCard[]> {
  const { data, error } = await getSupabase()
    .from("latest_card_versions")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Erro ao carregar cartas: ${error.message}`);
  return ((data ?? []) as LatestCardVersionRow[]).map(rowToCard);
}

export async function fetchCardHistory(slug: string) {
  const { data: cardRows, error: cardError } = await getSupabase()
    .from("cards")
    .select("id, slug")
    .eq("slug", slug);

  if (cardError) throw new Error(`Erro ao buscar carta: ${cardError.message}`);
  const rows = cardRows as Array<{ id: string; slug: string }> | null;
  if (!rows?.length) throw new Error(`Carta "${slug}" não encontrada`);

  const { data, error } = await getSupabase()
    .from("card_versions")
    .select("*")
    .eq("card_id", rows[0].id)
    .order("version", { ascending: false });

  if (error) throw new Error(`Erro ao carregar histórico: ${error.message}`);
  return data ?? [];
}

// ─── Escrita ─────────────────────────────────────────────────

/**
 * Salva uma nova versão da carta.
 *
 * Ordem das operações (mais resistente a falhas parciais):
 * 1. Upsert em `cards`  — cria ou reutiliza a entidade
 * 2. Conta versões      — determina o próximo número
 * 3. Upload da imagem   — se falhar, para aqui sem poluir card_versions
 * 4. Insert em `card_versions` — só executa se tudo antes deu certo
 */
export async function saveCard(
  card: SolisCard,
  label?: string
): Promise<SolisCard> {
  const db   = getSupabase();
  const slug = toSlug(card.name);

  // 1. Upsert da entidade (idempotente via onConflict: slug)
  const { data: cardRows, error: cardError } = await db
    .from("cards")
    .upsert({ slug, name: card.name }, { onConflict: "slug" })
    .select();

  if (cardError || !cardRows?.length) {
    throw new Error(`Erro ao salvar carta: ${cardError?.message}`);
  }
  const cardRow = (cardRows as Array<{ id: string }>)[0];

  // 2. Próxima versão
  const { count } = await db
    .from("card_versions")
    .select("*", { count: "exact", head: true })
    .eq("card_id", cardRow.id);

  const version = (count ?? 0) + 1;

  // 3. Upload da imagem (pode falhar — card_versions ainda não foi tocado)
  let imagePath: string | null = null;
  const artSrc = card.art?.src;

  if (artSrc && isDataUrl(artSrc)) {
    // Lança erro aqui se o Storage não estiver configurado corretamente.
    // Nesse caso, o cards.upsert já ocorreu mas card_versions NÃO é criado,
    // o que é seguro — na próxima tentativa o upsert reutiliza o registro.
    imagePath = await uploadCardImage(cardRow.id, version, artSrc);
  } else if (artSrc) {
    const match = artSrc.match(/\/cards\/(.+)$/);
    imagePath = match ? match[1] : null;
  }

  // 4. Serializa sem art.src e insere a versão
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, ...rest } = card;
  const dataToStore = {
    ...rest,
    art: rest.art ? { ...rest.art, src: "" } : undefined,
  };

  const { data: versionRows, error: versionError } = await db
    .from("card_versions")
    .insert({
      card_id:    cardRow.id,
      version,
      label:      label ?? null,
      data:       dataToStore,
      image_path: imagePath,
    })
    .select();

  if (versionError || !versionRows?.length) {
    throw new Error(`Erro ao salvar versão: ${versionError?.message}`);
  }
  const versionRow = (versionRows as Array<{ id: string }>)[0];

  return {
    ...card,
    id: versionRow.id,
    art: imagePath
      ? { ...(card.art ?? {}), src: getPublicImageUrl(imagePath) }
      : card.art,
  };
}

export async function deleteCard(slug: string): Promise<void> {
  const { error } = await getSupabase()
    .from("cards")
    .delete()
    .eq("slug", slug);

  if (error) throw new Error(`Erro ao apagar carta: ${error.message}`);
}
