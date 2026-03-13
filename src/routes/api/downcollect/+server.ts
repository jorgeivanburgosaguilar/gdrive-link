import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, initDb } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    const body = await request.text();
    const { hash, browser, referer } = JSON.parse(Buffer.from(body, 'base64').toString('utf-8'));

    if (!hash || !browser) {
      return json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const content = JSON.stringify(browser);

    await initDb();

    let identityId: number;
    let isNew = false;

    const existing = await db.execute({
      sql: 'SELECT id FROM identities WHERE hash = ?',
      args: [hash]
    });

    if (existing.rows.length > 0) {
      identityId = existing.rows[0].id as number;
    } else {
      const inserted = await db.execute({
        sql: 'INSERT INTO identities (hash, content) VALUES (?, ?)',
        args: [hash, content]
      });
      identityId = Number(inserted.lastInsertRowid);
      isNew = true;
    }

    let ip = 'unknown';
    try {
      ip = getClientAddress();
    } catch {
      ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    }

    const requestUrl = request.headers.get('referer') ?? request.url;

    await db.execute({
      sql: 'INSERT INTO downloads (identity_id, ip, request_url, referer) VALUES (?, ?, ?, ?)',
      args: [identityId, ip, requestUrl, referer ?? null]
    });

    return json({ identityId, isNew });
  } catch (error) {
    console.error('Fingerprint endpoint error:', error);
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
};
