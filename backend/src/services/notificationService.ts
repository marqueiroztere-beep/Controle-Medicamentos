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
      ps.auth
    FROM agenda_items ai
    JOIN medications m ON ai.medication_id = m.id
    JOIN users u ON ai.user_id = u.id
    JOIN push_subscriptions ps ON ai.user_id = ps.user_id
    WHERE ai.status = 'pending'
      AND ai.notified_at IS NULL
      AND m.deleted_at IS NULL
      AND m.status = 'active'
      AND ai.scheduled_at BETWEEN datetime('now', '+8 minutes') AND datetime('now', '+16 minutes')
  `).all() as unknown as NotificationRow[];

  for (const row of rows) {
    const time = row.scheduled_at.substring(11, 16); // HH:MM
    const payload = JSON.stringify({
      title: 'Hora do remédio!',
      body: `Daqui a 10 minutos: tomar ${row.medication_name} ${row.dosage}${row.unit} às ${time}`,
      agendaItemId: row.agenda_item_id,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
    });

    const subscription: PushSubscription = {
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
    };

    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        payload
      );

      // Mark as notified
      db.prepare("UPDATE agenda_items SET notified_at = datetime('now') WHERE id = ?")
        .run(row.agenda_item_id);
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
    SET status = 'missed', updated_at = datetime('now')
    WHERE status = 'pending'
      AND scheduled_at < datetime('now', '-30 minutes')
  `).run();
}
