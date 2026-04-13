import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getToday, getByDate, getByRange } from '../controllers/agendaController';

const router = Router();

router.use(requireAuth);

router.get('/today', getToday);
router.get('/range', getByRange);
router.get('/', getByDate);

export default router;
