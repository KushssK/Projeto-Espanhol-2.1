import { Router } from 'express';
import {
  getMyProfile,
  updateMyProfile,
  searchUsers,
  banUser,
  unbanUser,
  listUsers,
  getUserProgress,
} from '../controllers/user.controller';
import { uploadAvatar } from '../config/upload.config';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Rotas autenticadas (qualquer role)
router.get('/me', authenticateToken, getMyProfile);
router.put('/me', authenticateToken, uploadAvatar.single('avatar'), updateMyProfile);
router.get('/search', authenticateToken, searchUsers);

// Rotas Admin
router.get('/', authenticateToken, requireAdmin, listUsers);
router.put('/:userId/ban', authenticateToken, requireAdmin, banUser);
router.put('/:userId/unban', authenticateToken, requireAdmin, unbanUser);
router.get('/:userId/progress', authenticateToken, requireAdmin, getUserProgress);

export default router;
