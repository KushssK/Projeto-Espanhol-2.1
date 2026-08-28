"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderModules = exports.deleteModule = exports.updateModule = exports.createModule = exports.getModuleById = exports.getModules = void 0;
const prisma_1 = require("../lib/prisma");
// ============================================================================
// GET /api/modules — Listar todos os módulos (público)
// ============================================================================
const getModules = async (req, res) => {
    try {
        const modules = await prisma_1.prisma.module.findMany({
            orderBy: { orderIndex: 'asc' },
            include: {
                lessons: {
                    orderBy: { orderIndex: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        orderIndex: true,
                    },
                },
            },
        });
        return res.status(200).json(modules);
    }
    catch (error) {
        console.error('Erro ao buscar módulos:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.getModules = getModules;
// ============================================================================
// GET /api/modules/:id — Buscar módulo por ID
// ============================================================================
const getModuleById = async (req, res) => {
    try {
        const id = req.params.id;
        const module = await prisma_1.prisma.module.findUnique({
            where: { id },
            include: {
                lessons: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        attachments: {
                            orderBy: { orderIndex: 'asc' },
                        },
                    },
                },
            },
        });
        if (!module) {
            return res.status(404).json({ error: 'Módulo não encontrado.' });
        }
        return res.status(200).json(module);
    }
    catch (error) {
        console.error('Erro ao buscar módulo:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.getModuleById = getModuleById;
// ============================================================================
// POST /api/modules — Criar módulo (Admin)
// ============================================================================
const createModule = async (req, res) => {
    try {
        const { title, description, orderIndex } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'O título do módulo é obrigatório.' });
        }
        const newModule = await prisma_1.prisma.module.create({
            data: {
                title,
                description,
                orderIndex: orderIndex || 0,
            },
        });
        return res.status(201).json({ message: 'Módulo criado com sucesso', module: newModule });
    }
    catch (error) {
        console.error('Erro ao criar módulo:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.createModule = createModule;
// ============================================================================
// PUT /api/modules/:id — Atualizar módulo (Admin)
// ============================================================================
const updateModule = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, description } = req.body;
        const existing = await prisma_1.prisma.module.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Módulo não encontrado.' });
        }
        const updated = await prisma_1.prisma.module.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
            },
        });
        return res.status(200).json({ message: 'Módulo atualizado com sucesso', module: updated });
    }
    catch (error) {
        console.error('Erro ao atualizar módulo:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.updateModule = updateModule;
// ============================================================================
// DELETE /api/modules/:id — Deletar módulo (Admin)
// ============================================================================
const deleteModule = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma_1.prisma.module.findUnique({
            where: { id },
            include: { lessons: { select: { id: true } } },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Módulo não encontrado.' });
        }
        if (existing.lessons.length > 0) {
            return res.status(400).json({
                error: 'Não é possível excluir um módulo que contém aulas. Remova as aulas primeiro.',
            });
        }
        await prisma_1.prisma.module.delete({ where: { id } });
        return res.status(200).json({ message: 'Módulo excluído com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao excluir módulo:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.deleteModule = deleteModule;
// ============================================================================
// PUT /api/modules/reorder — Reordenar módulos (Admin)
// ============================================================================
const reorderModules = async (req, res) => {
    try {
        const { order } = req.body; // [{ id: 'uuid', orderIndex: 1 }, ...]
        if (!Array.isArray(order)) {
            return res.status(400).json({ error: 'Formato inválido. Envie um array de ordem.' });
        }
        await prisma_1.prisma.$transaction(order.map((item) => prisma_1.prisma.module.update({
            where: { id: item.id },
            data: { orderIndex: item.orderIndex },
        })));
        return res.status(200).json({ message: 'Módulos reordenados com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao reordenar módulos:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.reorderModules = reorderModules;
//# sourceMappingURL=module.controller.js.map