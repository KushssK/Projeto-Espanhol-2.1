import fs from 'fs';

// ============================================================================
// Camada de armazenamento de arquivos.
//
// PRODUÇÃO (Render): envia os arquivos para o Supabase Storage — o filesystem
// do Render é efêmero (arquivos somem a cada redeploy). As URLs salvas no banco
// passam a ser URLs públicas do bucket.
//
// DESENVOLVIMENTO (local): sem as variáveis do Supabase, mantém o fallback
// local /uploads/... (comportamento atual), sem mudança de código.
//
// Credenciais vivem SOMENTE no backend via variáveis de ambiente — nada de
// secrets no frontend.
// ============================================================================

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'uploads';

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function supabasePublicUrl(objectPath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${objectPath}`;
}

function isSupabaseUrl(url: string): boolean {
  return url.startsWith(`${SUPABASE_URL}/storage/v1/object/`);
}

/**
 * Persiste um arquivo enviado via multer.
 *
 * - Com Supabase configurado: envia para o bucket, apaga a cópia local
 *   temporária e retorna a URL pública. Falha de upload → erro (nunca grava
 *   URL quebrada no banco).
 * - Sem Supabase (dev): retorna o caminho local /uploads/... (fallback).
 */
export async function persistUpload(file: Express.Multer.File, folder: string): Promise<string> {
  const localPath = `/uploads/${folder}/${file.filename}`;

  if (!isSupabaseConfigured()) {
    return localPath; // fallback local (desenvolvimento)
  }

  const objectPath = `${folder}/${file.filename}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': file.mimetype || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: fs.createReadStream(file.path),
  });

  // Remove a cópia local temporária em qualquer cenário (prod)
  fs.promises.unlink(file.path).catch(() => undefined);

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error(`[storage] Falha ao enviar ${objectPath} para o Supabase: ${res.status} ${detail.slice(0, 200)}`);
    throw new Error('Falha ao salvar o arquivo no storage.');
  }

  return supabasePublicUrl(objectPath);
}

/**
 * Remove um arquivo previamente salvo.
 * - URL do Supabase → DELETE no bucket.
 * - Caminho local → unlink do disco (compatível com arquivos antigos).
 */
export async function removeStoredFile(url: string | null | undefined): Promise<void> {
  if (!url) return;

  if (isSupabaseUrl(url)) {
    const objectPath = url.replace(`${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/`, '');
    const encoded = objectPath.split('/').map(encodeURIComponent).join('/');
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${encoded}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    });
    if (!res.ok) {
      console.error(`[storage] Falha ao remover ${objectPath}: ${res.status}`);
    }
    return;
  }

  // Caminho local antigo (ou dev)
  const fsPath = url.replace(/^\/uploads\//, 'uploads/');
  fs.promises.unlink(fsPath).catch(() => undefined);
}