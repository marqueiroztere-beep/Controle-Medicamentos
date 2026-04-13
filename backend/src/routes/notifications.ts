import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getVapidKey, subscribe, unsubscribe } from '../controllers/notificationController';

const router = Router();

router.get('/vapid-key', getVapidKey);
router.post('/subscribe', requireAuth, subscribe);
router.delete('/subscribe', requireAuth, unsubscribe);

export default router;
