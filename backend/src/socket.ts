import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from './lib/prisma';

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

export const getIO = () => ioInstance;

// ============================================================================
// Setup do Socket.IO com persistência
// ============================================================================
export const setupSocket = (server: HttpServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || false,
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
  io.on('connection', (socket) => {
    const user: SocketUser = socket.data.user;
    console.log(`[Socket] Conectado: ${user.userId} (${socket.id})`);

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
        // Verificar se o usuário é membro da sala
        const membership = await prisma.roomMember.findUnique({
          where: { userId_chatRoomId: { userId: user.userId, chatRoomId: data.roomId } },
        });

        if (!membership) {
          socket.emit('error', { message: 'Você não é membro desta sala.' });
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
    socket.on('typing', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('user_typing', {
        userId: user.userId,
        roomId: data.roomId,
      });
    });

    // Parou de digitar
    socket.on('stop_typing', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('user_stop_typing', {
        userId: user.userId,
        roomId: data.roomId,
      });
    });

    // Desconexão
    socket.on('disconnect', () => {
      console.log(`[Socket] Desconectado: ${user.userId}`);
    });
  });

  return io;
};
