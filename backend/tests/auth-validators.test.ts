import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../src/validators/auth.validators';

function yearsAgo(n: number, offsetDays = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

describe('registerSchema', () => {
  const base = {
    email: 'aluno@exemplo.com',
    password: 'senha123',
    username: 'aluno_01',
  };

  it('cadastro válido com 13 anos completos (aniversário ontem)', () => {
    const res = registerSchema.safeParse({ ...base, dob: yearsAgo(13, -1) });
    expect(res.success).toBe(true);
  });

  it('quem faz 13 anos AMANHÃ NÃO pode se cadastrar hoje', () => {
    const res = registerSchema.safeParse({ ...base, dob: yearsAgo(13, 1) });
    expect(res.success).toBe(false);
  });

  it('menor de 13 (12 anos) é recusado', () => {
    const res = registerSchema.safeParse({ ...base, dob: yearsAgo(12, -5) });
    expect(res.success).toBe(false);
  });

  it('maior de 13 é aceito', () => {
    const res = registerSchema.safeParse({ ...base, dob: yearsAgo(18) });
    expect(res.success).toBe(true);
  });

  it('e-mail inválido é recusado', () => {
    const res = registerSchema.safeParse({ ...base, dob: yearsAgo(18), email: 'sem-arroba' });
    expect(res.success).toBe(false);
  });
});

describe('loginSchema (e-mail + senha — sem código)', () => {
  const base = {
    email: 'aluno@exemplo.com',
    password: 'senha123',
  };

  it('aceita e-mail + senha (login direto, sem etapa de código)', () => {
    expect(loginSchema.safeParse(base).success).toBe(true);
  });

  it('exige os dois campos (falta senha → rejeita)', () => {
    const { password: _pw, ...semSenha } = base;
    expect(loginSchema.safeParse(semSenha).success).toBe(false);
  });

  it('exige os dois campos (falta e-mail → rejeita)', () => {
    const { email: _em, ...semEmail } = base;
    expect(loginSchema.safeParse(semEmail).success).toBe(false);
  });
});