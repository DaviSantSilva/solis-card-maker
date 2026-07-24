# Setup do Supabase

Siga esses passos para conectar o Solis Card Maker ao banco de dados.

---

## 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta (gratuita)
2. Clique em **New project**
3. Escolha um nome (ex: `solis-card-maker`) e uma senha forte para o banco
4. Região: escolha a mais próxima (ex: `South America (São Paulo)`)
5. Aguarde o projeto ser criado (~2 minutos)

---

## 2. Rodar a migration

1. No dashboard do projeto, acesse **SQL Editor**
2. Clique em **New query**
3. Cole o conteúdo de `supabase/migrations/001_initial_schema.sql`
4. Clique em **Run**

---

## 3. Criar o bucket de Storage

Ainda no SQL Editor, rode:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('cards', 'cards', true)
ON CONFLICT (id) DO NOTHING;
```

Isso cria o bucket público `cards` onde as imagens e o `manifest.json` serão armazenados.

---

## 4. Configurar as variáveis de ambiente

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.local.example .env.local
   ```

2. No dashboard do Supabase, acesse **Settings → API**

3. Copie os valores e cole no `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
   ```

---

## 5. Gerar os tipos TypeScript (opcional, recomendado)

Depois que o projeto estiver criado, você pode gerar os tipos diretamente do schema real:

```bash
npx supabase gen types typescript \
  --project-id <seu-project-id> \
  > src/lib/supabase/db.types.ts
```

Isso substitui o arquivo de tipos manual por um gerado automaticamente.

---

## URL fixa para o TTS

Após o setup, a URL do manifest que deve ser usada no script Lua do TTS é:

```
https://<seu-projeto>.supabase.co/storage/v1/object/public/cards/manifest.json
```

Essa URL nunca muda — o conteúdo é atualizado a cada publicação.
