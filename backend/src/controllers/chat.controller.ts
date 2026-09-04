import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getIO, leaveUserRooms } from '../socket';
import { areFriends, isPrivateRoomBlocked } from '../lib/friendship';
import { MediaType } from '../generated/prisma/enums';

// ============================================================================
// Helper: detectar MediaType de chat
// ============================================================================
function getChatMediaType(mimetype: string): MediaType | null {
  if (mimetype === 'application/pdf' || mimetype === 'text/plain') return 'PDF';
  if (mimetype.startsWith('audio/')) return 'AUDIO';
  if (mimetype.startsWith('image/')) return 'IMAGE';
  return null;
}

// ============================================================================
// POST /api/chat/rooms/private — Criar ou retornar sala privada existente
// ============================================================================
export const createPrivateRoom = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId é obrigatório.' });
    }

    if (targetUserId === userId) {
      return res.status(400).json({ error: 'Não é possível criar uma sala consigo mesmo.' });
    }

    // Verificar se o usuário-alvo existe e não está banido
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    if (targetUser.isBanned) {
      return res.status(403).json({ error: 'Este usuário está banido.' });
    }

    // Conversa privada SOMENTE entre amigos (comunidade privada)
    if (!(await areFriends(userId, targetUserId))) {
      return res.status(403).json({
        error: 'Converse apenas com amigos. Adicione a pessoa aos seus amigos primeiro.',
      });
    }

    // Verificar se já existe sala privada entre os dois
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        type: 'PRIVATE',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (existingRoom) {
      return res.status(200).json(existingRoom);
    }

    // Criar nova sala privada
    const newRoom = await prisma.chatRoom.create({
      data: {
        type: 'PRIVATE',
        members: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return res.status(201).json(newRoom);
  } catch (error) {
    console.error('Erro ao criar sala privada:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// POST /api/chat/rooms/group — Criar sala de grupo
// ============================================================================
export const createGroupRoom = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome do grupo é obrigatório.' });
    }

    // Somente usuários EXPLICITAMENTE selecionados entram no grupo
    // (o criador é incluído automaticamente). Nada de listas públicas.
    const requested: string[] = Array.isArray(memberIds) ? memberIds : [];
    const uniqueIds = Array.from(
      new Set(requested.filter((id: string) => typeof id === 'string' && id && id !== userId))
    );

    if (uniqueIds.length === 0) {
      return res.status(400).json({ error: 'Adicione ao menos uma pessoa ao grupo.' });
    }

    // Validar que todos os selecionados existem e não estão banidos
    const validUsers = await prisma.user.findMany({
      where: { id: { in: uniqueIds }, isBanned: false },
      select: { id: true },
    });
    const validIds = validUsers.map((u) => u.id);

    if (validIds.length !== uniqueIds.length) {
      return res.status(400).json({
        error: 'Um ou mais membros selecionados não existem ou estão banidos.',
      });
    }

    // Grupos só podem conter AMIGOS do criador (selecionados explicitamente)
    const friendRows = await prisma.friendship.findMany({
      where: { userId, friendId: { in: validIds } },
      select: { friendId: true },
    });
    const friendIdSet = new Set(friendRows.map((r) => r.friendId));
    const notFriends = validIds.filter((id) => !friendIdSet.has(id));
    if (notFriends.length > 0) {
      return res.status(403).json({
        error: 'Somente amigos podem ser adicionados ao grupo. Adicione-os aos seus amigos primeiro.',
      });
    }

    const allMemberIds = [userId, ...validIds];

    const newRoom = await prisma.chatRoom.create({
      data: {
        type: 'GROUP',
        name,
        members: {
          create: allMemberIds.map((id: string) => ({ userId: id })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return res.status(201).json(newRoom);
  } catch (error) {
    console.error('Erro ao criar sala de grupo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/chat/rooms — Listar salas do usuário com última mensagem
// ============================================================================
export const getMyRooms = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const rooms = await prisma.chatRoom.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            mediaType: true,
            createdAt: true,
            sender: {
              select: { id: true, username: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Formatar resposta (com indicador de não lidas)
    const formattedRooms = rooms.map((room: any) => {
      const ownMembership = room.members.find((m: any) => m.userId === userId);
      const last = room.messages[0] || null;
      const unread = !!(
        last &&
        ownMembership &&
        last.sender.id !== userId &&
        (!ownMembership.lastReadAt || new Date(ownMembership.lastReadAt) < new Date(last.createdAt))
      );
      return {
        ...room,
        lastMessage: last,
        unread,
        messages: undefined, // Remover array completo
      };
    });

    return res.status(200).json(formattedRooms);
  } catch (error) {
    console.error('Erro ao buscar salas:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// GET /api/chat/rooms/:roomId/messages — Histórico paginado
// ============================================================================
export const getRoomMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const roomId = req.params.roomId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Verificar se o usuário é membro da sala
    const membership = await prisma.roomMember.findUnique({
      where: { userId_chatRoomId: { userId, chatRoomId: roomId } },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Você não é membro desta sala.' });
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { chatRoomId: roomId },
        include: {
          sender: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { chatRoomId: roomId } }),
    ]);

    return res.status(200).json({
      messages: messages.reverse(), // Ordem cronológica
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// POST /api/chat/rooms/:roomId/messages — Enviar mensagem (com persistência)
// ============================================================================
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const roomId = req.params.roomId as string;
    const { content } = req.body;
    const file = req.file;

    // Verificar se o usuário é membro da sala (e pegar tipo + membros p/ bloqueio)
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { type: true, members: { select: { userId: true } } },
    });

    if (!room || !room.members.some((m) => m.userId === userId)) {
      return res.status(403).json({ error: 'Você não é membro desta sala.' });
    }

    // Sala privada com bloqueio (qualquer direção) → mensagem bloqueada
    if (await isPrivateRoomBlocked(userId, room)) {
      return res.status(403).json({ error: 'Você não pode enviar mensagens para este usuário.' });
    }

    if (!content && !file) {
      return res.status(400).json({ error: 'Envie um conteúdo de texto ou um arquivo.' });
    }

    const messageData: any = {
      chatRoomId: roomId,
      senderId: userId,
      content: content || null,
    };

    if (file) {
      messageData.mediaUrl = `/uploads/chat/${file.filename}`;
      messageData.mediaType = getChatMediaType(file.mimetype);
    }

    const message = await prisma.message.create({
      data: messageData,
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    // Broadcast em tempo real para todos os membros conectados da sala
    const io = getIO();
    if (io) {
      io.to(roomId).emit('receive_message', message);
    }

    return res.status(201).json(message);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// POST /api/chat/rooms/:roomId/read — Marcar sala como lida (não lidas)
// ============================================================================
export const markRoomRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const roomId = req.params.roomId as string;

    const membership = await prisma.roomMember.findUnique({
      where: { userId_chatRoomId: { userId, chatRoomId: roomId } },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Você não é membro desta sala.' });
    }

    await prisma.roomMember.update({
      where: { userId_chatRoomId: { userId, chatRoomId: roomId } },
      data: { lastReadAt: new Date() },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Erro ao marcar sala como lida:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// POST /api/chat/rooms/:roomId/leave — Sair de um grupo
// ============================================================================
export const leaveGroupRoom = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const roomId = req.params.roomId as string;

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { id: true, type: true, members: { select: { userId: true } } },
    });

    if (!room) {
      return res.status(404).json({ error: 'Sala não encontrada.' });
    }
    if (room.type !== 'GROUP') {
      return res.status(400).json({ error: 'Só é possível sair de grupos.' });
    }
    if (!room.members.some((m) => m.userId === userId)) {
      return res.status(403).json({ error: 'Você não é membro desta sala.' });
    }

    // Remover a associação do usuário
    await prisma.roomMember.delete({
      where: { userId_chatRoomId: { userId, chatRoomId: roomId } },
    });

    const remainingMemberIds = room.members
      .filter((m) => m.userId !== userId)
      .map((m) => m.userId);

    // Grupo sem ninguém → remove mensagens e a sala (sem órfãos)
    if (remainingMemberIds.length === 0) {
      await prisma.message.deleteMany({ where: { chatRoomId: roomId } });
      await prisma.chatRoom.delete({ where: { id: roomId } });
    } else {
      // Avisa quem ficou (atualiza participantes em tempo real)
      const io = getIO();
      if (io) {
        io.to(roomId).emit('member_left', { roomId, userId, memberIds: remainingMemberIds });
      }
    }

    // Remove TODOS os sockets do usuário da sala (inclusive outras abas)
    leaveUserRooms(userId, roomId);

    return res.status(200).json({
      message: 'Você saiu do grupo.',
      roomId,
    });
  } catch (error) {
    console.error('Erro ao sair do grupo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
