import { Router } from 'express';
import {
  addFriend,
  listFriends,
  removeFriend,
  blockUser,
  unblockUser,
  listBlocks,
} from '../controllers/friend.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas de amigos exigem autenticação
router.use(authenticateToken);

router.get('/', listFriends);
router.post('/', addFriend);
router.delete('/:friendId', removeFriend);

// Bloqueios
router.get('/blocks', listBlocks);
router.post('/:userId/block', blockUser);
router.post('/:userId/unblock', unblockUser);

export default router;
