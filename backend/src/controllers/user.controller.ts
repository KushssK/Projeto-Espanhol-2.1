import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// ============================================================================
// GET /api/users/me — Perfil do usuário autenticado
// ============================================================================
export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        dob: true,
        isBanned: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// PUT /api/users/me — Atualizar próprio perfil (apenas username e avatar)
// ============================================================================
export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { username } = req.body;
    const file = req.file; // Avatar upload

    // Verificar unicidade do username se fornecido
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: { username, NOT: { id: userId } },
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Este username já está em uso.' });
      }
    }

    const updateData: Record<string, any> = {};
    if (username !== undefined) updateData.username = username;
    if (file) updateData.avatarUrl = `/uploads/avatars/${file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
      },
    });

    return res.status(200).json({ message: 'Perfil atualizado com sucesso', user: updatedUser });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/users/search?q=term — Buscar usuários por username ou email
// ============================================================================
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'A busca deve ter pelo menos 2 caracteres.' });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { email: { contains: query } },
        ],
        isBanned: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
      },
      take: 20,
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// PUT /api/users/:userId/ban — Banir usuário (Admin)
// ============================================================================
export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Não permitir banir outros admins
    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Não é possível banir um administrador.' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: true },
    });

    return res.status(200).json({ message: 'Usuário banido com sucesso.' });
  } catch (error) {
    console.error('Erro ao banir usuário:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// PUT /api/users/:userId/unban — Desbanir usuário (Admin)
// ============================================================================
export const unbanUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: false },
    });

    return res.status(200).json({ message: 'Usuário desbanido com sucesso.' });
  } catch (error) {
    console.error('Erro ao desbanir usuário:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/users — Listar todos os usuários com paginação (Admin)
// ============================================================================
export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          avatarUrl: true,
          isBanned: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/users/:userId/progress — Admin: ver progresso de um aluno
// ============================================================================
export const getUserProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const progress = await prisma.userProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            module: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    const totalXP = progress.reduce((acc: number, p: any) => acc + p.score, 0);

    return res.status(200).json({ user, totalXP, progress });
  } catch (error) {
    console.error('Erro ao buscar progresso do usuário:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
