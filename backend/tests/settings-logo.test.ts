import { beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================================================
// Mocks — não tocam banco, disco nem Supabase
// ============================================================================
const prismaMock = vi.hoisted(() => ({
  appSettings: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
  },
}));

const storageMock = vi.hoisted(() => ({
  persistUpload: vi.fn(),
  isSupabaseConfigured: vi.fn(() => false),
}));

const fsMock = vi.hoisted(() => ({
  promises: {
    readFile: vi.fn(async () => Buffer.from('fake-image-bytes')),
    unlink: vi.fn(async () => undefined),
  },
}));

vi.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('../src/lib/storage', () => storageMock);
vi.mock('fs', () => ({ default: fsMock, ...fsMock }));

import { getSettings, getSettingsLogo, uploadSettingsLogo, updateSettings } from '../src/controllers/settings.controller';
import type { AuthRequest } from '../src/middlewares/auth.middleware';

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn((p) => p);
  res.send = vi.fn((p) => p);
  res.setHeader = vi.fn();
  return res;
};

const ADMIN_REQ = { user: { userId: 'u1', role: 'ADMIN' } } as AuthRequest;

beforeEach(() => {
  vi.clearAllMocks();
  storageMock.isSupabaseConfigured.mockReturnValue(false);
});

describe('uploadSettingsLogo (sem Supabase → persiste no banco)', () => {
  const file = { path: 'tmp/logo.png', mimetype: 'image/png', filename: 'logo.png' };

  it('salva os bytes no banco e define logoUrl como /api/settings/logo', async () => {
    const saved = { id: 1, themeColor: '#7C3AED', logoUrl: '/api/settings/logo', logoData: Buffer.from('x'), logoMime: 'image/png', updatedAt: new Date('2026-09-08T12:00:00Z') };
    prismaMock.appSettings.upsert.mockResolvedValue(saved);

    const res = makeRes();
    await uploadSettingsLogo({ ...ADMIN_REQ, file } as unknown as AuthRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(prismaMock.appSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ logoData: Buffer.from('fake-image-bytes'), logoMime: 'image/png', logoUrl: '/api/settings/logo' }),
      })
    );
    // Bytes não vazam no JSON
    const payload = res.json.mock.calls[0][0];
    expect(payload.settings.logoData).toBeUndefined();
    // Cache-buster presente
    expect(payload.settings.logoUrl).toBe('/api/settings/logo?v=1788868800');
  });

  it('sem arquivo → 400', async () => {
    const res = makeRes();
    await uploadSettingsLogo(ADMIN_REQ, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('getSettingsLogo (rota pública)', () => {
  it('serve os bytes com Content-Type e cache', async () => {
    prismaMock.appSettings.findUnique.mockResolvedValue({
      id: 1, logoData: Buffer.from('abc'), logoMime: 'image/png', updatedAt: new Date(),
    });

    const res = makeRes();
    await getSettingsLogo({} as any, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(res.send).toHaveBeenCalledWith(Buffer.from('abc'));
  });

  it('sem logo configurada → 404', async () => {
    prismaMock.appSettings.findUnique.mockResolvedValue(null);

    const res = makeRes();
    await getSettingsLogo({} as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('getSettings (não expõe bytes)', () => {
  it('resposta inclui logoUrl com cache-buster e sem logoData', async () => {
    prismaMock.appSettings.findFirst.mockResolvedValue({
      id: 1, themeColor: '#630000', logoUrl: '/api/settings/logo', logoData: Buffer.from('big'), logoMime: 'image/png', updatedAt: new Date('2026-09-08T12:00:00Z'),
    });

    const res = makeRes();
    await getSettings({} as any, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.logoData).toBeUndefined();
    expect(payload.logoMime).toBeUndefined();
    expect(payload.logoUrl).toBe('/api/settings/logo?v=1788868800');
    expect(payload.themeColor).toBe('#630000');
  });
});

describe('updateSettings (cor)', () => {
  it('cor válida → 200 e persistida', async () => {
    prismaMock.appSettings.upsert.mockResolvedValue({ id: 1, themeColor: '#2563EB', logoUrl: null, updatedAt: new Date() });

    const res = makeRes();
    await updateSettings({ ...ADMIN_REQ, body: { themeColor: '#2563EB' } } as AuthRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(prismaMock.appSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { themeColor: '#2563EB' } })
    );
  });

  it('cor inválida → 400 e nada persistido', async () => {
    const res = makeRes();
    await updateSettings({ ...ADMIN_REQ, body: { themeColor: 'javascript:alert(1)' } } as AuthRequest, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.appSettings.upsert).not.toHaveBeenCalled();
  });
});
