import { describe, expect, it } from 'vitest';
import {
  XP_PER_LESSON,
  canCompleteLesson,
  rankLeaderboardEntries,
  sanitizeLeaderboardLimit,
} from '../src/controllers/progress.controller';

describe('XP server-side', () => {
  it('XP_PER_LESSON é um valor fixo do servidor (15, coerente com o frontend)', () => {
    expect(XP_PER_LESSON).toBe(15);
  });

  it('canCompleteLesson: aula publicada e não excluída → true', () => {
    expect(canCompleteLesson({ published: true, deletedAt: null })).toBe(true);
  });

  it('canCompleteLesson: rascunho (não publicada) → false', () => {
    expect(canCompleteLesson({ published: false, deletedAt: null })).toBe(false);
  });

  it('canCompleteLesson: aula soft-deletada → false (mesmo publicada)', () => {
    expect(canCompleteLesson({ published: true, deletedAt: new Date() })).toBe(false);
  });

  it('canCompleteLesson: aula inexistente → false', () => {
    expect(canCompleteLesson(null)).toBe(false);
  });
});

describe('sanitizeLeaderboardLimit', () => {
  it('?limit=999999 → limitado a 100', () => {
    expect(sanitizeLeaderboardLimit('999999')).toBe(100);
  });

  it('?limit=abc → fallback 20', () => {
    expect(sanitizeLeaderboardLimit('abc')).toBe(20);
  });

  it('?limit=-1 → fallback 20', () => {
    expect(sanitizeLeaderboardLimit('-1')).toBe(20);
  });

  it('?limit=5 → 5', () => {
    expect(sanitizeLeaderboardLimit('5')).toBe(5);
  });

  it('sem parâmetro → fallback 20', () => {
    expect(sanitizeLeaderboardLimit(undefined)).toBe(20);
  });
});

describe('rankLeaderboardEntries (ordenação determinística)', () => {
  it('XP maior primeiro', () => {
    const ranked = rankLeaderboardEntries([
      { userId: 'a', totalXP: 10, lessonsCompleted: 1 },
      { userId: 'b', totalXP: 30, lessonsCompleted: 1 },
    ]);
    expect(ranked[0].userId).toBe('b');
  });

  it('empate em XP → mais aulas concluídas primeiro', () => {
    const ranked = rankLeaderboardEntries([
      { userId: 'a', totalXP: 20, lessonsCompleted: 1 },
      { userId: 'b', totalXP: 20, lessonsCompleted: 3 },
    ]);
    expect(ranked[0].userId).toBe('b');
  });

  it('empate total → userId menor primeiro (estável)', () => {
    const ranked = rankLeaderboardEntries([
      { userId: 'z', totalXP: 20, lessonsCompleted: 2 },
      { userId: 'a', totalXP: 20, lessonsCompleted: 2 },
    ]);
    expect(ranked[0].userId).toBe('a');
  });
});