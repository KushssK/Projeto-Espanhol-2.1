import { Router } from 'express';
import { login, register, registerStaff, bootstrapAdmin, confirmLogin } from '../controllers/auth.controller';
import { rateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

// Rate limiting para prevenir brute force em endpoints públicos sensíveis
const authLimiter = rateLimit(20, 15 * 60 * 1000); // 20 tentativas / 15 min por IP

router.post('/register', authLimiter, register);
router.post('/register/staff', authLimiter, registerStaff);
router.post('/login', authLimiter, login);
router.post('/login/confirm', authLimiter, confirmLogin);
router.post('/bootstrap-admin', authLimiter, bootstrapAdmin);

export default router;
