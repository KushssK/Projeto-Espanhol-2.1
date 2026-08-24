"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = exports.getModuleProgress = exports.getMyProgress = exports.markLessonComplete = void 0;
const prisma_1 = require("../lib/prisma");
// ============================================================================
// POST /api/progress/:lessonId — Marcar aula como concluída
// ============================================================================
const markLessonComplete = async (req, res) => {
    try {
        const userId = req.user.userId;
        const lessonId = req.params.lessonId;
        const { score } = req.body;
        // Verificar se a aula existe
        const lesson = await prisma_1.prisma.lesson.findUnique({ where: { id: lessonId } });
        if (!lesson) {
            return res.status(404).json({ error: 'Aula não encontrada.' });
        }
        const progress = await prisma_1.prisma.userProgress.upsert({
            where: {
                userId_lessonId: { userId, lessonId },
            },
            update: {
                isCompleted: true,
                score: score || 10, // Score padrão: 10 XP
                completedAt: new Date(),
            },
            create: {
                userId,
                lessonId,
                isCompleted: true,
                score: score || 10,
                completedAt: new Date(),
            },
        });
        return res.status(200).json({ message: 'Progresso registrado com sucesso', progress });
    }
    catch (error) {
        console.error('Erro ao registrar progresso:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.markLessonComplete = markLessonComplete;
// ============================================================================
// GET /api/progress/me — Retornar todo o progresso do usuário autenticado
// ============================================================================
const getMyProgress = async (req, res) => {
    try {
        const userId = req.user.userId;
        const progress = await prisma_1.prisma.userProgress.findMany({
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
        const totalXP = progress.reduce((acc, p) => acc + p.score, 0);
        const completedCount = progress.filter((p) => p.isCompleted).length;
        return res.status(200).json({
            totalXP,
            completedCount,
            progress,
        });
    }
    catch (error) {
        console.error('Erro ao buscar progresso:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.getMyProgress = getMyProgress;
// ============================================================================
// GET /api/progress/module/:moduleId — Progresso por módulo
// ============================================================================
const getModuleProgress = async (req, res) => {
    try {
        const userId = req.user.userId;
        const moduleId = req.params.moduleId;
        // Total de aulas no módulo
        const totalLessons = await prisma_1.prisma.lesson.count({ where: { moduleId } });
        // Aulas completadas pelo usuário neste módulo
        const completedLessons = await prisma_1.prisma.userProgress.count({
            where: {
                userId,
                isCompleted: true,
                lesson: { moduleId },
            },
        });
        const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        return res.status(200).json({
            moduleId,
            totalLessons,
            completedLessons,
            percentage,
        });
    }
    catch (error) {
        console.error('Erro ao buscar progresso do módulo:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.getModuleProgress = getModuleProgress;
// ============================================================================
// GET /api/progress/leaderboard — Ranking global por XP
// ============================================================================
const getLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        // Agregar pontuação por usuário
        const leaderboard = await prisma_1.prisma.userProgress.groupBy({
            by: ['userId'],
            _sum: { score: true },
            _count: { lessonId: true },
            orderBy: { _sum: { score: 'desc' } },
            take: limit,
        });
        // Enriquecer com dados do usuário
        const userIds = leaderboard.map((entry) => entry.userId);
        const users = await prisma_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, avatarUrl: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        const result = leaderboard.map((entry, index) => ({
            rank: index + 1,
            userId: entry.userId,
            username: userMap.get(entry.userId)?.username || 'Anônimo',
            avatarUrl: userMap.get(entry.userId)?.avatarUrl || null,
            totalXP: entry._sum.score || 0,
            lessonsCompleted: entry._count.lessonId,
        }));
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('Erro ao buscar leaderboard:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.getLeaderboard = getLeaderboard;
//# sourceMappingURL=progress.controller.js.map