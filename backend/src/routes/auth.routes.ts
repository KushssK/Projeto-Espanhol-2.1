import { Router } from 'express';
import { login, register, regenerateAccessCode } from '../controllers/auth.controller';
import { rateLimit } from '../middlewares/rateLimit.middleware';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Rate limiting para prevenir brute force em endpoints públicos sensíveis
const authLimiter = rateLimit(20, 15 * 60 * 1000); // 20 tentativas / 15 min por IP
const codeLimiter = rateLimit(5, 15 * 60 * 1000); // geração de novo código: 5 / 15 min por IP

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/regenerate-code', authenticateToken, codeLimiter, regenerateAccessCode);

export default router;
