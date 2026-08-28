import { Router } from 'express';
import { addWhitelist, listWhitelist, removeWhitelist } from '../controllers/whitelist.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/', listWhitelist);
router.post('/', addWhitelist);
router.delete('/:email', removeWhitelist);

export default router;
