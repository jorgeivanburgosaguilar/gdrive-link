import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

export const db = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN
});

export async function initDb() {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS identities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL
    )`,
      `CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identity_id INTEGER NOT NULL,
      ip TEXT NOT NULL,
      request_url TEXT NOT NULL,
      referer TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (identity_id) REFERENCES identities(id)
    )`
    ],
    'write'
  );
}
