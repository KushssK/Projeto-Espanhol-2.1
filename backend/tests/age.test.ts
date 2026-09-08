import { describe, expect, it } from 'vitest';
import { hasCompletedAge } from '../src/lib/age';

function yearsAgo(n: number, offsetDays = 0): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

describe('hasCompletedAge (13 anos COMPLETOS)', () => {
  it('faz 13 anos HOJE → pode cadastrar', () => {
    expect(hasCompletedAge(yearsAgo(13), 13)).toBe(true);
  });

  it('faz 13 anos AMANHÃ → NÃO pode cadastrar hoje', () => {
    expect(hasCompletedAge(yearsAgo(13, 1), 13)).toBe(false);
  });

  it('fez 13 anos ONTEM → pode cadastrar', () => {
    expect(hasCompletedAge(yearsAgo(13, -1), 13)).toBe(true);
  });

  it('12 anos → NÃO pode cadastrar', () => {
    expect(hasCompletedAge(yearsAgo(12, -10), 13)).toBe(false);
  });

  it('15 anos → pode cadastrar', () => {
    expect(hasCompletedAge(yearsAgo(15, -10), 13)).toBe(true);
  });

  it('data inválida → false', () => {
    expect(hasCompletedAge(new Date('invalido'), 13)).toBe(false);
  });
});