import { Response } from 'express';
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
// GET /api/users/search?q=term — Busca EXPLÍCITA de usuários (privacidade)
//
// Regras de privacidade:
//  - NUNCA retorna a lista completa de usuários: exige uma query (mín. 2 chars);
//  - o e-mail é usado apenas como critério de busca (username OU e-mail),
//    mas NÃO é devolvido na resposta — ninguém vê e-mails em listas públicas;
//  - limite de resultados (take 10) + rate limit na rota.
// ============================================================================
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    // Sem busca explícita → nenhum usuário é retornado (sem listagem pública).
    if (query.length < 2) {
      return res.status(200).json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        isBanned: false,
        id: { not: currentUserId },
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        // email deliberadamente NÃO é selecionado (privacidade)
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const candidateIds = users.map((u) => u.id);

    // Quais candidatos já são amigos do usuário autenticado?
    const friendRows = await prisma.friendship.findMany({
      where: { userId: currentUserId, friendId: { in: candidateIds } },
      select: { friendId: true },
    });
    const friendIds = new Set(friendRows.map((r) => r.friendId));

    // Bloqueados nas DUAS direções somem da busca (invisibilidade mútua)
    const blockRows = await prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: currentUserId, blockedId: { in: candidateIds } },
          { blockerId: { in: candidateIds }, blockedId: currentUserId },
        ],
      },
      select: { blockerId: true, blockedId: true },
    });
    const blockedPartnerIds = new Set<string>();
    for (const row of blockRows) {
      blockedPartnerIds.add(row.blockerId === currentUserId ? row.blockedId : row.blockerId);
    }

    const results = users
      .filter((u) => !blockedPartnerIds.has(u.id))
      .map((u) => ({ ...u, isFriend: friendIds.has(u.id) }));

    return res.status(200).json(results);
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

