-- ============================================================
-- Solis Card Maker — Migration 001
-- Schema completo: cartas, versões, bibliotecas e publicações
-- ============================================================

-- Extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- CARTAS
-- ────────────────────────────────────────────────────────────

-- Entidade permanente da carta (identidade que não muda)
CREATE TABLE cards (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL    DEFAULT now(),
  slug       TEXT        NOT NULL UNIQUE, -- ex: "operario", "investidor"
  name       TEXT        NOT NULL
);

-- Snapshot imutável a cada Save no editor.
-- Nunca é atualizado — cada Save cria uma linha nova.
CREATE TABLE card_versions (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  card_id    UUID        NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  version    INTEGER     NOT NULL,
  label      TEXT,                        -- mensagem opcional de versionamento
  data       JSONB       NOT NULL,        -- SolisCard completo (sem art.src)
  image_path TEXT,                        -- path no Storage: cards/{card_id}/v{N}.png
  UNIQUE (card_id, version)
);

-- Índices para buscas frequentes
CREATE INDEX idx_card_versions_card_id ON card_versions (card_id);
CREATE INDEX idx_card_versions_created ON card_versions (created_at DESC);

-- View útil: versão mais recente de cada carta
CREATE VIEW latest_card_versions AS
  SELECT DISTINCT ON (cv.card_id)
    cv.*,
    c.slug,
    c.name AS card_name
  FROM card_versions cv
  JOIN cards c ON c.id = cv.card_id
  ORDER BY cv.card_id, cv.version DESC;

-- ────────────────────────────────────────────────────────────
-- BIBLIOTECAS
-- ────────────────────────────────────────────────────────────

-- Coleção nomeada de cartas
CREATE TABLE libraries (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name       TEXT        NOT NULL DEFAULT 'Minha Biblioteca'
);

-- Snapshot de uma biblioteca em um momento específico.
-- card_version_ids aponta para as versões exatas de cada carta.
CREATE TABLE library_versions (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  library_id       UUID        NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  version          INTEGER     NOT NULL,
  label            TEXT,
  card_version_ids UUID[]      NOT NULL DEFAULT '{}',
  UNIQUE (library_id, version)
);

CREATE INDEX idx_library_versions_library_id ON library_versions (library_id);

-- ────────────────────────────────────────────────────────────
-- PUBLICAÇÕES
-- ────────────────────────────────────────────────────────────

-- Registro de cada vez que o botão "Publicar" é acionado.
-- O manifest é o JSON servido ao TTS.
CREATE TABLE publications (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version      INTEGER     NOT NULL UNIQUE,
  manifest     JSONB       NOT NULL,  -- { version, cards: { slug: imageUrl } }
  notes        TEXT
);

-- Quais versões de cartas foram incluídas em cada publicação
CREATE TABLE publication_cards (
  publication_id  UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  card_version_id UUID NOT NULL REFERENCES card_versions(id),
  PRIMARY KEY (publication_id, card_version_id)
);

-- ────────────────────────────────────────────────────────────
-- STORAGE
-- Rodar manualmente no Supabase Dashboard > Storage
-- ou via script após criar o projeto:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('cards', 'cards', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- Estrutura de paths:
--   cards/{card_id}/v{version}.png  — imagem de uma versão
--   cards/manifest.json             — manifest público para o TTS
-- ────────────────────────────────────────────────────────────
