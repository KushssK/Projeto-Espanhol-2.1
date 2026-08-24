import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getCategoriesByModule = async (req: Request, res: Response) => {
  try {
    const moduleId = req.params.moduleId as string;

    const categories = await prisma.category.findMany({
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
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { moduleId, title, description, orderIndex } = req.body;

    if (!moduleId || !title) {
      return res.status(400).json({ error: 'moduleId e title são obrigatórios.' });
    }

    const category = await prisma.category.create({
      data: { moduleId, title, description, orderIndex: orderIndex ?? 0 },
    });

    return res.status(201).json({ message: 'Categoria criada', category });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, description } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      },
    });

    return res.status(200).json({ message: 'Categoria atualizada', category });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }
    console.error('Erro ao atualizar categoria:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const withLessons = await prisma.category.findUnique({
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

    await prisma.category.delete({ where: { id } });
    return res.status(200).json({ message: 'Categoria excluída.' });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const reorderCategories = async (req: AuthRequest, res: Response) => {
  try {
    const moduleId = req.params.moduleId as string;
    const { order } = req.body as { order: { id: string; orderIndex: number }[] };

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Envie order: [{ id, orderIndex }].' });
    }

    await prisma.$transaction(
      order.map((item) =>
        prisma.category.updateMany({
          where: { id: item.id, moduleId },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    return res.status(200).json({ message: 'Categorias reordenadas.' });
  } catch (error) {
    console.error('Erro ao reordenar categorias:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
