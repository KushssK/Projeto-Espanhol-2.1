import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from './lib/prisma';
import { corsOriginCallback } from './lib/cors-origins';
import { isPrivateRoomBlocked } from './lib/friendship';

// ============================================================================
// Tipos
// ============================================================================
interface SocketUser {
  userId: string;
  role: string;
}

interface SendMessagePayload {
  roomId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'PDF' | 'AUDIO' | 'IMAGE';
}

// Instância do Socket.IO para uso em controllers (broadcast de mensagens REST)
let ioInstance: SocketIOServer | null = null;

// Registro userId → socketIds, para remover sockets de salas quando o usuário
// sai de um grupo (o socket de OUTRA aba não deve continuar recebendo).
const userSockets = new Map<string, Set<string>>();

export const getIO = () => ioInstance;

/**
 * Emite um evento para TODOS os sockets de um usuário (sala pessoal user:{id}).
 * Usado p/ eventos de amigos/bloqueio em tempo real (sem expor dados de outros).
 */
export const emitToUser = (userId: string, event: string, payload?: unknown) => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

/** Remove TODOS os sockets de um usuário de uma sala (ex.: saiu do grupo). */
export const leaveUserRooms = (userId: string, roomId: string) => {
  if (!ioInstance) return;
  const socketIds = userSockets.get(userId);
  if (!socketIds) return;
  for (const socketId of socketIds) {
    ioInstance.sockets.sockets.get(socketId)?.leave(roomId);
  }
};

// ============================================================================
// Setup do Socket.IO com persistência
// ============================================================================
export const setupSocket = (server: HttpServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: corsOriginCallback,
      methods: ['GET', 'POST'],
    },
    maxHttpBufferSize: 20 * 1024 * 1024, // 20MB — compatível com o limite de upload
  });
  ioInstance = io;

  // --------------------------------------------------------------------------
  // Middleware de Autenticação
  // --------------------------------------------------------------------------
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Acesso negado. Token não fornecido.'));
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, decoded: any) => {
      if (err) return next(new Error('Token inválido ou expirado.'));
      socket.data.user = decoded as SocketUser;
      next();
    });
  });

  // --------------------------------------------------------------------------
  // Conexão
  // --------------------------------------------------------------------------
  io.on('connection', async (socket) => {
    const user: SocketUser = socket.data.user;
    console.log(`[Socket] Conectado: ${user.userId} (${socket.id})`);

    // Registrar o socket do usuário (p/ remoção forçada de salas ao sair de grupo)
    if (!userSockets.has(user.userId)) userSockets.set(user.userId, new Set());
    userSockets.get(user.userId)!.add(socket.id);

    // Sala pessoal — eventos de amigos/bloqueio chegam em tempo real
    socket.join(`user:${user.userId}`);

    // Entrar automaticamente em TODAS as salas das quais o usuário é membro.
    // Assim o realtime funciona mesmo sem abrir a conversa na interface e
    // sobrevive a reconexões: cada nova conexão recria os rooms (o socket novo
    // não herda os rooms do socket anterior). join_room/leave_room continuam
    // suportados como reforço.
    try {
      const memberships = await prisma.roomMember.findMany({
        where: { userId: user.userId },
        select: { chatRoomId: true },
      });
      for (const membership of memberships) {
        socket.join(membership.chatRoomId);
      }
    } catch (error) {
      console.error('[Socket] Erro ao entrar nas salas do usuário:', error);
    }

    // Entrar em uma sala
    socket.on('join_room', async (roomId: string) => {
      try {
        // Verificar se o usuário é membro da sala
        const membership = await prisma.roomMember.findUnique({
          where: { userId_chatRoomId: { userId: user.userId, chatRoomId: roomId } },
        });

        if (!membership) {
          socket.emit('error', { message: 'Você não é membro desta sala.' });
          return;
        }

        socket.join(roomId);
        console.log(`[Socket] ${user.userId} entrou na sala ${roomId}`);
      } catch (error) {
        console.error('[Socket] Erro ao entrar na sala:', error);
        socket.emit('error', { message: 'Erro ao entrar na sala.' });
      }
    });

    // Sair de uma sala
    socket.on('leave_room', (roomId: string) => {
      socket.leave(roomId);
      console.log(`[Socket] ${user.userId} saiu da sala ${roomId}`);
    });

    // Enviar mensagem — COM PERSISTÊNCIA no banco
    socket.on('send_message', async (data: SendMessagePayload) => {
      try {
        // Verificar se o usuário é membro da sala (e pegar tipo + membros)
        const room = await prisma.chatRoom.findUnique({
          where: { id: data.roomId },
          select: { type: true, members: { select: { userId: true } } },
        });

        if (!room || !room.members.some((m) => m.userId === user.userId)) {
          socket.emit('error', { message: 'Você não é membro desta sala.' });
          return;
        }

        // Sala privada com bloqueio (qualquer direção) → mensagem bloqueada
        if (await isPrivateRoomBlocked(user.userId, room)) {
          socket.emit('error', { message: 'Você não pode enviar mensagens para este usuário.' });
          return;
        }

        // Persistir mensagem no banco de dados
        const message = await prisma.message.create({
          data: {
            chatRoomId: data.roomId,
            senderId: user.userId,
            content: data.content || null,
            mediaUrl: data.mediaUrl || null,
            mediaType: data.mediaType || null,
          },
          include: {
            sender: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        });

        // Emitir para todos na sala (incluindo o remetente)
        io.to(data.roomId).emit('receive_message', message);
      } catch (error) {
        console.error('[Socket] Erro ao enviar mensagem:', error);
        socket.emit('error', { message: 'Erro ao enviar mensagem.' });
      }
    });

    // Indicador de digitação
    socket.on('typing', async (data: { roomId: string }) => {
      const room = await prisma.chatRoom.findUnique({
        where: { id: data.roomId },
        select: { type: true, members: { select: { userId: true } } },
      });
      if (!room || !room.members.some((m) => m.userId === user.userId)) return;
      // Não vaza "digitando..." de conversas privadas bloqueadas
      if (await isPrivateRoomBlocked(user.userId, room)) return;
      socket.to(data.roomId).emit('user_typing', {
        userId: user.userId,
        roomId: data.roomId,
      });
    });

    // Parou de digitar
    socket.on('stop_typing', async (data: { roomId: string }) => {
      const room = await prisma.chatRoom.findUnique({
        where: { id: data.roomId },
        select: { type: true, members: { select: { userId: true } } },
      });
      if (!room || !room.members.some((m) => m.userId === user.userId)) return;
      if (await isPrivateRoomBlocked(user.userId, room)) return;
      socket.to(data.roomId).emit('user_stop_typing', {
        userId: user.userId,
        roomId: data.roomId,
      });
    });

    // Desconexão
    socket.on('disconnect', () => {
      const set = userSockets.get(user.userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(user.userId);
      }
      console.log(`[Socket] Desconectado: ${user.userId}`);
    });
  });

  return io;
};
