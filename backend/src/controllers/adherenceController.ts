import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { getGlobalAdherence, getMedicationAdherence } from '../services/adherenceService';

function buildPatientClause(patientFilter: string | undefined): string {
  if (patientFilter === 'self') return 'AND m.patient_id IS NULL';
  if (patientFilter && !isNaN(Number(patientFilter))) return `AND m.patient_id = ${Number(patientFilter)}`;
  return '';
}

export function globalAdherence(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { from, to, patient_id } = req.query as { from?: string; to?: string; patient_id?: string };
  const pc = buildPatientClause(patient_id);

  const stats = getGlobalAdherence(userId, from, to, patient_id);

  // Per-medication breakdown
  const meds = db.prepare(`
    SELECT DISTINCT m.id, m.name, m.dosage, m.unit, m.status,
      CASE WHEN m.deleted_at IS NOT NULL THEN 1 ELSE 0 END AS deleted
    FROM medications m
    JOIN agenda_items ai ON ai.medication_id = m.id
    WHERE m.user_id = ? AND ai.status != 'pending'
    ${pc}
    ORDER BY m.name
  `).all(userId) as Array<{ id: number; name: string; dosage: number; unit: string; status: string; deleted: number }>;

  const perMedication = meds.map(med => ({
    medication: { id: med.id, name: med.name, dosage: med.dosage, unit: med.unit, status: med.status, deleted: med.deleted === 1 },
    ...getMedicationAdherence(userId, med.id, from, to)
  }));

  res.json({ global: stats, per_medication: perMedication });
}

export function medicationAdherence(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { medicationId } = req.params;
  const { from, to } = req.query as { from?: string; to?: string };

  const med = db.prepare('SELECT id, name, dosage, unit, status FROM medications WHERE id = ? AND user_id = ?')
    .get(medicationId, userId);
  if (!med) {
    res.status(404).json({ error: 'Medicamento não encontrado' });
    return;
  }

  const stats = getMedicationAdherence(userId, Number(medicationId), from, to);

  // Daily breakdown for last 30 days
  const days = db.prepare(`
    SELECT
      DATE(ai.scheduled_at) AS day,
      SUM(CASE WHEN ai.status = 'taken'   THEN 1 ELSE 0 END) AS taken,
      SUM(CASE WHEN ai.status = 'skipped' THEN 1 ELSE 0 END) AS skipped,
      SUM(CASE WHEN ai.status = 'missed'  THEN 1 ELSE 0 END) AS missed,
      COUNT(*) AS total
    FROM agenda_items ai
    WHERE ai.medication_id = ? AND ai.user_id = ? AND ai.status != 'pending'
      AND ai.scheduled_at >= datetime('now', 'localtime', '-30 days')
    GROUP BY DATE(ai.scheduled_at)
    ORDER BY day ASC
  `).all(medicationId, userId);

  res.json({ medication: med, stats, daily: days });
}
