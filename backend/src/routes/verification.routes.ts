import { Router } from 'express';
import { sendCode, verifyCode } from '../controllers/verification.controller';
import { rateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

// Rate limiting mais restritivo para envio de código
const codeLimiter = rateLimit(5, 15 * 60 * 1000); // 5 tentativas / 15 min por IP

router.post('/send-code', codeLimiter, sendCode);
router.post('/verify-code', codeLimiter, verifyCode);

export default router;
