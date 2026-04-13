import { Request, Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

export function getVapidKey(_req: Request, res: Response): void {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    res.status(503).json({ error: 'Notificações push não configuradas neste servidor' });
    return;
  }
  res.json({ publicKey: key });
}

export function subscribe(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { endpoint, keys, userAgent } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: 'Dados de subscription inválidos' });
    return;
  }

  db.prepare(`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET
      p256dh = excluded.p256dh,
      auth   = excluded.auth,
      user_agent = excluded.user_agent
  `).run(userId, endpoint, keys.p256dh, keys.auth, userAgent || null);

  res.status(201).json({ message: 'Subscription registrada com sucesso' });
}

export function unsubscribe(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const { endpoint } = req.body;

  db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?')
    .run(endpoint, userId);

  res.json({ message: 'Subscription removida' });
}
