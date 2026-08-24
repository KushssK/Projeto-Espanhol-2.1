"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderCategories = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoriesByModule = void 0;
const prisma_1 = require("../lib/prisma");
const getCategoriesByModule = async (req, res) => {
    try {
        const moduleId = req.params.moduleId;
        const categories = await prisma_1.prisma.category.findMany({
            where: { moduleId },
            orderBy: { orderIndex: 'asc' },
            include: {
                lessons: {
                    orderBy: { orderIndex: 'asc' },
                    select: { id: true, title: true, orderIndex: true },
                },
            },
        });
        return res.status(200).json(categories);
    }
    catch (error) {
        console.error('Erro ao listar categorias:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.getCategoriesByModule = getCategoriesByModule;
const createCategory = async (req, res) => {
    try {
        const { moduleId, title, description, orderIndex } = req.body;
        if (!moduleId || !title) {
            return res.status(400).json({ error: 'moduleId e title são obrigatórios.' });
        }
        const category = await prisma_1.prisma.category.create({
            data: { moduleId, title, description, orderIndex: orderIndex ?? 0 },
        });
        return res.status(201).json({ message: 'Categoria criada', category });
    }
    catch (error) {
        console.error('Erro ao criar categoria:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, description } = req.body;
        const category = await prisma_1.prisma.category.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
            },
        });
        return res.status(200).json({ message: 'Categoria atualizada', category });
    }
    catch (error) {
        if (error?.code === 'P2025') {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }
        console.error('Erro ao atualizar categoria:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const withLessons = await prisma_1.prisma.category.findUnique({
            where: { id },
            include: { lessons: { select: { id: true }, take: 1 } },
        });
        if (!withLessons) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }
        if (withLessons.lessons.length > 0) {
            return res.status(400).json({
                error: 'Remova ou mova as aulas desta categoria antes de excluí-la.',
            });
        }
        await prisma_1.prisma.category.delete({ where: { id } });
        return res.status(200).json({ message: 'Categoria excluída.' });
    }
    catch (error) {
        console.error('Erro ao excluir categoria:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.deleteCategory = deleteCategory;
const reorderCategories = async (req, res) => {
    try {
        const moduleId = req.params.moduleId;
        const { order } = req.body;
        if (!Array.isArray(order)) {
            return res.status(400).json({ error: 'Envie order: [{ id, orderIndex }].' });
        }
        await prisma_1.prisma.$transaction(order.map((item) => prisma_1.prisma.category.updateMany({
            where: { id: item.id, moduleId },
            data: { orderIndex: item.orderIndex },
        })));
        return res.status(200).json({ message: 'Categorias reordenadas.' });
    }
    catch (error) {
        console.error('Erro ao reordenar categorias:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.reorderCategories = reorderCategories;
//# sourceMappingURL=category.controller.js.map