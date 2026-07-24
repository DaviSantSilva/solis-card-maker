"use client";
import React from "react";
import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import { getSupabase } from "./client";
import { uploadCardRender, uploadManifest, getPublicImageUrl } from "./storage.service";
import { fetchAllCards } from "./cards.service";
import { SolisCard } from "@/lib/cards/types";
import { CardCanvas } from "@/components/card/CardCanvas";
import { PublicationManifest } from "./db.types";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Renderiza uma carta como PNG em 864×1234 via html-to-image. */
async function renderCard(card: SolisCard): Promise<string> {
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;top:-10000px;left:-10000px;width:864px;height:1234px;overflow:hidden;";
  document.body.appendChild(container);

  const root = createRoot(container);

  // Renderiza e aguarda imagens carregarem
  await new Promise<void>((resolve) => {
    root.render(React.createElement(CardCanvas, { card, width: 864 }));
    setTimeout(() => {
      const imgs = Array.from(container.querySelectorAll("img"));
      Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((r) => { img.onload = r; img.onerror = r; })
        )
      ).then(() => resolve());
    }, 150);
  });

  // Captura o inner div (864×1234, sem border-radius)
  const wrapper = container.firstElementChild as HTMLElement;
  const inner   = wrapper?.firstElementChild as HTMLElement;
  if (!inner) throw new Error(`Não foi possível renderizar "${card.name}"`);

  // Remove temporariamente o scale para capturar em tamanho nativo
  const prevTransform = inner.style.transform;
  inner.style.transform = "scale(1)";

  const dataUrl = await toPng(inner, { width: 864, height: 1234, pixelRatio: 1 });

  inner.style.transform = prevTransform;
  root.unmount();
  container.remove();

  return dataUrl;
}

/** Retorna o número da última publicação (0 se nunca publicado). */
async function getLastPublicationVersion(): Promise<number> {
  const { data } = await getSupabase()
    .from("publications")
    .select("version")
    .order("version", { ascending: false })
    .limit(1);

  const rows = data as Array<{ version: number }> | null;
  return rows?.length ? rows[0].version : 0;
}

/** IDs de card_versions da última publicação (para detectar mudanças). */
async function getLastPublishedVersionIds(): Promise<Set<string>> {
  const { data: pubRows } = await getSupabase()
    .from("publications")
    .select("id")
    .order("version", { ascending: false })
    .limit(1);

  const pubs = pubRows as Array<{ id: string }> | null;
  if (!pubs?.length) return new Set();

  const { data: pcRows } = await getSupabase()
    .from("publication_cards")
    .select("card_version_id")
    .eq("publication_id", pubs[0].id);

  const pcs = pcRows as Array<{ card_version_id: string }> | null;
  return new Set((pcs ?? []).map((r) => r.card_version_id));
}

// ─────────────────────────────────────────────────────────────

export interface PublishProgress {
  total:   number;
  current: number;
  card:    string;
}

export interface PublishResult {
  version:     number;
  manifestUrl: string;
  manifest:    PublicationManifest;
  published:   number; // cartas com render novo
  unchanged:   number; // cartas reutilizadas da publicação anterior
}

/**
 * Publica todas as cartas:
 * 1. Identifica cartas alteradas desde a última publicação
 * 2. Renderiza e sobe PNGs das cartas alteradas
 * 3. Gera e sobe manifest.json
 * 4. Registra a publicação no banco
 *
 * @param onProgress  callback chamado a cada carta processada
 * @param notes       nota opcional para o registro de publicação
 */
export async function publishCards(
  onProgress: (p: PublishProgress) => void,
  notes?: string
): Promise<PublishResult> {
  const db = getSupabase();

  // 1. Cartas atuais e estado da última publicação
  const [cards, lastVersion, lastVersionIds] = await Promise.all([
    fetchAllCards(),
    getLastPublicationVersion(),
    getLastPublishedVersionIds(),
  ]);

  const pubVersion = lastVersion + 1;

  // 2. Para cada carta: render novo se alterada, URL anterior se não
  const manifestCards: Record<string, string> = {};
  const publicationCardIds: string[] = [];

  // Busca URLs das renders da última publicação para reutilizar
  const { data: prevPubRows } = await db
    .from("publications")
    .select("manifest")
    .order("version", { ascending: false })
    .limit(1);

  const prevManifest = prevPubRows?.length
    ? ((prevPubRows as Array<{ manifest: PublicationManifest }>)[0].manifest)
    : null;

  let published = 0;
  let unchanged = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const slug = toSlug(card.name);

    onProgress({ total: cards.length, current: i + 1, card: card.name });

    if (lastVersionIds.has(card.id) && prevManifest?.cards[slug]) {
      // Carta não mudou — reutiliza URL do manifest anterior
      manifestCards[slug] = prevManifest.cards[slug];
      unchanged++;
    } else {
      // Carta nova ou alterada — renderiza e sobe
      const dataUrl    = await renderCard(card);
      const renderPath = await uploadCardRender(slug, pubVersion, dataUrl);
      manifestCards[slug] = getPublicImageUrl(renderPath);
      published++;
    }

    publicationCardIds.push(card.id);
  }

  // 3. Manifest
  const manifest: PublicationManifest = {
    version:      pubVersion,
    published_at: new Date().toISOString(),
    cards:        manifestCards,
  };

  const manifestUrl = await uploadManifest(manifest);

  // 4. Registra publicação no banco
  const { data: pubRows, error: pubError } = await db
    .from("publications")
    .insert({ version: pubVersion, manifest, notes: notes ?? null })
    .select();

  if (pubError || !pubRows?.length) {
    throw new Error(`Erro ao registrar publicação: ${pubError?.message}`);
  }
  const pubId = (pubRows as Array<{ id: string }>)[0].id;

  // 5. Registra quais card_versions foram publicados
  await db.from("publication_cards").insert(
    publicationCardIds.map((cv_id) => ({
      publication_id:  pubId,
      card_version_id: cv_id,
    }))
  );

  return { version: pubVersion, manifestUrl, manifest, published, unchanged };
}
