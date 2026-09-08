import { beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================================================
// Mocks — testes de unidade não tocam banco
// ============================================================================
const prismaMock = vi.hoisted(() => ({
  whitelistEmail: { findUnique: vi.fn() },
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));

import { login, register } from '../src/controllers/auth.controller';
import { requireAdmin } from '../src/middlewares/auth.middleware';
import { signToken } from '../src/lib/token';
import type { AuthRequest } from '../src/middlewares/auth.middleware';

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn((payload) => payload);
  return res;
};

const DOB_OK = '2000-01-01';

const baseUser = {
  id: 'u1',
  email: 'aluno@exemplo.com',
  username: 'aluno_01',
  role: 'STUDENT',
  avatarUrl: null,
  isBanned: false,
  passwordHash: '$2b$10$hash',
  failedLoginAttempts: 0,
  lockoutUntil: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('register (direto, sem código)', () => {
  const req = (body: unknown) => ({ body } as any);

  it('cria a conta e já retorna token + user — SEM accessCode na resposta', async () => {
    prismaMock.whitelistEmail.findUnique.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ ...baseUser, passwordHash: 'x' });

    const res = makeRes();
    await register(req({ email: 'Aluno@Exemplo.com', password: 'senha123', dob: DOB_OK, username: 'aluno_01' }), res);

    expect(res.status).toHaveBeenCalledWith(201);
    const payload = res.json.mock.calls[0][0];
    expect(payload.token).toBeTruthy();
    expect(payload.user.email).toBe('aluno@exemplo.com');
    expect(payload).not.toHaveProperty('accessCode');
    // Senha salva como hash, nunca em texto puro
    const created = prismaMock.user.create.mock.calls[0][0].data;
    expect(created.passwordHash).not.toBe('senha123');
    expect(created).not.toHaveProperty('accessCodeHash');
  });

  it('whitelist define a role (ADMIN)', async () => {
    prismaMock.whitelistEmail.findUnique.mockResolvedValue({ email: 'admin@exemplo.com', role: 'ADMIN' });
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ ...baseUser, role: 'ADMIN' });

    const res = makeRes();
    await register(req({ email: 'admin@exemplo.com', password: 'senha123', dob: DOB_OK, username: 'adm' }), res);

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'ADMIN' }) })
    );
  });

  it('dados inválidos → 400 e conta NÃO criada', async () => {
    const res = makeRes();
    await register(req({ email: 'sem-arroba', password: 'senha123', dob: DOB_OK }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('e-mail/username duplicado → 400 e conta NÃO criada', async () => {
    prismaMock.whitelistEmail.findUnique.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue(baseUser);

    const res = makeRes();
    await register(req({ email: 'aluno@exemplo.com', password: 'senha123', dob: DOB_OK, username: 'aluno_01' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe('login (direto: e-mail + senha → JWT)', () => {
  const req = (body: unknown) => ({ body } as any);

  it('senha correta → 200 com token, sem exigir código', async () => {
    // hash real de 'senha123'
    const bcrypt = await import('bcrypt');
    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash: await bcrypt.hash('senha123', 4),
    });
    prismaMock.user.update.mockResolvedValue(baseUser);

    const res = makeRes();
    await login(req({ email: 'aluno@exemplo.com', password: 'senha123' }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.token).toBeTruthy();
    expect(payload).not.toHaveProperty('accessCode');
  });

  it('senha errada → 401 com mensagem genérica (anti enumeração)', async () => {
    const bcrypt = await import('bcrypt');
    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash: await bcrypt.hash('senha123', 4),
    });
    prismaMock.user.update.mockResolvedValue(baseUser);

    const res = makeRes();
    await login(req({ email: 'aluno@exemplo.com', password: 'errada' }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].error).toBe('E-mail ou senha inválidos.');
  });

  it('e-mail inexistente → 401 genérico (mesma mensagem)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = makeRes();
    await login(req({ email: 'naoexiste@exemplo.com', password: 'senha123' }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].error).toBe('E-mail ou senha inválidos.');
  });

  it('payload sem código ainda funciona (nenhuma etapa de código exigida)', async () => {
    const bcrypt = await import('bcrypt');
    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash: await bcrypt.hash('senha123', 4),
    });
    prismaMock.user.update.mockResolvedValue(baseUser);

    const res = makeRes();
    await login(req({ email: 'aluno@exemplo.com', password: 'senha123', accessCode: 'XXXXXX' }), res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('excesso de tentativas → lockout de 15 minutos', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash: 'x',
      failedLoginAttempts: 4,
    });
    prismaMock.user.update.mockResolvedValue(baseUser);

    const res = makeRes();
    await login(req({ email: 'aluno@exemplo.com', password: 'errada' }), res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lockoutUntil: expect.any(Date) }),
      })
    );
  });

  it('conta banida com credenciais corretas → 403 (após autenticar)', async () => {
    const bcrypt = await import('bcrypt');
    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      isBanned: true,
      passwordHash: await bcrypt.hash('senha123', 4),
    });
    prismaMock.user.update.mockResolvedValue(baseUser);

    const res = makeRes();
    await login(req({ email: 'aluno@exemplo.com', password: 'senha123' }), res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('segurança — JWT e requireAdmin', () => {
  it('token assinado carrega userId e role e é verificado pelo middleware', () => {
    process.env.JWT_SECRET = 'test-secret';
    const token = signToken('u1', 'ADMIN');
    const decoded = require('jsonwebtoken').verify(token, 'test-secret');
    expect(decoded.userId).toBe('u1');
    expect(decoded.role).toBe('ADMIN');
  });

  it('requireAdmin bloqueia STUDENT (403)', () => {
    const req = { user: { userId: 'u1', role: 'STUDENT' } } as AuthRequest;
    const res = makeRes();
    const next = vi.fn();
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('requireAdmin libera ADMIN', () => {
    const req = { user: { userId: 'u1', role: 'ADMIN' } } as AuthRequest;
    const res = makeRes();
    const next = vi.fn();
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
