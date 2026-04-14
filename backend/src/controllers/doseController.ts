import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

interface AgendaItemRow {
  id: number;
  medication_id: number;
  user_id: number;
  scheduled_at: string;
  status: string;
}

function getItemForUser(id: string, userId: number): AgendaItemRow | undefined {
  return db.prepare('SELECT * FROM agenda_items WHERE id = ? AND user_id = ?')
    .get(id, userId) as unknown as AgendaItemRow | undefined;
}

export function takeDose(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { agendaItemId } = req.params;
  const { note } = req.body;

  const item = getItemForUser(agendaItemId, userId);
  if (!item) {
    res.status(404).json({ error: 'Item de agenda não encontrado' });
    return;
  }

  if (item.status === 'taken') {
    res.status(400).json({ error: 'Dose já registrada como tomada' });
    return;
  }

  db.prepare(`
    UPDATE agenda_items
    SET status = 'taken', taken_at = datetime('now', 'localtime'), note = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(note || null, agendaItemId);

  res.json({ message: 'Dose registrada com sucesso', status: 'taken' });
}

export function skipDose(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { agendaItemId } = req.params;
  const { note } = req.body;

  const item = getItemForUser(agendaItemId, userId);
  if (!item) {
    res.status(404).json({ error: 'Item de agenda não encontrado' });
    return;
  }

  db.prepare(`
    UPDATE agenda_items
    SET status = 'skipped', note = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(note || 'Pulado pelo usuário', agendaItemId);

  res.json({ message: 'Dose marcada como pulada', status: 'skipped' });
}

export function postponeDose(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { agendaItemId } = req.params;
  const { postpone_to, note } = req.body;

  if (!postpone_to) {
    res.status(400).json({ error: 'Campo postpone_to é obrigatório' });
    return;
  }

  const item = getItemForUser(agendaItemId, userId);
  if (!item) {
    res.status(404).json({ error: 'Item de agenda não encontrado' });
    return;
  }

  // Mark original as postponed
  db.prepare(`
    UPDATE agenda_items
    SET status = 'postponed', postponed_to = ?, note = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(postpone_to, note || 'Adiado pelo usuário', agendaItemId);

  // Create a new pending item at the new time
  try {
    db.prepare(`
      INSERT INTO agenda_items (medication_id, user_id, scheduled_at, note)
      VALUES (?, ?, ?, ?)
    `).run(item.medication_id, userId, postpone_to, 'Reagendado');
  } catch {
    // If already exists (unique constraint), just continue
  }

  res.json({ message: 'Dose adiada com sucesso', status: 'postponed', postponed_to: postpone_to });
}

export function getHistory(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const {
    medication_id,
    from,
    to,
    status,
    page = '1',
    limit = '50'
  } = req.query as Record<string, string>;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions: string[] = ['ai.user_id = ?'];
  const params: (string | number)[] = [userId];

  if (medication_id) {
    conditions.push('ai.medication_id = ?');
    params.push(medication_id);
  }
  if (from) {
    conditions.push("replace(ai.scheduled_at, 'T', ' ') >= ?");
    params.push(`${from} 00:00:00`);
  }
  if (to) {
    conditions.push("replace(ai.scheduled_at, 'T', ' ') <= ?");
    params.push(`${to} 23:59:59`);
  }
  if (status) {
    conditions.push('ai.status = ?');
    params.push(status);
  } else {
    // Default: only finished items (not pending)
    conditions.push("ai.status != 'pending'");
  }

  const where = conditions.join(' AND ');

  const total = (db.prepare(`
    SELECT COUNT(*) as count FROM agenda_items ai
    JOIN medications m ON ai.medication_id = m.id
    WHERE ${where}
  `).get(...params) as unknown as { count: number }).count;

  const rows = db.prepare(`
    SELECT
      ai.*,
      m.name AS med_name,
      m.dosage AS med_dosage,
      m.unit AS med_unit,
      CASE WHEN m.deleted_at IS NOT NULL THEN 1 ELSE 0 END AS med_deleted
    FROM agenda_items ai
    JOIN medications m ON ai.medication_id = m.id
    WHERE ${where}
    ORDER BY ai.scheduled_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset) as Array<{
    id: number; medication_id: number; scheduled_at: string; status: string;
    taken_at: string | null; note: string | null; postponed_to: string | null;
    med_name: string; med_dosage: number; med_unit: string; med_deleted: number;
  }>;

  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    items: rows.map(row => ({
      id: row.id,
      medication_id: row.medication_id,
      scheduled_at: row.scheduled_at,
      status: row.status,
      taken_at: row.taken_at,
      postponed_to: row.postponed_to,
      note: row.note,
      medication: {
        id: row.medication_id,
        name: row.med_name,
        dosage: row.med_dosage,
        unit: row.med_unit,
        deleted: row.med_deleted === 1,
      }
    }))
  });
}
