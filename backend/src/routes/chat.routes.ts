import { Router } from 'express';
import {
  createPrivateRoom,
  createGroupRoom,
  getMyRooms,
  getRoomMessages,
  sendMessage,
} from '../controllers/chat.controller';
import { uploadChat } from '../config/upload.config';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas de chat requerem autenticação
router.use(authenticateToken);

// Salas
router.post('/rooms/private', createPrivateRoom);
router.post('/rooms/group', createGroupRoom);
router.get('/rooms', getMyRooms);

// Mensagens
router.get('/rooms/:roomId/messages', getRoomMessages);
router.post('/rooms/:roomId/messages', uploadChat.single('file'), sendMessage);

export default router;
