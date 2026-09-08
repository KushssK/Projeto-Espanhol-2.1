-- Persistência da logo no banco (fallback quando Supabase não está configurado —
-- o filesystem do Render é efêmero e perde os arquivos a cada deploy).

ALTER TABLE "AppSettings" ADD COLUMN IF NOT EXISTS "logoData" BYTEA;
ALTER TABLE "AppSettings" ADD COLUMN IF NOT EXISTS "logoMime" TEXT;
