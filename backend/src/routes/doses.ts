import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { takeDose, skipDose, postponeDose, getHistory } from '../controllers/doseController';

const router = Router();

router.use(requireAuth);

router.get('/history', getHistory);
router.post('/:agendaItemId/take', takeDose);
router.post('/:agendaItemId/skip', skipDose);
router.post('/:agendaItemId/postpone', postponeDose);

export default router;
