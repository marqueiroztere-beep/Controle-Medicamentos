import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { globalAdherence, medicationAdherence } from '../controllers/adherenceController';

const router = Router();

router.use(requireAuth);

router.get('/', globalAdherence);
router.get('/:medicationId', medicationAdherence);

export default router;
