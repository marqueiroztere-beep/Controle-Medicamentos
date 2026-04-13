import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listPatients, createPatient, updatePatient, deletePatient } from '../controllers/patientController';

const router = Router();
router.use(requireAuth);

router.get('/',     listPatients);
router.post('/',    createPatient);
router.put('/:id',  updatePatient);
router.delete('/:id', deletePatient);

export default router;
