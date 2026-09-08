import { Router } from 'express';
import {
  getModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
} from '../controllers/module.controller';
import { authenticateToken, requireAdmin, authenticateOptional } from '../middlewares/auth.middleware';

const router = Router();

// Rotas públicas — autenticação OPCIONAL (staff vê rascunhos/excluídas)
router.get('/', authenticateOptional, getModules);
router.get('/:id', authenticateOptional, getModuleById);

// Rotas protegidas (Admin)
router.post('/', authenticateToken, requireAdmin, createModule);
router.put('/reorder', authenticateToken, requireAdmin, reorderModules);
router.put('/:id', authenticateToken, requireAdmin, updateModule);
router.delete('/:id', authenticateToken, requireAdmin, deleteModule);

export default router;
