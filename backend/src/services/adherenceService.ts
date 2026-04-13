import db from '../config/database';

interface AdherenceStats {
  total: number;
  taken: number;
  skipped: number;
  missed: number;
  postponed: number;
  rate: number;
}

export function getGlobalAdherence(userId: number, from?: string, to?: string, patientId?: string): AdherenceStats {
  let where = 'ai.user_id = ? AND ai.status != \'pending\'';
  const params: (number | string)[] = [userId];

  if (from) { where += ' AND ai.scheduled_at >= ?'; params.push(`${from}T00:00:00`); }
  if (to)   { where += ' AND ai.scheduled_at <= ?'; params.push(`${to}T23:59:59`); }

  const patientJoin = patientId ? 'JOIN medications m ON ai.medication_id = m.id' : '';
  if (patientId === 'self') where += ' AND m.patient_id IS NULL';
  else if (patientId && !isNaN(Number(patientId))) where += ` AND m.patient_id = ${Number(patientId)}`;

  return computeStats(where, params, patientJoin);
}

export function getMedicationAdherence(userId: number, medicationId: number, from?: string, to?: string): AdherenceStats {
  let where = 'ai.user_id = ? AND ai.medication_id = ? AND ai.status != \'pending\'';
  const params: (number | string)[] = [userId, medicationId];

  if (from) { where += ' AND ai.scheduled_at >= ?'; params.push(`${from}T00:00:00`); }
  if (to)   { where += ' AND ai.scheduled_at <= ?'; params.push(`${to}T23:59:59`); }

  return computeStats(where, params);
}

function computeStats(where: string, params: (number | string)[], join = ''): AdherenceStats {
  const row = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN ai.status = 'taken'     THEN 1 ELSE 0 END) AS taken,
      SUM(CASE WHEN ai.status = 'skipped'   THEN 1 ELSE 0 END) AS skipped,
      SUM(CASE WHEN ai.status = 'missed'    THEN 1 ELSE 0 END) AS missed,
      SUM(CASE WHEN ai.status = 'postponed' THEN 1 ELSE 0 END) AS postponed
    FROM agenda_items ai
    ${join}
    WHERE ${where}
  `).get(...params) as unknown as { total: number; taken: number; skipped: number; missed: number; postponed: number };

  const total = row.total || 0;
  const taken = row.taken || 0;

  return {
    total,
    taken,
    skipped: row.skipped || 0,
    missed: row.missed || 0,
    postponed: row.postponed || 0,
    rate: total > 0 ? Math.round((taken / total) * 100) : 0,
  };
}
