"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderLessons = exports.deleteLesson = exports.updateLesson = exports.createLesson = exports.getLessonById = exports.getLessonsByModule = void 0;
const prisma_1 = require("../lib/prisma");
// ============================================================================
// GET /api/lessons/module/:moduleId — Listar aulas de um módulo
// ============================================================================
const getLessonsByModule = async (req, res) => {
    try {
        const moduleId = req.params.moduleId;
        const lessons = await prisma_1.prisma.lesson.findMany({
            where: { moduleId },
            orderBy: { orderIndex: 'asc' },
            include: {
                attachments: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
        return res.status(200).json(lessons);
    }
    catch (error) {
        console.error('Erro ao buscar aulas:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.getLessonsByModule = getLessonsByModule;
// ============================================================================
// GET /api/lessons/:id — Buscar aula por ID
// ============================================================================
const getLessonById = async (req, res) => {
    try {
        const id = req.params.id;
        const lesson = await prisma_1.prisma.lesson.findUnique({
            where: { id },
            include: {
                attachments: {
                    orderBy: { orderIndex: 'asc' },
                },
                module: {
                    select: { id: true, title: true },
                },
            },
        });
        if (!lesson) {
            return res.status(404).json({ error: 'Aula não encontrada.' });
        }
        return res.status(200).json(lesson);
    }
    catch (error) {
        console.error('Erro ao buscar aula:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.getLessonById = getLessonById;
// ============================================================================
// POST /api/lessons — Criar aula (Admin/Teacher)
// ============================================================================
const createLesson = async (req, res) => {
    try {
        const { moduleId, title, content, videoUrl, orderIndex } = req.body;
        if (!moduleId || !title || !content) {
            return res.status(400).json({ error: 'moduleId, title e content são obrigatórios.' });
        }
        // Verificar se o módulo existe
        const moduleExists = await prisma_1.prisma.module.findUnique({ where: { id: moduleId } });
        if (!moduleExists) {
            return res.status(404).json({ error: 'Módulo não encontrado.' });
        }
        const lesson = await prisma_1.prisma.lesson.create({
            data: {
                moduleId,
                title,
                content,
                videoUrl,
                orderIndex: orderIndex || 0,
            },
        });
        return res.status(201).json({ message: 'Aula criada com sucesso', lesson });
    }
    catch (error) {
        console.error('Erro ao criar aula:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.createLesson = createLesson;
// ============================================================================
// PUT /api/lessons/:id — Atualizar aula (Admin/Teacher)
// ============================================================================
const updateLesson = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, content, videoUrl } = req.body;
        const existing = await prisma_1.prisma.lesson.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Aula não encontrada.' });
        }
        const updated = await prisma_1.prisma.lesson.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(content !== undefined && { content }),
                ...(videoUrl !== undefined && { videoUrl }),
            },
        });
        return res.status(200).json({ message: 'Aula atualizada com sucesso', lesson: updated });
    }
    catch (error) {
        console.error('Erro ao atualizar aula:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.updateLesson = updateLesson;
// ============================================================================
// DELETE /api/lessons/:id — Deletar aula (Admin)
// ============================================================================
const deleteLesson = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma_1.prisma.lesson.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Aula não encontrada.' });
        }
        // Cascade: apagar attachments e progresso vinculados
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.attachment.deleteMany({ where: { lessonId: id } }),
            prisma_1.prisma.userProgress.deleteMany({ where: { lessonId: id } }),
            prisma_1.prisma.lesson.delete({ where: { id } }),
        ]);
        return res.status(200).json({ message: 'Aula excluída com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao excluir aula:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.deleteLesson = deleteLesson;
// ============================================================================
// PUT /api/lessons/reorder/:moduleId — Reordenar aulas de um módulo (Admin)
// ============================================================================
const reorderLessons = async (req, res) => {
    try {
        const moduleId = req.params.moduleId;
        const { order } = req.body; // [{ id: 'uuid', orderIndex: 1 }, ...]
        if (!Array.isArray(order)) {
            return res.status(400).json({ error: 'Formato inválido. Envie um array de ordem.' });
        }
        // Verificar que todas as aulas pertencem ao módulo
        const lessonIds = order.map((item) => item.id);
        const lessons = await prisma_1.prisma.lesson.findMany({
            where: { id: { in: lessonIds }, moduleId },
            select: { id: true },
        });
        if (lessons.length !== lessonIds.length) {
            return res.status(400).json({ error: 'Uma ou mais aulas não pertencem ao módulo informado.' });
        }
        await prisma_1.prisma.$transaction(order.map((item) => prisma_1.prisma.lesson.update({
            where: { id: item.id },
            data: { orderIndex: item.orderIndex },
        })));
        return res.status(200).json({ message: 'Aulas reordenadas com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao reordenar aulas:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.reorderLessons = reorderLessons;
//# sourceMappingURL=lesson.controller.js.map