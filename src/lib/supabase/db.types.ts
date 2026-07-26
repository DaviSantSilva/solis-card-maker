/**
 * Tipos TypeScript que espelham as tabelas do Supabase.
 * Gerados manualmente a partir de supabase/migrations/001_initial_schema.sql.
 * Quando o projeto Supabase estiver criado, substituir por:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/db.types.ts
 */

export interface CardRow {
  id:         string;
  created_at: string;
  slug:       string;
  name:       string;
}

export interface CardVersionRow {
  id:         string;
  created_at: string;
  card_id:    string;
  version:    number;
  label:      string | null;
  /** SolisCard serializado, sem art.src (imagem fica no Storage) */
  data:       Record<string, unknown>;
  image_path: string | null;
}

/** Shape retornado pela view latest_card_versions */
export interface LatestCardVersionRow extends CardVersionRow {
  slug:      string;
  card_name: string;
}

export interface LibraryRow {
  id:         string;
  created_at: string;
  name:       string;
}

export interface LibraryVersionRow {
  id:               string;
  created_at:       string;
  library_id:       string;
  version:          number;
  label:            string | null;
  card_version_ids: string[];
}

export interface PublicationRow {
  id:           string;
  published_at: string;
  version:      number;
  manifest:     PublicationManifest;
  notes:        string | null;
}

/** Estrutura do manifest.json publicado e consumido pelo TTS e pela galeria */
/** Metadados de variante incluídos no manifest para uso na galeria */
export interface VariantMeta {
  variantGroup: string;
  playerColor:  string;
  companyId:    string;
}

export interface PublicationManifest {
  version:      number;
  published_at: string;
  /** slug → URL da imagem renderizada (consumido pelo TTS) */
  cards: Record<string, string>;
  /** slug → nome real da carta (consumido pela galeria) */
  names: Record<string, string>;
  /** slug → metadados de variante — só presente em cartas iniciais com variante */
  variants: Record<string, VariantMeta>;
}

export interface PublicationCardRow {
  publication_id:  string;
  card_version_id: string;
}

// ── Tipos para o banco completo (usado pelo cliente Supabase) ──
export interface Database {
  public: {
    Tables: {
      cards: {
        Row:    CardRow;
        Insert: Omit<CardRow, "id" | "created_at">;
        Update: Partial<Omit<CardRow, "id" | "created_at">>;
      };
      card_versions: {
        Row:    CardVersionRow;
        Insert: Omit<CardVersionRow, "id" | "created_at">;
        Update: never; // versões são imutáveis
      };
      libraries: {
        Row:    LibraryRow;
        Insert: Omit<LibraryRow, "id" | "created_at">;
        Update: Partial<Omit<LibraryRow, "id" | "created_at">>;
      };
      library_versions: {
        Row:    LibraryVersionRow;
        Insert: Omit<LibraryVersionRow, "id" | "created_at">;
        Update: never;
      };
      publications: {
        Row:    PublicationRow;
        Insert: Omit<PublicationRow, "id" | "published_at">;
        Update: never;
      };
      publication_cards: {
        Row:    PublicationCardRow;
        Insert: PublicationCardRow;
        Update: never;
      };
    };
    Views: {
      latest_card_versions: {
        Row: LatestCardVersionRow;
      };
    };
  };
}
