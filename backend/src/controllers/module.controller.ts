import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// ============================================================================
// GET /api/modules — Listar todos os módulos (público)
// ============================================================================
export const getModules = async (req: Request, res: Response) => {
  try {
    const modules = await prisma.module.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            orderIndex: true,
            published: true,
            videoUrl: true,
          },
        },
      },
    });
    return res.status(200).json(modules);
  } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/modules/:id — Buscar módulo por ID
// ============================================================================
export const getModuleById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const module = await prisma.module.findUnique({
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
  } catch (error) {
    console.error('Erro ao buscar módulo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// POST /api/modules — Criar módulo (Admin)
// ============================================================================
export const createModule = async (req: Request, res: Response) => {
  try {
    const { title, description, orderIndex } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'O título do módulo é obrigatório.' });
    }

    const newModule = await prisma.module.create({
      data: {
        title,
        description,
        orderIndex: orderIndex || 0,
      },
    });

    return res.status(201).json({ message: 'Módulo criado com sucesso', module: newModule });
  } catch (error) {
    console.error('Erro ao criar módulo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// PUT /api/modules/:id — Atualizar módulo (Admin)
// ============================================================================
export const updateModule = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, description } = req.body;

    const existing = await prisma.module.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Módulo não encontrado.' });
    }

    const updated = await prisma.module.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      },
    });

    return res.status(200).json({ message: 'Módulo atualizado com sucesso', module: updated });
  } catch (error) {
    console.error('Erro ao atualizar módulo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// DELETE /api/modules/:id — Deletar módulo (Admin)
// ============================================================================
export const deleteModule = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.module.findUnique({
      where: { id },
      include: { lessons: { select: { id: true } } },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Módulo não encontrado.' });
    }

    if ((existing as any).lessons.length > 0) {
      return res.status(400).json({
        error: 'Não é possível excluir um módulo que contém aulas. Remova as aulas primeiro.',
      });
    }

    await prisma.module.delete({ where: { id } });

    return res.status(200).json({ message: 'Módulo excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir módulo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// PUT /api/modules/reorder — Reordenar módulos (Admin)
// ============================================================================
export const reorderModules = async (req: Request, res: Response) => {
  try {
    const { order } = req.body; // [{ id: 'uuid', orderIndex: 1 }, ...]

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Formato inválido. Envie um array de ordem.' });
    }

    await prisma.$transaction(
      order.map((item: { id: string; orderIndex: number }) =>
        prisma.module.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    return res.status(200).json({ message: 'Módulos reordenados com sucesso.' });
  } catch (error) {
    console.error('Erro ao reordenar módulos:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
