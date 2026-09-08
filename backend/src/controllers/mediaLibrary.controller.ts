import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { MediaType } from '../generated/prisma/enums';
import { parseMediaVideoUrl } from '../lib/media-url';

// ============================================================================
// Constantes/validação
// ============================================================================
const MEDIA_TYPES: MediaType[] = ['PDF', 'AUDIO', 'IMAGE', 'VIDEO'];

function isMediaType(value: string): value is MediaType {
  return (MEDIA_TYPES as string[]).includes(value);
}

// ============================================================================
// GET /api/media-library — Listar acervo (público de leitura)
// ============================================================================
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

// ============================================================================
// POST /api/media-library — Criar item (Admin/Teacher)
// ============================================================================
export const createMediaItem = async (req: AuthRequest, res: Response) => {
  try {
    const { moduleId, title, description, type, videoUrl, orderIndex } = req.body;
    const file = req.file;

    if (!title || !type) {
      return res.status(400).json({ error: 'title e type são obrigatórios.' });
    }
    if (!isMediaType(type)) {
      return res.status(400).json({ error: 'Tipo inválido. Use PDF, AUDIO, IMAGE ou VIDEO.' });
    }

    // Módulo relacionado deve existir (evita FK quebrada)
    if (moduleId) {
      const moduleExists = await prisma.module.findUnique({
        where: { id: moduleId },
        select: { id: true },
      });
      if (!moduleExists) {
        return res.status(404).json({ error: 'Módulo não encontrado.' });
      }
    }

    // Regra por tipo:
    //  - VIDEO: URL obrigatória (YouTube/Vimeo), normalizada p/ embed seguro;
    //  - demais: arquivo obrigatório (a menos que venha com URL de vídeo).
    let normalizedVideoUrl: string | null = null;
    if (type === 'VIDEO') {
      if (!videoUrl) {
        return res.status(400).json({ error: 'Informe a URL do vídeo (YouTube ou Vimeo).' });
      }
      const parsed = parseMediaVideoUrl(videoUrl);
      if (!parsed) {
        return res.status(400).json({ error: 'URL de vídeo inválida. Use apenas YouTube ou Vimeo.' });
      }
      normalizedVideoUrl = parsed.embedUrl;
    } else if (videoUrl) {
      return res.status(400).json({ error: 'Conteúdo de vídeo deve usar o tipo VIDEO.' });
    } else if (!file) {
      return res.status(400).json({ error: 'Envie um arquivo para o tipo selecionado.' });
    }

    const item = await prisma.mediaLibrary.create({
      data: {
        moduleId: moduleId || null,
        title,
        description,
        type: type as MediaType,
        videoUrl: normalizedVideoUrl,
        // url local será substituído pela camada de storage persistente
        url: file && type !== 'VIDEO' ? `/uploads/media/${file.filename}` : null,
        orderIndex: orderIndex ?? 0,
      },
    });

    return res.status(201).json({ message: 'Item criado no acervo', item });
  } catch (error) {
    console.error('Erro ao criar item do acervo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// PUT /api/media-library/:id — Atualizar item (Admin/Teacher)
// ============================================================================
export const updateMediaItem = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, description, type, videoUrl, moduleId, orderIndex } = req.body;
    const file = req.file;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (orderIndex !== undefined) data.orderIndex = orderIndex;

    if (type !== undefined) {
      if (!isMediaType(type)) {
        return res.status(400).json({ error: 'Tipo inválido. Use PDF, AUDIO, IMAGE ou VIDEO.' });
      }
      data.type = type;
    }

    // Mudou o módulo?
    if (moduleId !== undefined && moduleId) {
      const moduleExists = await prisma.module.findUnique({
        where: { id: moduleId },
        select: { id: true },
      });
      if (!moduleExists) {
        return res.status(404).json({ error: 'Módulo não encontrado.' });
      }
      data.moduleId = moduleId;
    } else if (moduleId !== undefined) {
      data.moduleId = null;
    }

    // URL de vídeo: normalizada; só para tipo VIDEO
    if (videoUrl !== undefined) {
      const trimmed = typeof videoUrl === 'string' ? videoUrl.trim() : '';
      if (!trimmed) {
        const existing = await prisma.mediaLibrary.findUnique({
          where: { id },
          select: { type: true },
        });
        data.videoUrl = null;
        if (type === undefined && existing?.type === 'VIDEO') data.type = 'PDF';
      } else {
        const parsed = parseMediaVideoUrl(trimmed);
        if (!parsed) {
          return res.status(400).json({ error: 'URL de vídeo inválida. Use apenas YouTube ou Vimeo.' });
        }
        data.videoUrl = parsed.embedUrl;
        data.type = 'VIDEO';
        data.url = null;
      }
    }

    if (file) {
      if (data.type === 'VIDEO') {
        return res.status(400).json({ error: 'Itens de vídeo usam URL, não arquivo.' });
      }
      // url local será substituído pela camada de storage persistente
      data.url = `/uploads/media/${file.filename}`;
      data.videoUrl = null;
      data.type = data.type || 'PDF';
    }

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

// ============================================================================
// DELETE /api/media-library/:id — Excluir item (Admin)
// ============================================================================
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

// ============================================================================
// PUT /api/media-library/reorder — Reordenar acervo (Admin)
// ============================================================================
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
