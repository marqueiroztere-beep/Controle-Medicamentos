import { Router } from 'express';
import { register, login, getMe, updateMe, changePassword, clearMyData } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);
router.put('/password', requireAuth, changePassword);
router.delete('/my-data', requireAuth, clearMyData);

export default router;
