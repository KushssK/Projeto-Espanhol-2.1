import { Router } from 'express';
import {
  uploadAttachment as uploadAttachmentHandler,
  getAttachmentsByLesson,
  deleteAttachment,
  reorderAttachments,
} from '../controllers/attachment.controller';
import { uploadAttachment as multerAttachment } from '../config/upload.config';
import { authenticateToken, requireStaff, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Rota pública para listar attachments
router.get('/lesson/:lessonId', getAttachmentsByLesson);

// Rotas protegidas (Staff)
router.post(
  '/:lessonId',
  authenticateToken,
  requireStaff,
  multerAttachment.single('file'),
  uploadAttachmentHandler
);

// Rotas protegidas (Admin)
router.put('/reorder/:lessonId', authenticateToken, requireAdmin, reorderAttachments);
router.delete('/:id', authenticateToken, requireAdmin, deleteAttachment);

export default router;
