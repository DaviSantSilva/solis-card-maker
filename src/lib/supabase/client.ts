import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    "Supabase não configurado.\n" +
    "Copie .env.local.example para .env.local e preencha as variáveis:\n" +
    "  NEXT_PUBLIC_SUPABASE_URL\n" +
    "  NEXT_PUBLIC_SUPABASE_ANON_KEY\n" +
    "Veja SETUP.md para instruções de criação do projeto."
  );
}

// Sem o generic Database por enquanto — substituir pelos tipos gerados
// via `npx supabase gen types` após criar o projeto (ver SETUP.md).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(url, key);

/** URL pública do Storage para um path específico */
export function storageUrl(path: string): string {
  return `${url}/storage/v1/object/public/cards/${path}`;
}
