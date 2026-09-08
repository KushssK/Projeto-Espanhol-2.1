import { beforeEach, describe, expect, it } from 'vitest';
import { isSupabaseConfigured, persistUpload, removeStoredFile } from '../src/lib/storage';

const fakeFile = {
  filename: 'abc123.png',
  path: '/nao-existe/abc123.png',
  mimetype: 'image/png',
} as Express.Multer.File;

describe('storage adapter', () => {
  beforeEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('sem variáveis do Supabase → NÃO configurado (fallback dev)', () => {
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('persistUpload sem Supabase retorna caminho local (dev) sem tocar rede', async () => {
    const url = await persistUpload(fakeFile, 'avatars');
    expect(url).toBe('/uploads/avatars/abc123.png');
  });

  it('com variáveis → configurado', () => {
    process.env.SUPABASE_URL = 'https://proj.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave';
    expect(isSupabaseConfigured()).toBe(true);
  });

  it('removeStoredFile com caminho local não lança (arquivo ausente ok)', async () => {
    await expect(removeStoredFile('/uploads/avatars/abc123.png')).resolves.toBeUndefined();
  });

  it('removeStoredFile com null/undefined é no-op', async () => {
    await expect(removeStoredFile(null)).resolves.toBeUndefined();
    await expect(removeStoredFile(undefined)).resolves.toBeUndefined();
  });
});