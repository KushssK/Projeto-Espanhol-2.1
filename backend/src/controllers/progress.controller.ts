import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// ============================================================================
// Regra oficial de pontuação — determinada PELO SERVIDOR.
//
// O frontend exibe "15 XP por aula concluída" (LessonView). Para manter a
// experiência existente consistente, o servidor concede exatamente 15 XP por
// aula — o valor enviado pelo cliente no corpo da requisição é IGNORADO.
// ============================================================================
export const XP_PER_LESSON = 15;

const LEADERBOARD_DEFAULT_LIMIT = 20;
const LEADERBOARD_MAX_LIMIT = 100;
const LEADERBOARD_BATCH = 100;

/** Aula disponível para o aluno? Publicada, sem soft delete e existente. */
export function canCompleteLesson(
  lesson: { published: boolean; deletedAt: Date | null } | null
): boolean {
  return Boolean(lesson && lesson.published && !lesson.deletedAt);
}

// ============================================================================
// Helpers puros (exportados para testes)
// ============================================================================

/** Saneia o parâmetro ?limit: inteiro entre 1 e LEADERBOARD_MAX_LIMIT. */
export function sanitizeLeaderboardLimit(value: unknown, fallback = LEADERBOARD_DEFAULT_LIMIT): number {
  const parsed = typeof value === 'string' ? parseInt(value, 10) : NaN;
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, LEADERBOARD_MAX_LIMIT);
}

interface LeaderboardEntry {
  userId: string;
  totalXP: number;
  lessonsCompleted: number;
  username: string;
  avatarUrl: string | null;
}

/**
 * Ordenação determinística do ranking (nada de ordem arbitrária do banco):
 *   1. XP maior;
 *   2. mais aulas concluídas;
 *   3. userId (último desempate técnico estável).
 */
export function rankLeaderboardEntries<T extends { userId: string; totalXP: number; lessonsCompleted: number }>(
  entries: T[]
): T[] {
  return [...entries].sort((a, b) => {
    if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;
    if (b.lessonsCompleted !== a.lessonsCompleted) return b.lessonsCompleted - a.lessonsCompleted;
    return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
  });
}

// ============================================================================
// POST /api/progress/:lessonId — Marcar aula como concluída
//
// Segurança: o XP é SEMPRE definido pelo servidor (XP_PER_LESSON). O campo
// `score` do body é ignorado — repetir a aula não acumula XP (upsert) e aulas
// rascunho/excluídas não podem gerar progresso.
// ============================================================================
export const markLessonComplete = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const lessonId = req.params.lessonId as string;

    // Verificar se a aula existe e está disponível para alunos
    // (publicada e sem soft delete)
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!canCompleteLesson(lesson)) {
      return res.status(404).json({ error: 'Aula não encontrada ou não publicada.' });
    }

    const progress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      update: {
        isCompleted: true,
        score: XP_PER_LESSON, // XP sempre fixo — nunca vindo do cliente
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        isCompleted: true,
        score: XP_PER_LESSON,
        completedAt: new Date(),
      },
    });

    return res.status(200).json({ message: 'Progresso registrado com sucesso', progress });
  } catch (error) {
    console.error('Erro ao registrar progresso:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/progress/me — Retornar todo o progresso do usuário autenticado
// ============================================================================
export const getMyProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const progress = await prisma.userProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            moduleId: true,
            module: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Calcular XP total
    const totalXP = progress.reduce((acc: number, p: any) => acc + p.score, 0);
    const completedCount = progress.filter((p: any) => p.isCompleted).length;

    return res.status(200).json({
      totalXP,
      completedCount,
      progress,
    });
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/progress/module/:moduleId — Progresso por módulo
//
// O denominador considera SOMENTE aulas publicadas e não excluídas —
// rascunho/exclusão não aumentam o total do aluno.
// ============================================================================
export const getModuleProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const moduleId = req.params.moduleId as string;

    // Total de aulas DISPONÍVEIS no módulo (publicadas, sem soft delete)
    const totalLessons = await prisma.lesson.count({
      where: { moduleId, published: true, deletedAt: null },
    });

    // Aulas completadas pelo usuário neste módulo (só aulas disponíveis)
    const completedLessons = await prisma.userProgress.count({
      where: {
        userId,
        isCompleted: true,
        lesson: { moduleId, published: true, deletedAt: null },
      },
    });

    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return res.status(200).json({
      moduleId,
      totalLessons,
      completedLessons,
      percentage,
    });
  } catch (error) {
    console.error('Erro ao buscar progresso do módulo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/progress/leaderboard — Ranking GERAL por XP acumulado
//
//  - limit saneado (máx. 100);
//  - usuários banidos NÃO aparecem;
//  - ordenação determinística (XP → aulas → userId);
//  - ranking acumulado (all-time) — sem período.
// ============================================================================
export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const limit = sanitizeLeaderboardLimit(req.query.limit);

    // Paginação em lotes: usuários banidos não consomem vagas do top-N
    const collected: LeaderboardEntry[] = [];
    let skip = 0;
    let guard = 0;

    while (collected.length < limit && guard < 2000) {
      const batch = await prisma.userProgress.groupBy({
        by: ['userId'],
        _sum: { score: true },
        _count: { lessonId: true },
        orderBy: { _sum: { score: 'desc' } },
        skip,
        take: LEADERBOARD_BATCH,
      });

      if (batch.length === 0) break;

      const userIds = batch.map((entry) => entry.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, avatarUrl: true, isBanned: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      for (const entry of batch) {
        const user = userMap.get(entry.userId);
        if (!user || user.isBanned) continue; // banidos ficam de fora
        collected.push({
          userId: entry.userId,
          username: user.username || 'Anônimo',
          avatarUrl: user.avatarUrl,
          totalXP: entry._sum.score || 0,
          lessonsCompleted: entry._count.lessonId,
        });
        if (collected.length >= limit) break;
      }

      skip += LEADERBOARD_BATCH;
      guard += 1;
    }

    const ranked = rankLeaderboardEntries(collected);
    const result = ranked.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      username: entry.username,
      avatarUrl: entry.avatarUrl,
      totalXP: entry.totalXP,
      lessonsCompleted: entry.lessonsCompleted,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao buscar leaderboard:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
