import { Router } from 'express';
import {
  markLessonComplete,
  getMyProgress,
  getModuleProgress,
  getLeaderboard,
} from '../controllers/progress.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas de progresso requerem autenticação
router.use(authenticateToken);

router.post('/:lessonId', markLessonComplete);
router.get('/me', getMyProgress);
router.get('/module/:moduleId', getModuleProgress);
router.get('/leaderboard', getLeaderboard);

export default router;
