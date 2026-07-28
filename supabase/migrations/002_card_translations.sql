-- ============================================================
-- Solis Card Maker — Migration 002
-- Traduções de cartas com rastreamento de pipeline e staleness
-- ============================================================

CREATE TABLE card_translations (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- carta pai (cascade delete: remover a carta remove as traduções)
  card_id           UUID        NOT NULL REFERENCES cards(id) ON DELETE CASCADE,

  -- idioma desta tradução: 'en' | 'es' | 'fr' | 'de' | 'zh'
  locale            TEXT        NOT NULL,

  -- campos traduzidos (null enquanto pipeline não concluiu)
  name              TEXT,
  subtitle          TEXT,
  ability_text      TEXT,
  flavor_text       TEXT,         -- opcional na carta original, opcional na tradução

  -- estado da pipeline de tradução
  status            TEXT        NOT NULL DEFAULT 'pending',
  -- 'pending'     → na fila, aguardando processamento
  -- 'translating' → DeepL/Claude rodando agora
  -- 'done'        → tradução completa e salva
  -- 'stale'       → texto PT mudou após esta tradução
  -- 'error'       → pipeline falhou

  error_message     TEXT,         -- detalhe do erro quando status = 'error'

  -- rastreamento de atualidade
  -- qual versão PT gerou esta tradução
  source_version_id UUID        REFERENCES card_versions(id),
  is_stale          BOOLEAN     NOT NULL DEFAULT false,
  -- is_stale vira true automaticamente quando saveCard detecta
  -- mudança nos campos traduzíveis em relação a source_version_id

  -- metadados de qualidade (preenchidos pela LLM de validação)
  confidence        FLOAT,        -- score 0.0-1.0 retornado pelo Claude
  pipeline_notes    TEXT,         -- observações do Claude para o revisor humano

  -- origem e revisão
  translated_by     TEXT        NOT NULL DEFAULT 'auto',
  -- 'auto' → pipeline DeepL + Claude
  -- 'manual' → editado manualmente pelo usuário
  is_reviewed       BOOLEAN     NOT NULL DEFAULT false,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- cada carta tem no máximo uma tradução por idioma
  UNIQUE (card_id, locale)
);

-- índices para buscas frequentes
CREATE INDEX idx_card_translations_card_id ON card_translations (card_id);
CREATE INDEX idx_card_translations_status  ON card_translations (status);
CREATE INDEX idx_card_translations_stale   ON card_translations (is_stale) WHERE is_stale = true;
