import { Router } from 'express';
import { sendCode, verifyCode } from '../controllers/verification.controller';
import { rateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

// Rate limiting mais restritivo para ENVIO de código (anti-spam)
const sendLimiter = rateLimit(5, 15 * 60 * 1000); // 5 envios / 15 min por IP

// Rate limiting mais permissivo para VERIFICAÇÃO de código (brute force já tratado na camada de código)
const verifyLimiter = rateLimit(20, 15 * 60 * 1000); // 20 tentativas / 15 min por IP

router.post('/send-code', sendLimiter, sendCode);
router.post('/verify-code', verifyLimiter, verifyCode);

export default router;
