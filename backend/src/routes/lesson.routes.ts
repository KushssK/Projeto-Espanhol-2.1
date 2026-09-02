import { Router } from 'express';
import {
  getLessonsByModule,
  getLessonById,
  getDeletedLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  restoreLesson,
  hardDeleteLesson,
  reorderLessons,
} from '../controllers/lesson.controller';
import { authenticateToken, requireStaff, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Rotas públicas
router.get('/module/:moduleId', getLessonsByModule);
router.get('/:id', getLessonById);

// Rotas protegidas (Staff: Admin + Teacher)
router.post('/', authenticateToken, requireStaff, createLesson);
router.put('/:id', authenticateToken, requireStaff, updateLesson);

// Rotas protegidas (Admin only)
router.get('/admin/deleted', authenticateToken, requireAdmin, getDeletedLessons);
router.put('/reorder/:moduleId', authenticateToken, requireAdmin, reorderLessons);
router.put('/:id/restore', authenticateToken, requireAdmin, restoreLesson);
router.delete('/:id/hard', authenticateToken, requireAdmin, hardDeleteLesson);
router.delete('/:id', authenticateToken, requireAdmin, deleteLesson);

export default router;
