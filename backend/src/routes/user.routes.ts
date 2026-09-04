import { Router } from 'express';
import {
  getMyProfile,
  updateMyProfile,
  searchUsers,
  banUser,
  unbanUser,
  listUsers,
  getUserProgress,
  updateUserRole,
} from '../controllers/user.controller';
import { uploadAvatar } from '../config/upload.config';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

// Rotas autenticadas (qualquer role)
router.get('/me', authenticateToken, getMyProfile);
router.put('/me', authenticateToken, uploadAvatar.single('avatar'), updateMyProfile);
// Busca de usuários: autenticada + rate limit (30 buscas/min/IP) contra abuso
router.get('/search', authenticateToken, rateLimit(30, 60_000), searchUsers);

// Rotas Admin
router.get('/', authenticateToken, requireAdmin, listUsers);
router.put('/:userId/ban', authenticateToken, requireAdmin, banUser);
router.put('/:userId/unban', authenticateToken, requireAdmin, unbanUser);
router.put('/:userId/role', authenticateToken, requireAdmin, updateUserRole);
router.get('/:userId/progress', authenticateToken, requireAdmin, getUserProgress);

export default router;

