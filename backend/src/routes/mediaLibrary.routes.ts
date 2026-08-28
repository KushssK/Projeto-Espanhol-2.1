import { Router } from 'express';
import {
  createMediaItem,
  deleteMediaItem,
  listMediaLibrary,
  reorderMediaLibrary,
  updateMediaItem,
} from '../controllers/mediaLibrary.controller';
import { uploadMediaLibrary } from '../config/upload.config';
import { authenticateToken, requireAdmin, requireStaff } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', listMediaLibrary);

router.post(
  '/',
  authenticateToken,
  requireStaff,
  uploadMediaLibrary.single('file'),
  createMediaItem
);

router.put(
  '/:id',
  authenticateToken,
  requireStaff,
  uploadMediaLibrary.single('file'),
  updateMediaItem
);

router.delete('/:id', authenticateToken, requireAdmin, deleteMediaItem);
router.put('/reorder', authenticateToken, requireAdmin, reorderMediaLibrary);

export default router;
