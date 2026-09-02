import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// ============================================================================
// Helpers — Normalização de URL do YouTube
// ============================================================================

/**
 * Extrai o VIDEO_ID de diversas formatações de URL do YouTube.
 * Retorna null se a URL não for válida.
 */
function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

/**
 * Normaliza uma URL do YouTube para o formato padronizado watch?v=ID.
 * Retorna a URL original se não for YouTube.
 */
function normalizeYouTubeUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return url;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

// ============================================================================
// GET /api/lessons/module/:moduleId — Listar aulas de um módulo
// Admin/Teacher com ?includeDeleted=true veem aulas excluídas também
// ============================================================================
export const getLessonsByModule = async (req: AuthRequest, res: Response) => {
  try {
    const moduleId = req.params.moduleId as string;
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'TEACHER';
    const includeDeleted = isStaff && req.query.includeDeleted === 'true';

    const lessons = await prisma.lesson.findMany({
      where: {
        moduleId,
        ...(includeDeleted ? {} : { deletedAt: null }),
        ...(isStaff ? {} : { published: true }),
      },
      orderBy: { orderIndex: 'asc' },
      include: {
        attachments: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return res.status(200).json(lessons);
  } catch (error) {
    console.error('Erro ao buscar aulas:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/lessons/deleted — Listar aulas excluídas (Admin/Teacher)
// ============================================================================
export const getDeletedLessons = async (req: AuthRequest, res: Response) => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      include: {
        module: { select: { id: true, title: true } },
      },
    });

    return res.status(200).json(lessons);
  } catch (error) {
    console.error('Erro ao buscar aulas excluídas:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/lessons/:id — Buscar aula por ID
// ============================================================================
export const getLessonById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const lesson = await prisma.lesson.findUnique({
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

    // Se a aula está soft-deletada, só staff pode ver
    if (lesson.deletedAt) {
      const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'TEACHER';
      if (!isStaff) {
        return res.status(404).json({ error: 'Aula não encontrada.' });
      }
    }

    return res.status(200).json(lesson);
  } catch (error) {
    console.error('Erro ao buscar aula:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// POST /api/lessons — Criar aula (Admin/Teacher)
// ============================================================================
export const createLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { moduleId, categoryId, title, content, videoUrl, orderIndex, published } = req.body;

    if (!moduleId || !title || !content) {
      return res.status(400).json({ error: 'moduleId, title e content são obrigatórios.' });
    }

    // Verificar se o módulo existe
    const moduleExists = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!moduleExists) {
      return res.status(404).json({ error: 'Módulo não encontrado.' });
    }

    // Normalizar URL do YouTube (watch?v=ID, youtu.be/ID, shorts/ID → watch?v=ID)
    const normalizedUrl = videoUrl ? normalizeYouTubeUrl(videoUrl) : null;

    // Verificar duplicata por videoUrl normalizada (ignorar aulas soft-deletadas)
    if (normalizedUrl) {
      const existing = await prisma.lesson.findFirst({
        where: {
          videoUrl: normalizedUrl,
          deletedAt: null,
        },
      });
      if (existing) {
        return res.status(409).json({ error: 'Já existe uma aula com esta URL de vídeo.' });
      }
    }

    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        categoryId: categoryId || null,
        title,
        content,
        videoUrl: normalizedUrl,
        orderIndex: orderIndex ?? 0,
        published: published ?? false,
      },
    });

    return res.status(201).json({ message: 'Aula criada com sucesso', lesson });
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// PUT /api/lessons/:id — Atualizar aula (Admin/Teacher)
// ============================================================================
export const updateLesson = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, content, videoUrl, published, orderIndex, moduleId, categoryId } = req.body;

    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    if (existing.deletedAt) {
      return res.status(400).json({ error: 'Não é possível editar uma aula excluída. Restaure-a primeiro.' });
    }

    // Se está mudando de módulo, verificar se o novo módulo existe
    if (moduleId && moduleId !== existing.moduleId) {
      const moduleExists = await prisma.module.findUnique({ where: { id: moduleId } });
      if (!moduleExists) {
        return res.status(404).json({ error: 'Módulo não encontrado.' });
      }
    }

    // Normalizar e verificar duplicata por videoUrl (se mudou)
    const normalizedUrl = videoUrl ? normalizeYouTubeUrl(videoUrl) : videoUrl;
    if (normalizedUrl && normalizedUrl !== existing.videoUrl) {
      const duplicate = await prisma.lesson.findFirst({
        where: {
          videoUrl: normalizedUrl,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (duplicate) {
        return res.status(409).json({ error: 'Já existe outra aula com esta URL de vídeo.' });
      }
    }

    const updated = await prisma.lesson.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(normalizedUrl !== undefined && { videoUrl: normalizedUrl }),
        ...(published !== undefined && { published }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(moduleId !== undefined && { moduleId }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
      },
    });

    return res.status(200).json({ message: 'Aula atualizada com sucesso', lesson: updated });
  } catch (error) {
    console.error('Erro ao atualizar aula:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// DELETE /api/lessons/:id — Soft delete (Admin)
// Marca deletedAt em vez de deletar permanentemente
// ============================================================================
export const deleteLesson = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    if (existing.deletedAt) {
      return res.status(400).json({ error: 'Aula já está excluída.' });
    }

    await prisma.lesson.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return res.status(200).json({ message: 'Aula excluída (exclusão lógica). Pode ser restaurada.' });
  } catch (error) {
    console.error('Erro ao excluir aula:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// PUT /api/lessons/:id/restore — Restaurar aula excluída (Admin)
// ============================================================================
export const restoreLesson = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    if (!existing.deletedAt) {
      return res.status(400).json({ error: 'Aula não está excluída.' });
    }

    await prisma.lesson.update({
      where: { id },
      data: { deletedAt: null },
    });

    return res.status(200).json({ message: 'Aula restaurada com sucesso.' });
  } catch (error) {
    console.error('Erro ao restaurar aula:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// DELETE /api/lessons/:id/hard — Exclusão definitiva (Admin)
// Só funciona em aulas já soft-deletadas
// ============================================================================
export const hardDeleteLesson = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    if (!existing.deletedAt) {
      return res.status(400).json({ error: 'Exclusão definitiva só é permitida para aulas já excluídas logicamente.' });
    }

    // Cascade: apagar attachments e progresso vinculados
    await prisma.$transaction([
      prisma.attachment.deleteMany({ where: { lessonId: id } }),
      prisma.userProgress.deleteMany({ where: { lessonId: id } }),
      prisma.lesson.delete({ where: { id } }),
    ]);

    return res.status(200).json({ message: 'Aula excluída definitivamente.' });
  } catch (error) {
    console.error('Erro ao excluir aula definitivamente:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// PUT /api/lessons/reorder/:moduleId — Reordenar aulas de um módulo (Admin)
// ============================================================================
export const reorderLessons = async (req: AuthRequest, res: Response) => {
  try {
    const moduleId = req.params.moduleId as string;
    const { order } = req.body; // [{ id: 'uuid', orderIndex: 1 }, ...]

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Formato inválido. Envie um array de ordem.' });
    }

    // Verificar que todas as aulas pertencem ao módulo
    const lessonIds = order.map((item: { id: string }) => item.id);
    const lessons = await prisma.lesson.findMany({
      where: { id: { in: lessonIds }, moduleId },
      select: { id: true },
    });

    if (lessons.length !== lessonIds.length) {
      return res.status(400).json({ error: 'Uma ou mais aulas não pertencem ao módulo informado.' });
    }

    await prisma.$transaction(
      order.map((item: { id: string; orderIndex: number }) =>
        prisma.lesson.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    return res.status(200).json({ message: 'Aulas reordenadas com sucesso.' });
  } catch (error) {
    console.error('Erro ao reordenar aulas:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
