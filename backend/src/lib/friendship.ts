import { prisma } from './prisma';

// ============================================================================
// Helpers do sistema de amizade/bloqueio (usados por controllers e socket)
// ============================================================================

/** A e B são amigos? A amizade é bidirecional e espelhada (A→B e B→A). */
export const areFriends = async (userId: string, otherUserId: string): Promise<boolean> => {
  const row = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId, friendId: otherUserId } },
    select: { id: true },
  });
  return !!row;
};

/** Existe bloqueio em qualquer direção entre A e B? */
export const isBlockedEitherDirection = async (a: string, b: string): Promise<boolean> => {
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
    select: { blockerId: true },
  });
  return !!block;
};

/**
 * Em uma sala PRIVADA, alguém está bloqueado (qualquer direção)?
 * Retorna true quando o par de membros da sala tem um bloqueio — nesse caso
 * mensagens de texto/typing não devem trafegar.
 */
export const isPrivateRoomBlocked = async (
  userId: string,
  room: { type: string; members: { userId: string }[] }
): Promise<boolean> => {
  if (room.type !== 'PRIVATE') return false;
  const other = room.members.find((m) => m.userId !== userId);
  if (!other) return false;
  return isBlockedEitherDirection(userId, other.userId);
};
