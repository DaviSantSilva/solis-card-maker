import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Retorna o cliente Supabase (singleton lazy).
 * Inicializa na primeira chamada — não no import do módulo — para
 * evitar erros de build quando as env vars ainda não estão disponíveis.
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase não configurado.\n" +
      "Copie .env.local.example → .env.local e preencha as variáveis.\n" +
      "Ver SETUP.md para instruções."
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _client = createClient<any>(url, key);
  return _client;
}

/** URL pública do Storage para um path relativo ao bucket 'cards' */
export function storageUrl(path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${url}/storage/v1/object/public/cards/${path}`;
}
