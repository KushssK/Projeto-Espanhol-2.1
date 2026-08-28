import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { MediaType } from '../generated/prisma/enums';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Helper: determinar MediaType a partir do MIME type
// ============================================================================
function getMediaType(mimetype: string): MediaType {
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype.startsWith('audio/')) return 'AUDIO';
  if (mimetype.startsWith('image/')) return 'IMAGE';
  return 'PDF'; // Fallback
}

// ============================================================================
// POST /api/attachments/:lessonId — Upload de attachment (Admin/Teacher)
// ============================================================================
export const uploadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.lessonId as string;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    // Verificar se a aula existe
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    // Determinar o próximo orderIndex
    const lastAttachment = await prisma.attachment.findFirst({
      where: { lessonId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    const nextOrderIndex = (lastAttachment?.orderIndex ?? -1) + 1;

    const attachment = await prisma.attachment.create({
      data: {
        lessonId,
        type: getMediaType(file.mimetype),
        url: `/uploads/attachments/${file.filename}`,
        orderIndex: nextOrderIndex,
      },
    });

    return res.status(201).json({ message: 'Arquivo enviado com sucesso', attachment });
  } catch (error) {
    console.error('Erro ao enviar attachment:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/attachments/lesson/:lessonId — Listar attachments de uma aula
// ============================================================================
export const getAttachmentsByLesson = async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.lessonId as string;

    const attachments = await prisma.attachment.findMany({
      where: { lessonId },
      orderBy: { orderIndex: 'asc' },
    });

    return res.status(200).json(attachments);
  } catch (error) {
    console.error('Erro ao buscar attachments:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// DELETE /api/attachments/:id — Deletar attachment (Admin)
// ============================================================================
export const deleteAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) {
      return res.status(404).json({ error: 'Arquivo não encontrado.' });
    }

    // Remover arquivo do disco
    const filePath = path.join(process.cwd(), attachment.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.attachment.delete({ where: { id } });

    return res.status(200).json({ message: 'Arquivo excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir attachment:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// PUT /api/attachments/reorder/:lessonId — Reordenar attachments (Admin)
// ============================================================================
export const reorderAttachments = async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.lessonId as string;
    const { order } = req.body; // [{ id: 'uuid', orderIndex: 0 }, ...]

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Formato inválido. Envie um array de ordem.' });
    }

    await prisma.$transaction(
      order.map((item: { id: string; orderIndex: number }) =>
        prisma.attachment.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    return res.status(200).json({ message: 'Arquivos reordenados com sucesso.' });
  } catch (error) {
    console.error('Erro ao reordenar attachments:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
