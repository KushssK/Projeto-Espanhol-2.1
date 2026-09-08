import { Router } from 'express';
import { getSettings, updateSettings, uploadSettingsLogo, getSettingsLogo } from '../controllers/settings.controller';
import { uploadLogo } from '../config/upload.config';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getSettings);
// Pública: a logo aparece na navbar para visitantes também
router.get('/logo', getSettingsLogo);
router.put('/', authenticateToken, requireAdmin, updateSettings);
router.post('/logo', authenticateToken, requireAdmin, uploadLogo.single('logo'), uploadSettingsLogo);

export default router;
