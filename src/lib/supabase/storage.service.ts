import { getSupabase, storageUrl } from "./client";

const BUCKET = "cards";

/**
 * Converte um data URL (base64) em Blob para upload.
 */
function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const ext  = mime === "image/jpeg" ? "jpeg" : "png";
  const bin  = atob(data);
  const arr  = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return { blob: new Blob([arr], { type: mime }), ext };
}

/**
 * Faz upload da imagem de uma carta para o Storage.
 * Retorna o path relativo armazenado em card_versions.image_path.
 *
 * Path: cards/{cardId}/v{version}.{ext}
 */
export async function uploadCardImage(
  cardId:  string,
  version: number,
  dataUrl: string
): Promise<string> {
  const { blob, ext } = dataUrlToBlob(dataUrl);
  const path = `${cardId}/v${version}.${ext}`;

  const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: blob.type,
      upsert: true,
    });

  if (error) throw new Error(`Erro ao fazer upload da imagem: ${error.message}`);
  return path;
}

/**
 * Retorna a URL pública de uma imagem pelo path armazenado no banco.
 */
export function getPublicImageUrl(imagePath: string): string {
  return storageUrl(imagePath);
}

/**
 * Faz upload do manifest.json para o path fixo consumido pelo TTS.
 * Sobrescreve o arquivo anterior.
 */
export async function uploadManifest(manifest: object): Promise<string> {
  const json = JSON.stringify(manifest, null, 2);
  const blob = new Blob([json], { type: "application/json" });

  const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload("manifest.json", blob, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) throw new Error(`Erro ao publicar manifest: ${error.message}`);
  return storageUrl("manifest.json");
}
