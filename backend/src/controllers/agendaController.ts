import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { todayStr } from '../utils/dateUtils';

interface AgendaRow {
  id: number;
  medication_id: number;
  user_id: number;
  scheduled_at: string;
  status: string;
  taken_at: string | null;
  postponed_to: string | null;
  note: string | null;
  notified_at: string | null;
  med_name: string;
  med_dosage: number;
  med_unit: string;
  med_instructions: string | null;
  med_deleted: number;
}

const AGENDA_SELECT = `
  SELECT
    ai.*,
    m.name  AS med_name,
    m.dosage AS med_dosage,
    m.unit  AS med_unit,
    m.instructions AS med_instructions,
    CASE WHEN m.deleted_at IS NOT NULL THEN 1 ELSE 0 END AS med_deleted
  FROM agenda_items ai
  JOIN medications m ON ai.medication_id = m.id
`;

function patientClause(patientFilter: string | undefined): string {
  if (patientFilter === 'self') return 'AND m.patient_id IS NULL';
  if (patientFilter && !isNaN(Number(patientFilter))) return `AND m.patient_id = ${Number(patientFilter)}`;
  return '';
}

function formatAgendaItem(row: AgendaRow) {
  return {
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
      instructions: row.med_instructions,
      deleted: row.med_deleted === 1,
    }
  };
}

export function getToday(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const today = todayStr();
  const start = `${today}T00:00:00`;
  const end   = `${today}T23:59:59`;
  const pc = patientClause(req.query.patient_id as string | undefined);

  const rows = db.prepare(`
    ${AGENDA_SELECT}
    WHERE ai.user_id = ?
      AND ai.scheduled_at BETWEEN ? AND ?
      AND m.deleted_at IS NULL
      ${pc}
    ORDER BY ai.scheduled_at ASC
  `).all(userId, start, end) as unknown as AgendaRow[];

  res.json({ items: rows.map(formatAgendaItem) });
}

export function getByDate(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const date = req.query.date as string || todayStr();
  const start = `${date}T00:00:00`;
  const end   = `${date}T23:59:59`;
  const pc = patientClause(req.query.patient_id as string | undefined);

  const rows = db.prepare(`
    ${AGENDA_SELECT}
    WHERE ai.user_id = ?
      AND ai.scheduled_at BETWEEN ? AND ?
      AND m.deleted_at IS NULL
      ${pc}
    ORDER BY ai.scheduled_at ASC
  `).all(userId, start, end) as unknown as AgendaRow[];

  res.json({ date, items: rows.map(formatAgendaItem) });
}

export function getByRange(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { from, to } = req.query as { from: string; to: string };
  if (!from || !to) {
    res.status(400).json({ error: 'Parâmetros from e to são obrigatórios' });
    return;
  }
  const pc = patientClause(req.query.patient_id as string | undefined);

  const rows = db.prepare(`
    ${AGENDA_SELECT}
    WHERE ai.user_id = ?
      AND ai.scheduled_at BETWEEN ? AND ?
      AND m.deleted_at IS NULL
      ${pc}
    ORDER BY ai.scheduled_at ASC
  `).all(userId, `${from}T00:00:00`, `${to}T23:59:59`) as unknown as AgendaRow[];

  res.json({ from, to, items: rows.map(formatAgendaItem) });
}
