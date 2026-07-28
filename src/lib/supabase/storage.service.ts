import { getSupabase, storageUrl } from "./client";

const BUCKET = "cards";

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const ext  = mime === "image/jpeg" ? "jpeg" : "png";
  const bin  = atob(data);
  const arr  = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return { blob: new Blob([arr], { type: mime }), ext };
}

/** Upload da arte bruta de uma carta (chamado pelo saveCard). */
export async function uploadCardImage(
  cardId:  string,
  version: number,
  dataUrl: string
): Promise<string> {
  const { blob, ext } = dataUrlToBlob(dataUrl);
  const path = `${cardId}/v${version}.${ext}`;

  const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: true });

  if (error) throw new Error(`Erro ao fazer upload da imagem: ${error.message}`);
  return path;
}

/**
 * Upload do render final de uma carta (chamado pelo publishCards).
 * Path: renders/{slug}/{locale}/v{pubVersion}.png
 * URL nova a cada publicação — evita cache do TTS.
 */
export async function uploadCardRender(
  slug:       string,
  pubVersion: number,
  dataUrl:    string,
  locale:     string = "pt"
): Promise<string> {
  const { blob, ext } = dataUrlToBlob(dataUrl);
  const path = `renders/${slug}/${locale}/v${pubVersion}.${ext}`;

  const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: true });

  if (error) throw new Error(`Erro ao publicar render: ${error.message}`);
  return path;
}

export function getPublicImageUrl(imagePath: string): string {
  return storageUrl(imagePath);
}

/** Upload do manifest.json para a URL fixa consumida pelo TTS. */
export async function uploadManifest(manifest: object): Promise<string> {
  const blob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: "application/json",
  });

  const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload("manifest.json", blob, { contentType: "application/json", upsert: true });

  if (error) throw new Error(`Erro ao publicar manifest: ${error.message}`);
  return storageUrl("manifest.json");
}

/**
 * Faz upload do manifest para um idioma específico.
 * Path fixo: manifest-{locale}.json (ex: manifest-en.json)
 * O script Lua do TTS usa a versão correspondente ao idioma do mod.
 */
export async function uploadLocaleManifest(
  locale:   string,
  manifest: object
): Promise<string> {
  const blob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: "application/json",
  });
  const path = `manifest-${locale}.json`;

  const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "application/json", upsert: true });

  if (error) throw new Error(`Erro ao publicar manifest-${locale}: ${error.message}`);
  return storageUrl(path);
}
