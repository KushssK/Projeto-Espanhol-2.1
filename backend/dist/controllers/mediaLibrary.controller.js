"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderMediaLibrary = exports.deleteMediaItem = exports.updateMediaItem = exports.createMediaItem = exports.listMediaLibrary = void 0;
const prisma_1 = require("../lib/prisma");
const listMediaLibrary = async (req, res) => {
    try {
        const moduleId = req.query.moduleId;
        const items = await prisma_1.prisma.mediaLibrary.findMany({
            where: moduleId ? { moduleId } : undefined,
            orderBy: { orderIndex: 'asc' },
        });
        return res.status(200).json(items);
    }
    catch (error) {
        console.error('Erro ao listar acervo:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.listMediaLibrary = listMediaLibrary;
const createMediaItem = async (req, res) => {
    try {
        const { moduleId, title, description, type, videoUrl, orderIndex } = req.body;
        const file = req.file;
        if (!title || !type) {
            return res.status(400).json({ error: 'title e type são obrigatórios.' });
        }
        if (!file && !videoUrl) {
            return res.status(400).json({ error: 'Informe um arquivo ou videoUrl.' });
        }
        const item = await prisma_1.prisma.mediaLibrary.create({
            data: {
                moduleId: moduleId || null,
                title,
                description,
                type: type,
                videoUrl: videoUrl || null,
                url: file ? `/uploads/media/${file.filename}` : null,
                orderIndex: orderIndex ?? 0,
            },
        });
        return res.status(201).json({ message: 'Item criado no acervo', item });
    }
    catch (error) {
        console.error('Erro ao criar item do acervo:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.createMediaItem = createMediaItem;
const updateMediaItem = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, description, type, videoUrl, moduleId, orderIndex } = req.body;
        const file = req.file;
        const data = {};
        if (title !== undefined)
            data.title = title;
        if (description !== undefined)
            data.description = description;
        if (type !== undefined)
            data.type = type;
        if (videoUrl !== undefined)
            data.videoUrl = videoUrl;
        if (moduleId !== undefined)
            data.moduleId = moduleId || null;
        if (orderIndex !== undefined)
            data.orderIndex = orderIndex;
        if (file)
            data.url = `/uploads/media/${file.filename}`;
        const item = await prisma_1.prisma.mediaLibrary.update({
            where: { id },
            data,
        });
        return res.status(200).json({ message: 'Item atualizado', item });
    }
    catch (error) {
        if (error?.code === 'P2025') {
            return res.status(404).json({ error: 'Item não encontrado.' });
        }
        console.error('Erro ao atualizar acervo:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.updateMediaItem = updateMediaItem;
const deleteMediaItem = async (req, res) => {
    try {
        const id = req.params.id;
        await prisma_1.prisma.mediaLibrary.delete({ where: { id } });
        return res.status(200).json({ message: 'Item removido do acervo.' });
    }
    catch (error) {
        if (error?.code === 'P2025') {
            return res.status(404).json({ error: 'Item não encontrado.' });
        }
        console.error('Erro ao excluir acervo:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.deleteMediaItem = deleteMediaItem;
const reorderMediaLibrary = async (req, res) => {
    try {
        const { order } = req.body;
        if (!Array.isArray(order)) {
            return res.status(400).json({ error: 'Envie order: [{ id, orderIndex }].' });
        }
        await prisma_1.prisma.$transaction(order.map((item) => prisma_1.prisma.mediaLibrary.update({
            where: { id: item.id },
            data: { orderIndex: item.orderIndex },
        })));
        return res.status(200).json({ message: 'Acervo reordenado.' });
    }
    catch (error) {
        console.error('Erro ao reordenar acervo:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.reorderMediaLibrary = reorderMediaLibrary;
//# sourceMappingURL=mediaLibrary.controller.js.map