"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderAttachments = exports.deleteAttachment = exports.getAttachmentsByLesson = exports.uploadAttachment = void 0;
const prisma_1 = require("../lib/prisma");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// ============================================================================
// Helper: determinar MediaType a partir do MIME type
// ============================================================================
function getMediaType(mimetype) {
    if (mimetype === 'application/pdf')
        return 'PDF';
    if (mimetype.startsWith('audio/'))
        return 'AUDIO';
    if (mimetype.startsWith('image/'))
        return 'IMAGE';
    return 'PDF'; // Fallback
}
// ============================================================================
// POST /api/attachments/:lessonId — Upload de attachment (Admin/Teacher)
// ============================================================================
const uploadAttachment = async (req, res) => {
    try {
        const lessonId = req.params.lessonId;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }
        // Verificar se a aula existe
        const lesson = await prisma_1.prisma.lesson.findUnique({ where: { id: lessonId } });
        if (!lesson) {
            return res.status(404).json({ error: 'Aula não encontrada.' });
        }
        // Determinar o próximo orderIndex
        const lastAttachment = await prisma_1.prisma.attachment.findFirst({
            where: { lessonId },
            orderBy: { orderIndex: 'desc' },
            select: { orderIndex: true },
        });
        const nextOrderIndex = (lastAttachment?.orderIndex ?? -1) + 1;
        const attachment = await prisma_1.prisma.attachment.create({
            data: {
                lessonId,
                type: getMediaType(file.mimetype),
                url: `/uploads/attachments/${file.filename}`,
                orderIndex: nextOrderIndex,
            },
        });
        return res.status(201).json({ message: 'Arquivo enviado com sucesso', attachment });
    }
    catch (error) {
        console.error('Erro ao enviar attachment:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.uploadAttachment = uploadAttachment;
// ============================================================================
// GET /api/attachments/lesson/:lessonId — Listar attachments de uma aula
// ============================================================================
const getAttachmentsByLesson = async (req, res) => {
    try {
        const lessonId = req.params.lessonId;
        const attachments = await prisma_1.prisma.attachment.findMany({
            where: { lessonId },
            orderBy: { orderIndex: 'asc' },
        });
        return res.status(200).json(attachments);
    }
    catch (error) {
        console.error('Erro ao buscar attachments:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.getAttachmentsByLesson = getAttachmentsByLesson;
// ============================================================================
// DELETE /api/attachments/:id — Deletar attachment (Admin)
// ============================================================================
const deleteAttachment = async (req, res) => {
    try {
        const id = req.params.id;
        const attachment = await prisma_1.prisma.attachment.findUnique({ where: { id } });
        if (!attachment) {
            return res.status(404).json({ error: 'Arquivo não encontrado.' });
        }
        // Remover arquivo do disco
        const filePath = path_1.default.join(process.cwd(), attachment.url);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        await prisma_1.prisma.attachment.delete({ where: { id } });
        return res.status(200).json({ message: 'Arquivo excluído com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao excluir attachment:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.deleteAttachment = deleteAttachment;
// ============================================================================
// PUT /api/attachments/reorder/:lessonId — Reordenar attachments (Admin)
// ============================================================================
const reorderAttachments = async (req, res) => {
    try {
        const lessonId = req.params.lessonId;
        const { order } = req.body; // [{ id: 'uuid', orderIndex: 0 }, ...]
        if (!Array.isArray(order)) {
            return res.status(400).json({ error: 'Formato inválido. Envie um array de ordem.' });
        }
        await prisma_1.prisma.$transaction(order.map((item) => prisma_1.prisma.attachment.update({
            where: { id: item.id },
            data: { orderIndex: item.orderIndex },
        })));
        return res.status(200).json({ message: 'Arquivos reordenados com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao reordenar attachments:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.reorderAttachments = reorderAttachments;
//# sourceMappingURL=attachment.controller.js.map