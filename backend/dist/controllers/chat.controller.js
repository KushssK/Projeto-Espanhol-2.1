"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getRoomMessages = exports.getMyRooms = exports.createGroupRoom = exports.createPrivateRoom = void 0;
const prisma_1 = require("../lib/prisma");
const socket_1 = require("../socket");
// ============================================================================
// Helper: detectar MediaType de chat
// ============================================================================
function getChatMediaType(mimetype) {
    if (mimetype === 'application/pdf' || mimetype === 'text/plain')
        return 'PDF';
    if (mimetype.startsWith('audio/'))
        return 'AUDIO';
    if (mimetype.startsWith('image/'))
        return 'IMAGE';
    return null;
}
// ============================================================================
// POST /api/chat/rooms/private — Criar ou retornar sala privada existente
// ============================================================================
const createPrivateRoom = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { targetUserId } = req.body;
        if (!targetUserId) {
            return res.status(400).json({ error: 'targetUserId é obrigatório.' });
        }
        if (targetUserId === userId) {
            return res.status(400).json({ error: 'Não é possível criar uma sala consigo mesmo.' });
        }
        // Verificar se o usuário-alvo existe e não está banido
        const targetUser = await prisma_1.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        if (targetUser.isBanned) {
            return res.status(403).json({ error: 'Este usuário está banido.' });
        }
        // Verificar se já existe sala privada entre os dois
        const existingRoom = await prisma_1.prisma.chatRoom.findFirst({
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
        const newRoom = await prisma_1.prisma.chatRoom.create({
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
    }
    catch (error) {
        console.error('Erro ao criar sala privada:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.createPrivateRoom = createPrivateRoom;
// ============================================================================
// POST /api/chat/rooms/group — Criar sala de grupo
// ============================================================================
const createGroupRoom = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, memberIds } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Nome do grupo é obrigatório.' });
        }
        // Incluir o criador automaticamente
        const allMemberIds = Array.from(new Set([userId, ...(memberIds || [])]));
        const newRoom = await prisma_1.prisma.chatRoom.create({
            data: {
                type: 'GROUP',
                name,
                members: {
                    create: allMemberIds.map((id) => ({ userId: id })),
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
    }
    catch (error) {
        console.error('Erro ao criar sala de grupo:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.createGroupRoom = createGroupRoom;
// ============================================================================
// GET /api/chat/rooms — Listar salas do usuário com última mensagem
// ============================================================================
const getMyRooms = async (req, res) => {
    try {
        const userId = req.user.userId;
        const rooms = await prisma_1.prisma.chatRoom.findMany({
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
        // Formatar resposta
        const formattedRooms = rooms.map((room) => ({
            ...room,
            lastMessage: room.messages[0] || null,
            messages: undefined, // Remover array completo
        }));
        return res.status(200).json(formattedRooms);
    }
    catch (error) {
        console.error('Erro ao buscar salas:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.getMyRooms = getMyRooms;
// ============================================================================
// GET /api/chat/rooms/:roomId/messages — Histórico paginado
// ============================================================================
const getRoomMessages = async (req, res) => {
    try {
        const userId = req.user.userId;
        const roomId = req.params.roomId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        // Verificar se o usuário é membro da sala
        const membership = await prisma_1.prisma.roomMember.findUnique({
            where: { userId_chatRoomId: { userId, chatRoomId: roomId } },
        });
        if (!membership) {
            return res.status(403).json({ error: 'Você não é membro desta sala.' });
        }
        const [messages, total] = await Promise.all([
            prisma_1.prisma.message.findMany({
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
            prisma_1.prisma.message.count({ where: { chatRoomId: roomId } }),
        ]);
        return res.status(200).json({
            messages: messages.reverse(), // Ordem cronológica
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.getRoomMessages = getRoomMessages;
// ============================================================================
// POST /api/chat/rooms/:roomId/messages — Enviar mensagem (com persistência)
// ============================================================================
const sendMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const roomId = req.params.roomId;
        const { content } = req.body;
        const file = req.file;
        // Verificar se o usuário é membro da sala
        const membership = await prisma_1.prisma.roomMember.findUnique({
            where: { userId_chatRoomId: { userId, chatRoomId: roomId } },
        });
        if (!membership) {
            return res.status(403).json({ error: 'Você não é membro desta sala.' });
        }
        if (!content && !file) {
            return res.status(400).json({ error: 'Envie um conteúdo de texto ou um arquivo.' });
        }
        const messageData = {
            chatRoomId: roomId,
            senderId: userId,
            content: content || null,
        };
        if (file) {
            messageData.mediaUrl = `/uploads/chat/${file.filename}`;
            messageData.mediaType = getChatMediaType(file.mimetype);
        }
        const message = await prisma_1.prisma.message.create({
            data: messageData,
            include: {
                sender: {
                    select: { id: true, username: true, avatarUrl: true },
                },
            },
        });
        // Broadcast em tempo real para todos os membros conectados da sala
        const io = (0, socket_1.getIO)();
        if (io) {
            io.to(roomId).emit('receive_message', message);
        }
        return res.status(201).json(message);
    }
    catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.sendMessage = sendMessage;
//# sourceMappingURL=chat.controller.js.map