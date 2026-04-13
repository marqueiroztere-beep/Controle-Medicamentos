import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listMedications, getMedication, createMedication,
  updateMedication, updateMedicationStatus, deleteMedication
} from '../controllers/medicationController';
import { getMedicationInfo } from '../controllers/medicationInfoController';

const router = Router();

router.use(requireAuth);

router.get('/info', getMedicationInfo);
router.get('/', listMedications);
router.get('/:id', getMedication);
router.post('/', createMedication);
router.put('/:id', updateMedication);
router.patch('/:id/status', updateMedicationStatus);
router.delete('/:id', deleteMedication);

export default router;
