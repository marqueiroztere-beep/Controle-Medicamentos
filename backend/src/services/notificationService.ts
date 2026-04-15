import webpush from 'web-push';
import db from '../config/database';

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface NotificationRow {
  agenda_item_id: number;
  medication_name: string;
  dosage: number;
  unit: string;
  user_name: string;
  scheduled_at: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  is_mobile: number;
}

export function configureVapid(): void {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured. Push notifications disabled.');
    console.warn('Run: npx web-push generate-vapid-keys and add to .env');
    return;
  }

  webpush.setVapidDetails(
    VAPID_SUBJECT || 'mailto:admin@controlemedicamentos.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('VAPID configured. Push notifications enabled.');
}

export async function sendPendingNotifications(): Promise<void> {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  // Debug: check current state
  const now = db.prepare("SELECT datetime('now', 'localtime') as now").get() as { now: string };
  const subCount = (db.prepare('SELECT COUNT(*) as c FROM push_subscriptions').get() as { c: number }).c;
  const pendingCount = (db.prepare("SELECT COUNT(*) as c FROM agenda_items WHERE status = 'pending'").get() as { c: number }).c;

  if (pendingCount > 0 || subCount > 0) {
    console.log(`[Notifications] now=${now.now} | subscriptions=${subCount} | pending_items=${pendingCount}`);
  }

  const rows = db.prepare(`
    SELECT
      ai.id AS agenda_item_id,
      m.name AS medication_name,
      m.dosage,
      m.unit,
      u.name AS user_name,
      ai.scheduled_at,
      ps.endpoint,
      ps.p256dh,
      ps.auth,
      ps.is_mobile
    FROM agenda_items ai
    JOIN medications m ON ai.medication_id = m.id
    JOIN users u ON ai.user_id = u.id
    JOIN push_subscriptions ps ON ai.user_id = ps.user_id
      AND (
        ps.is_mobile = 1
        OR NOT EXISTS (
          SELECT 1 FROM push_subscriptions ps2
          WHERE ps2.user_id = ai.user_id AND ps2.is_mobile = 1
        )
      )
    WHERE ai.status = 'pending'
      AND ai.notified_at IS NULL
      AND m.deleted_at IS NULL
      AND m.status = 'active'
      AND replace(ai.scheduled_at, 'T', ' ') BETWEEN datetime('now', 'localtime') AND datetime('now', 'localtime', '+16 minutes')
  `).all() as unknown as NotificationRow[];

  if (rows.length > 0) {
    console.log(`[Notifications] Found ${rows.length} doses to notify:`, rows.map(r => `${r.medication_name} at ${r.scheduled_at}`));
  } else if (subCount > 0 && pendingCount > 0) {
    // Log upcoming items to help debug timing
    const upcoming = db.prepare(`
      SELECT ai.scheduled_at, m.name, ai.notified_at
      FROM agenda_items ai JOIN medications m ON ai.medication_id = m.id
      WHERE ai.status = 'pending' AND m.deleted_at IS NULL AND m.status = 'active'
      ORDER BY ai.scheduled_at ASC LIMIT 3
    `).all() as Array<{ scheduled_at: string; name: string; notified_at: string | null }>;
    console.log(`[Notifications] No matches in window. Next pending:`, upcoming.map(u => `${u.name} at ${u.scheduled_at} (notified: ${u.notified_at || 'no'})`));
  }

  for (const row of rows) {
    const time = row.scheduled_at.substring(11, 16); // HH:MM
    const scheduledMs = new Date(row.scheduled_at).getTime();
    const minsUntil = Math.max(0, Math.round((scheduledMs - Date.now()) / 60000));
    const bodyText = minsUntil <= 1
      ? `Agora: tomar ${row.medication_name} ${row.dosage}${row.unit}`
      : `Daqui a ${minsUntil} minutos: tomar ${row.medication_name} ${row.dosage}${row.unit} às ${time}`;
    const payload = JSON.stringify({
      title: 'Hora do remédio!',
      body: bodyText,
      agendaItemId: row.agenda_item_id,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      apiUrl: process.env.API_BASE_URL || '',
    });

    const subscription: PushSubscription = {
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
    };

    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        payload,
        {
          TTL: 3600,          // Keep message for 1 hour if device is offline
          urgency: 'high',    // Wake device from sleep (critical for iOS)
          topic: 'medcontrol-dose',  // Coalesce duplicate notifications
        }
      );

      // Mark as notified
      db.prepare("UPDATE agenda_items SET notified_at = datetime('now', 'localtime') WHERE id = ?")
        .run(row.agenda_item_id);
      const deviceLabel = row.is_mobile ? 'mobile' : 'desktop';
      console.log(`[Notifications] SENT to ${row.user_name} (${deviceLabel}): ${row.medication_name} at ${row.scheduled_at}`);
    } catch (err: unknown) {
      const error = err as { statusCode?: number };
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription expired/invalid — remove it
        db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(subscription.endpoint);
      } else {
        console.error('Push notification error:', err);
      }
    }
  }

  // Mark overdue pending items as missed
  db.prepare(`
    UPDATE agenda_items
    SET status = 'missed', updated_at = datetime('now', 'localtime')
    WHERE status = 'pending'
      AND replace(scheduled_at, 'T', ' ') < datetime('now', 'localtime', '-4 hours')
  `).run();
}
