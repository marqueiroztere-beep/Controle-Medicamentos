import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

interface PatientRow {
  id: number;
  user_id: number;
  name: string;
  relationship: string | null;
  birth_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function listPatients(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const patients = db.prepare(
    'SELECT * FROM patients WHERE user_id = ? ORDER BY name ASC'
  ).all(userId) as unknown as PatientRow[];
  res.json({ patients });
}

export function createPatient(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { name, relationship, birth_date, notes } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ error: 'Nome é obrigatório' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO patients (user_id, name, relationship, birth_date, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, name.trim(), relationship || null, birth_date || null, notes || null);

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?')
    .get(result.lastInsertRowid) as unknown as PatientRow;

  res.status(201).json({ patient });
}

export function updatePatient(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { name, relationship, birth_date, notes } = req.body;

  const existing = db.prepare('SELECT id FROM patients WHERE id = ? AND user_id = ?')
    .get(id, userId);
  if (!existing) {
    res.status(404).json({ error: 'Paciente não encontrado' });
    return;
  }

  db.prepare(`
    UPDATE patients SET
      name         = COALESCE(?, name),
      relationship = ?,
      birth_date   = ?,
      notes        = ?,
      updated_at   = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(name?.trim() || null, relationship ?? null, birth_date ?? null, notes ?? null, id, userId);

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?')
    .get(id) as unknown as PatientRow;
  res.json({ patient });
}

export function deletePatient(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM patients WHERE id = ? AND user_id = ?')
    .get(id, userId);
  if (!existing) {
    res.status(404).json({ error: 'Paciente não encontrado' });
    return;
  }

  // Move medications to "self" (patient_id = NULL) before deleting
  db.prepare("UPDATE medications SET patient_id = NULL WHERE patient_id = ?").run(id);
  db.prepare('DELETE FROM patients WHERE id = ? AND user_id = ?').run(id, userId);

  res.json({ message: 'Paciente removido. Os medicamentos foram mantidos sem vínculo.' });
}
