"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = exports.getIO = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("./lib/prisma");
// Instância do Socket.IO para uso em controllers (broadcast de mensagens REST)
let ioInstance = null;
const getIO = () => ioInstance;
exports.getIO = getIO;
// ============================================================================
// Setup do Socket.IO com persistência
// ============================================================================
const setupSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
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
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
            if (err)
                return next(new Error('Token inválido ou expirado.'));
            socket.data.user = decoded;
            next();
        });
    });
    // --------------------------------------------------------------------------
    // Conexão
    // --------------------------------------------------------------------------
    io.on('connection', (socket) => {
        const user = socket.data.user;
        console.log(`[Socket] Conectado: ${user.userId} (${socket.id})`);
        // Entrar em uma sala
        socket.on('join_room', async (roomId) => {
            try {
                // Verificar se o usuário é membro da sala
                const membership = await prisma_1.prisma.roomMember.findUnique({
                    where: { userId_chatRoomId: { userId: user.userId, chatRoomId: roomId } },
                });
                if (!membership) {
                    socket.emit('error', { message: 'Você não é membro desta sala.' });
                    return;
                }
                socket.join(roomId);
                console.log(`[Socket] ${user.userId} entrou na sala ${roomId}`);
            }
            catch (error) {
                console.error('[Socket] Erro ao entrar na sala:', error);
                socket.emit('error', { message: 'Erro ao entrar na sala.' });
            }
        });
        // Sair de uma sala
        socket.on('leave_room', (roomId) => {
            socket.leave(roomId);
            console.log(`[Socket] ${user.userId} saiu da sala ${roomId}`);
        });
        // Enviar mensagem — COM PERSISTÊNCIA no banco
        socket.on('send_message', async (data) => {
            try {
                // Verificar se o usuário é membro da sala
                const membership = await prisma_1.prisma.roomMember.findUnique({
                    where: { userId_chatRoomId: { userId: user.userId, chatRoomId: data.roomId } },
                });
                if (!membership) {
                    socket.emit('error', { message: 'Você não é membro desta sala.' });
                    return;
                }
                // Persistir mensagem no banco de dados
                const message = await prisma_1.prisma.message.create({
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
            }
            catch (error) {
                console.error('[Socket] Erro ao enviar mensagem:', error);
                socket.emit('error', { message: 'Erro ao enviar mensagem.' });
            }
        });
        // Indicador de digitação
        socket.on('typing', (data) => {
            socket.to(data.roomId).emit('user_typing', {
                userId: user.userId,
                roomId: data.roomId,
            });
        });
        // Parou de digitar
        socket.on('stop_typing', (data) => {
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
exports.setupSocket = setupSocket;
//# sourceMappingURL=socket.js.map