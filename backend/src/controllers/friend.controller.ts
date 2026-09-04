import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { emitToUser } from '../socket';

// ============================================================================
// Helpers
// ============================================================================

// Campos públicos de um usuário (NUNCA e-mail — privacidade)
const userPublicSelect = {
  id: true,
  username: true,
  avatarUrl: true,
  role: true,
} as const;

// Notifica a pessoa afetada para recarregar a lista de amigos em tempo real
const notifyFriendsChanged = (userId: string) => {
  emitToUser(userId, 'friends_updated', {});
};
const notifyBlocksChanged = (userId: string) => {
  emitToUser(userId, 'blocks_updated', {});
};

// ============================================================================
// POST /api/friends — Adicionar amigo ({ targetUserId })
// ============================================================================
export const addFriend = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { targetUserId } = req.body;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return res.status(400).json({ error: 'targetUserId é obrigatório.' });
    }
    if (targetUserId === userId) {
      return res.status(400).json({ error: 'Você não pode adicionar a si mesmo.' });
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true, avatarUrl: true, role: true, isBanned: true },
    });
    if (!target) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    if (target.isBanned) {
      return res.status(403).json({ error: 'Este usuário está banido.' });
    }

    // Já são amigos? (verifica as duas direções — amizade é espelhada)
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: targetUserId },
          { userId: targetUserId, friendId: userId },
        ],
      },
      select: { id: true },
    });
    if (existing) {
      return res.status(400).json({ error: 'Vocês já são amigos.' });
    }

    // Bloqueio em qualquer direção impede nova amizade
    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: userId },
        ],
      },
      select: { blockerId: true },
    });
    if (block) {
      return res.status(403).json({
        error: 'Não é possível adicionar: existe um bloqueio entre vocês.',
      });
    }

    // Amizade espelhada — 2 linhas (A→B e B→A). skipDuplicates evita duplicar
    // em corrida; a checagem acima já impede a duplicidade na prática.
    await prisma.$transaction([
      prisma.friendship.createMany({
        data: [
          { userId, friendId: targetUserId },
          { userId: targetUserId, friendId: userId },
        ],
        skipDuplicates: true,
      }),
    ]);

    // A lista de amigos dos DOIS mudou (a do alvo cresce, a do autor também)
    notifyFriendsChanged(userId);
    notifyFriendsChanged(targetUserId);

    return res.status(201).json({
      message: 'Amigo adicionado com sucesso.',
      friend: {
        id: target.id,
        username: target.username,
        avatarUrl: target.avatarUrl,
        role: target.role,
      },
    });
  } catch (error) {
    console.error('Erro ao adicionar amigo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/friends — Listar amigos do usuário autenticado
// ============================================================================
export const listFriends = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const rows = await prisma.friendship.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { friend: { select: userPublicSelect } },
    });

    const friends = rows.map((r) => ({
      id: r.friend.id,
      username: r.friend.username,
      avatarUrl: r.friend.avatarUrl,
      role: r.friend.role,
      since: r.createdAt,
    }));

    return res.status(200).json(friends);
  } catch (error) {
    console.error('Erro ao listar amigos:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// DELETE /api/friends/:friendId — Remover amigo
// ============================================================================
export const removeFriend = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const friendId = req.params.friendId as string;

    if (friendId === userId) {
      return res.status(400).json({ error: 'Operação inválida.' });
    }

    // Remove as duas linhas-espelho da amizade
    const result = await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (result.count === 0) {
      return res.status(400).json({ error: 'Vocês não são amigos.' });
    }

    // A lista de amigos dos dois mudou
    notifyFriendsChanged(userId);
    notifyFriendsChanged(friendId);

    return res.status(200).json({ message: 'Amigo removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover amigo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// POST /api/friends/:userId/block — Bloquear usuário
// ============================================================================
export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const blockerId = req.user!.userId;
    const blockedId = req.params.userId as string;

    if (blockedId === blockerId) {
      return res.status(400).json({ error: 'Você não pode bloquear a si mesmo.' });
    }

    const target = await prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true },
    });
    if (!target) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Cria o bloqueio e remove a amizade (se houver) — transação atômica
    await prisma.$transaction([
      prisma.userBlock.createMany({
        data: [{ blockerId, blockedId }],
        skipDuplicates: true,
      }),
      prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId: blockerId, friendId: blockedId },
            { userId: blockedId, friendId: blockerId },
          ],
        },
      }),
    ]);

    // Só o autor do bloqueio precisa atualizar a interface (privacidade:
    // a pessoa bloqueada não é notificada).
    notifyFriendsChanged(blockerId);
    notifyBlocksChanged(blockerId);

    return res.status(200).json({
      message: 'Usuário bloqueado. Ele não aparecerá nas buscas nem poderá enviar mensagens.',
    });
  } catch (error) {
    console.error('Erro ao bloquear usuário:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// POST /api/friends/:userId/unblock — Desbloquear usuário
// ============================================================================
export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    const blockerId = req.user!.userId;
    const blockedId = req.params.userId as string;

    await prisma.userBlock.deleteMany({
      where: { blockerId, blockedId },
    });

    notifyBlocksChanged(blockerId);

    return res.status(200).json({ message: 'Usuário desbloqueado.' });
  } catch (error) {
    console.error('Erro ao desbloquear usuário:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/friends/blocks — Listar usuários que EU bloqueei
// ============================================================================
export const listBlocks = async (req: AuthRequest, res: Response) => {
  try {
    const blockerId = req.user!.userId;

    const rows = await prisma.userBlock.findMany({
      where: { blockerId },
      orderBy: { createdAt: 'desc' },
      include: { blocked: { select: userPublicSelect } },
    });

    const blocked = rows.map((r) => ({
      id: r.blocked.id,
      username: r.blocked.username,
      avatarUrl: r.blocked.avatarUrl,
      role: r.blocked.role,
      since: r.createdAt,
    }));

    return res.status(200).json(blocked);
  } catch (error) {
    console.error('Erro ao listar bloqueados:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
