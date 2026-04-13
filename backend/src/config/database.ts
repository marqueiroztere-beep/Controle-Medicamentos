// Node.js v22.5+ has a built-in SQLite module (stable in v24)
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH  = path.join(DATA_DIR, 'medications.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Performance optimizations
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA synchronous = NORMAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS medications (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           TEXT    NOT NULL,
    dosage         REAL    NOT NULL,
    unit           TEXT    NOT NULL,
    instructions   TEXT,
    frequency_type TEXT    NOT NULL DEFAULT 'interval',
    interval_hours REAL,
    daily_times    TEXT,
    specific_days  TEXT,
    start_time     TEXT    NOT NULL,
    start_date     TEXT    NOT NULL,
    end_date       TEXT,
    status         TEXT    NOT NULL DEFAULT 'active',
    deleted_at     TEXT,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agenda_items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    medication_id INTEGER NOT NULL REFERENCES medications(id),
    user_id       INTEGER NOT NULL REFERENCES users(id),
    scheduled_at  TEXT    NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'pending',
    taken_at      TEXT,
    postponed_to  TEXT,
    note          TEXT,
    notified_at   TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(medication_id, scheduled_at)
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint   TEXT    NOT NULL UNIQUE,
    p256dh     TEXT    NOT NULL,
    auth       TEXT    NOT NULL,
    user_agent TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_agenda_user_scheduled ON agenda_items(user_id, scheduled_at);
  CREATE INDEX IF NOT EXISTS idx_agenda_medication     ON agenda_items(medication_id);
  CREATE INDEX IF NOT EXISTS idx_agenda_status         ON agenda_items(status);
  CREATE INDEX IF NOT EXISTS idx_medications_user      ON medications(user_id);
  CREATE INDEX IF NOT EXISTS idx_push_user             ON push_subscriptions(user_id);
`);

console.log('Database initialized at:', DB_PATH);

export default db;
