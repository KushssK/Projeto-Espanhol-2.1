import { Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Role } from '../generated/prisma/enums';

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
// GET /api/users/search?q=term — Buscar usuários ou listar membros da comunidade
// ============================================================================
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const whereClause: Record<string, any> = {
      isBanned: false,
    };

    if (currentUserId) {
      whereClause.id = { not: currentUserId };
    }

    if (query.length >= 2) {
      whereClause.OR = [
        { username: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// PUT /api/users/me/password — Alterar própria senha
// ============================================================================
export const changeMyPassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return res.status(200).json({ message: 'Senha atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
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

// ============================================================================
// PUT /api/users/:userId/role — Atualizar cargo do usuário (Admin)
// ============================================================================
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { role } = req.body as { role?: Role };

    if (!role || (role !== 'STUDENT' && role !== 'TEACHER' && role !== 'ADMIN')) {
      return res.status(400).json({ error: 'Role inválida. Escolha STUDENT, TEACHER ou ADMIN.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Proteção 1: Um administrador não pode alterar o seu próprio cargo
    if (req.user?.userId === targetUser.id) {
      return res.status(400).json({
        error: 'Operação bloqueada: você não pode alterar seu próprio nível de acesso.',
      });
    }

    // Proteção 2: Se estiver removendo ADMIN, verificar se há pelo menos 1 outro ADMIN ativo
    if (targetUser.role === 'ADMIN' && role !== 'ADMIN') {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isBanned: false },
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          error: 'Operação bloqueada: o sistema precisa manter pelo menos um administrador ativo.',
        });
      }
    }

    // Atualizar no banco
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isBanned: true,
      },
    });

    const normalizedEmail = targetUser.email.trim().toLowerCase();

    // Sincronizar com WhitelistEmail
    if (role === 'ADMIN' || role === 'TEACHER') {
      await prisma.whitelistEmail.upsert({
        where: { email: normalizedEmail },
        update: { role },
        create: { email: normalizedEmail, role },
      });
    } else {
      // Se rebaixado para STUDENT, remove da whitelist
      await prisma.whitelistEmail.deleteMany({
        where: { email: normalizedEmail },
      });
    }

    return res.status(200).json({
      message: `Cargo de ${targetUser.username || targetUser.email} atualizado para ${role} com sucesso.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erro ao atualizar cargo do usuário:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

