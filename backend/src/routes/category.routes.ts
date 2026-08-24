import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  getCategoriesByModule,
  reorderCategories,
  updateCategory,
} from '../controllers/category.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/module/:moduleId', getCategoriesByModule);

router.post('/', authenticateToken, requireAdmin, createCategory);
router.put('/:id', authenticateToken, requireAdmin, updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, deleteCategory);
router.put('/reorder/:moduleId', authenticateToken, requireAdmin, reorderCategories);

export default router;
