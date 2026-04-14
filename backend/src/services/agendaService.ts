import db from '../config/database';
import { applyTime, toLocalISOString, parseLocalDate, addDays, addHours, isBefore } from '../utils/dateUtils';

interface Medication {
  id: number;
  user_id: number;
  frequency_type: string;
  interval_hours: number | null;
  daily_times: string | null;
  specific_days: string | null;
  start_time: string;
  start_date: string;
  end_date: string | null;
  status: string;
  deleted_at: string | null;
}

/**
 * Generate agenda_items for a medication from `fromDate` to `toDate`.
 * Uses INSERT OR IGNORE so it's safe to call multiple times (idempotent).
 */
export function generateAgenda(medication: Medication, fromDate: Date, toDate: Date): number {
  if (medication.status === 'paused' || medication.status === 'completed' || medication.deleted_at) {
    return 0;
  }

  const endDate = medication.end_date ? parseLocalDate(medication.end_date) : null;
  const effectiveEnd = endDate && isBefore(endDate, toDate) ? endDate : toDate;

  const slots = computeSlots(medication, fromDate, effectiveEnd);
  if (slots.length === 0) return 0;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO agenda_items (medication_id, user_id, scheduled_at)
    VALUES (?, ?, ?)
  `);

  let inserted = 0;
  db.exec('BEGIN');
  try {
    for (const scheduledAt of slots) {
      const result = insert.run(medication.id, medication.user_id, scheduledAt);
      inserted += (result as { changes: number }).changes;
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return inserted;
}

function computeSlots(med: Medication, from: Date, to: Date): string[] {
  const slots: string[] = [];
  const startDate = parseLocalDate(med.start_date);

  if (med.frequency_type === 'interval' && med.interval_hours) {
    let current = applyTime(startDate, med.start_time);

    // Fast-forward to our window
    while (isBefore(current, from)) {
      current = addHours(current, med.interval_hours);
    }

    while (!isBefore(to, current)) {
      slots.push(toLocalISOString(current));
      current = addHours(current, med.interval_hours);
    }

  } else if (med.frequency_type === 'daily_times' && med.daily_times) {
    const times: string[] = JSON.parse(med.daily_times);
    let day = new Date(Math.max(from.getTime(), startDate.getTime()));
    day.setHours(0, 0, 0, 0);

    while (!isBefore(to, day)) {
      for (const t of times) {
        const slot = applyTime(day, t);
        if (!isBefore(slot, from) && !isBefore(to, slot)) {
          slots.push(toLocalISOString(slot));
        }
      }
      day = addDays(day, 1);
    }

  } else if (med.frequency_type === 'specific_days' && med.specific_days) {
    const config: { days: number[]; times: string[] } = JSON.parse(med.specific_days);
    let day = new Date(Math.max(from.getTime(), startDate.getTime()));
    day.setHours(0, 0, 0, 0);

    while (!isBefore(to, day)) {
      if (config.days.includes(day.getDay())) {
        for (const t of config.times) {
          const slot = applyTime(day, t);
          if (!isBefore(slot, from) && !isBefore(to, slot)) {
            slots.push(toLocalISOString(slot));
          }
        }
      }
      day = addDays(day, 1);
    }
  }

  return slots;
}

/**
 * Cancel all future pending agenda items for a medication.
 */
export function cancelFuturePendingItems(medicationId: number, note: string): void {
  db.prepare(`
    UPDATE agenda_items
    SET status = 'skipped', note = ?, updated_at = datetime('now', 'localtime')
    WHERE medication_id = ?
      AND status = 'pending'
      AND replace(scheduled_at, 'T', ' ') > datetime('now', 'localtime')
  `).run(note, medicationId);
}

/**
 * Regenerate agenda for a medication after edit or reactivation.
 */
export function regenerateFutureAgenda(medication: Medication): number {
  db.prepare(`
    DELETE FROM agenda_items
    WHERE medication_id = ?
      AND status = 'pending'
      AND replace(scheduled_at, 'T', ' ') > datetime('now', 'localtime')
  `).run(medication.id);

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return generateAgenda(medication, now, in30Days);
}
