import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database';
import { signToken } from '../config/jwt';
import { AuthRequest } from '../middleware/auth';

interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email já cadastrado' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const result = db.prepare(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
  ).run(name.trim(), email.toLowerCase().trim(), hashedPassword);

  const token = signToken({ userId: result.lastInsertRowid as number, email: email.toLowerCase().trim() });
  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, name: name.trim(), email: email.toLowerCase().trim() }
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as unknown as UserRow | undefined;
  if (!user) {
    res.status(401).json({ error: 'Email ou senha incorretos' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Email ou senha incorretos' });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
}

export function getMe(req: AuthRequest, res: Response): void {
  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.user!.userId) as unknown as UserRow | undefined;
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  res.json({ user });
}

export async function updateMe(req: AuthRequest, res: Response): Promise<void> {
  const { name, email } = req.body;
  const userId = req.user!.userId;

  if (email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase().trim(), userId);
    if (existing) {
      res.status(409).json({ error: 'Email já cadastrado por outro usuário' });
      return;
    }
  }

  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(name?.trim() || null, email?.toLowerCase().trim() || null, userId);

  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(userId);
  res.json({ user });
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.userId;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
    return;
  }

  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId) as unknown as { password: string } | undefined;
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Senha atual incorreta' });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now', 'localtime') WHERE id = ?")
    .run(hashedPassword, userId);

  res.json({ message: 'Senha alterada com sucesso' });
}

export function clearMyData(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;

  db.exec('BEGIN');
  try {
    const agendaDel = db.prepare('DELETE FROM agenda_items WHERE user_id = ?').run(userId);
    const medDel = db.prepare('DELETE FROM medications WHERE user_id = ?').run(userId);
    const patDel = db.prepare('DELETE FROM patients WHERE user_id = ?').run(userId);
    const pushDel = db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(userId);
    db.exec('COMMIT');

    console.log(`[ClearData] user=${userId}: agenda=${(agendaDel as { changes: number }).changes} meds=${(medDel as { changes: number }).changes} patients=${(patDel as { changes: number }).changes} push=${(pushDel as { changes: number }).changes}`);

    res.json({
      message: 'Dados limpos com sucesso',
      deleted: {
        agenda_items: (agendaDel as { changes: number }).changes,
        medications: (medDel as { changes: number }).changes,
        patients: (patDel as { changes: number }).changes,
        push_subscriptions: (pushDel as { changes: number }).changes,
      }
    });
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
