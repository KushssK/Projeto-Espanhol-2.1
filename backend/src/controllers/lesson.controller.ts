import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// ============================================================================
// GET /api/lessons/module/:moduleId — Listar aulas de um módulo
// ============================================================================
export const getLessonsByModule = async (req: AuthRequest, res: Response) => {
  try {
    const moduleId = req.params.moduleId as string;

    // Admin/Teacher veem todas as aulas (inclusive rascunhos)
    // Students veem apenas aulas publicadas
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'TEACHER';

    const lessons = await prisma.lesson.findMany({
      where: {
        moduleId,
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

    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        categoryId: categoryId || null,
        title,
        content,
        videoUrl: videoUrl || null,
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

    // Se está mudando de módulo, verificar se o novo módulo existe
    if (moduleId && moduleId !== existing.moduleId) {
      const moduleExists = await prisma.module.findUnique({ where: { id: moduleId } });
      if (!moduleExists) {
        return res.status(404).json({ error: 'Módulo não encontrado.' });
      }
    }

    const updated = await prisma.lesson.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(videoUrl !== undefined && { videoUrl }),
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
// DELETE /api/lessons/:id — Deletar aula (Admin)
// ============================================================================
export const deleteLesson = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    // Cascade: apagar attachments e progresso vinculados
    await prisma.$transaction([
      prisma.attachment.deleteMany({ where: { lessonId: id } }),
      prisma.userProgress.deleteMany({ where: { lessonId: id } }),
      prisma.lesson.delete({ where: { id } }),
    ]);

    return res.status(200).json({ message: 'Aula excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir aula:', error);
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
