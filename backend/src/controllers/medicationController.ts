import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generateAgenda, cancelFuturePendingItems, regenerateFutureAgenda } from '../services/agendaService';

interface MedicationRow {
  id: number;
  user_id: number;
  name: string;
  dosage: number;
  unit: string;
  instructions: string | null;
  frequency_type: string;
  interval_hours: number | null;
  daily_times: string | null;
  specific_days: string | null;
  start_time: string;
  start_date: string;
  end_date: string | null;
  status: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function listMedications(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const includeDeleted = req.query.include === 'deleted';

  const meds = db.prepare(`
    SELECT * FROM medications
    WHERE user_id = ?
      ${includeDeleted ? '' : 'AND deleted_at IS NULL'}
    ORDER BY status ASC, name ASC
  `).all(userId) as unknown as MedicationRow[];

  res.json({ medications: meds.map(parseMedication) });
}

export function getMedication(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { id } = req.params;

  const med = db.prepare('SELECT * FROM medications WHERE id = ? AND user_id = ?').get(id, userId) as unknown as MedicationRow | undefined;
  if (!med) {
    res.status(404).json({ error: 'Medicamento não encontrado' });
    return;
  }
  res.json({ medication: parseMedication(med) });
}

export function createMedication(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const {
    name, dosage, unit, instructions,
    frequency_type, interval_hours, daily_times, specific_days,
    start_time, start_date, end_date
  } = req.body;

  if (!name || !dosage || !unit || !frequency_type || !start_time || !start_date) {
    res.status(400).json({ error: 'Campos obrigatórios: nome, dosagem, unidade, frequência, horário inicial, data de início' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO medications
      (user_id, name, dosage, unit, instructions, frequency_type,
       interval_hours, daily_times, specific_days, start_time, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId, name.trim(), dosage, unit.trim(),
    instructions || null, frequency_type,
    interval_hours || null,
    daily_times ? JSON.stringify(daily_times) : null,
    specific_days ? JSON.stringify(specific_days) : null,
    start_time, start_date, end_date || null
  );

  const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(result.lastInsertRowid) as unknown as MedicationRow;

  // Generate agenda for next 30 days
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const created = generateAgenda(med, now, in30Days);
  console.log(`Generated ${created} agenda items for medication ${med.id}`);

  res.status(201).json({ medication: parseMedication(med) });
}

export function updateMedication(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM medications WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
    .get(id, userId) as unknown as MedicationRow | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Medicamento não encontrado' });
    return;
  }

  const {
    name, dosage, unit, instructions,
    frequency_type, interval_hours, daily_times, specific_days,
    start_time, start_date, end_date
  } = req.body;

  db.prepare(`
    UPDATE medications SET
      name           = COALESCE(?, name),
      dosage         = COALESCE(?, dosage),
      unit           = COALESCE(?, unit),
      instructions   = ?,
      frequency_type = COALESCE(?, frequency_type),
      interval_hours = ?,
      daily_times    = ?,
      specific_days  = ?,
      start_time     = COALESCE(?, start_time),
      start_date     = COALESCE(?, start_date),
      end_date       = ?,
      updated_at     = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(
    name?.trim() || null, dosage || null, unit?.trim() || null,
    instructions !== undefined ? (instructions || null) : existing.instructions,
    frequency_type || null,
    interval_hours !== undefined ? (interval_hours || null) : existing.interval_hours,
    daily_times !== undefined ? (daily_times ? JSON.stringify(daily_times) : null) : existing.daily_times,
    specific_days !== undefined ? (specific_days ? JSON.stringify(specific_days) : null) : existing.specific_days,
    start_time || null, start_date || null,
    end_date !== undefined ? (end_date || null) : existing.end_date,
    id, userId
  );

  const updated = db.prepare('SELECT * FROM medications WHERE id = ?').get(id) as unknown as MedicationRow;

  // Regenerate future agenda
  regenerateFutureAgenda(updated);

  res.json({ medication: parseMedication(updated) });
}

export function updateMedicationStatus(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['active', 'paused', 'completed'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Status inválido. Use: active, paused, completed' });
    return;
  }

  const existing = db.prepare('SELECT * FROM medications WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
    .get(id, userId) as unknown as MedicationRow | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Medicamento não encontrado' });
    return;
  }

  db.prepare("UPDATE medications SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, id);

  if (status === 'paused') {
    cancelFuturePendingItems(Number(id), 'Medicamento pausado');
  } else if (status === 'completed') {
    cancelFuturePendingItems(Number(id), 'Tratamento concluído');
  } else if (status === 'active') {
    // Reactivated: regenerate future agenda
    const reactivated = db.prepare('SELECT * FROM medications WHERE id = ?').get(id) as unknown as MedicationRow;
    regenerateFutureAgenda(reactivated);
  }

  const updated = db.prepare('SELECT * FROM medications WHERE id = ?').get(id) as unknown as MedicationRow;
  res.json({ medication: parseMedication(updated) });
}

export function deleteMedication(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM medications WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
    .get(id, userId);
  if (!existing) {
    res.status(404).json({ error: 'Medicamento não encontrado' });
    return;
  }

  // Soft delete
  db.prepare(`
    UPDATE medications
    SET deleted_at = datetime('now'), status = 'completed', updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(id, userId);

  // Cancel all future pending doses
  cancelFuturePendingItems(Number(id), 'Medicamento removido pelo usuário');

  res.json({ message: 'Medicamento removido com sucesso' });
}

function parseMedication(med: MedicationRow) {
  return {
    ...med,
    daily_times: med.daily_times ? JSON.parse(med.daily_times) : null,
    specific_days: med.specific_days ? JSON.parse(med.specific_days) : null,
  };
}
