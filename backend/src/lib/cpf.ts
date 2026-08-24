import { createHash } from 'crypto';

/** Remove pontuação e mantém 11 dígitos. */
export function normalizeCpf(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 11) return null;
  return digits;
}

export function hashCpf(cpf: string): string {
  return createHash('sha256').update(cpf).digest('hex');
}
