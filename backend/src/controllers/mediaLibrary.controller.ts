import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { MediaType } from '../generated/prisma/enums';

export const listMediaLibrary = async (req: Request, res: Response) => {
  try {
    const moduleId = req.query.moduleId as string | undefined;

    const items = await prisma.mediaLibrary.findMany({
      where: moduleId ? { moduleId } : undefined,
      orderBy: { orderIndex: 'asc' },
    });

    return res.status(200).json(items);
  } catch (error) {
    console.error('Erro ao listar acervo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const createMediaItem = async (req: AuthRequest, res: Response) => {
  try {
    const { moduleId, title, description, type, videoUrl, orderIndex } = req.body;
    const file = req.file;

    if (!title || !type) {
      return res.status(400).json({ error: 'title e type são obrigatórios.' });
    }

    if (!file && !videoUrl) {
      return res.status(400).json({ error: 'Informe um arquivo ou videoUrl.' });
    }

    const item = await prisma.mediaLibrary.create({
      data: {
        moduleId: moduleId || null,
        title,
        description,
        type: type as MediaType,
        videoUrl: videoUrl || null,
        url: file ? `/uploads/media/${file.filename}` : null,
        orderIndex: orderIndex ?? 0,
      },
    });

    return res.status(201).json({ message: 'Item criado no acervo', item });
  } catch (error) {
    console.error('Erro ao criar item do acervo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const updateMediaItem = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, description, type, videoUrl, moduleId, orderIndex } = req.body;
    const file = req.file;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (type !== undefined) data.type = type;
    if (videoUrl !== undefined) data.videoUrl = videoUrl;
    if (moduleId !== undefined) data.moduleId = moduleId || null;
    if (orderIndex !== undefined) data.orderIndex = orderIndex;
    if (file) data.url = `/uploads/media/${file.filename}`;

    const item = await prisma.mediaLibrary.update({
      where: { id },
      data,
    });

    return res.status(200).json({ message: 'Item atualizado', item });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Item não encontrado.' });
    }
    console.error('Erro ao atualizar acervo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const deleteMediaItem = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.mediaLibrary.delete({ where: { id } });
    return res.status(200).json({ message: 'Item removido do acervo.' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Item não encontrado.' });
    }
    console.error('Erro ao excluir acervo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const reorderMediaLibrary = async (req: AuthRequest, res: Response) => {
  try {
    const { order } = req.body as { order: { id: string; orderIndex: number }[] };

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Envie order: [{ id, orderIndex }].' });
    }

    await prisma.$transaction(
      order.map((item) =>
        prisma.mediaLibrary.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    return res.status(200).json({ message: 'Acervo reordenado.' });
  } catch (error) {
    console.error('Erro ao reordenar acervo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
