import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return json({ error: 'ID inválido' }, { status: 400 });
  }
  try {
    const result = await db.execute({
      sql: 'SELECT content FROM identities WHERE id = ?',
      args: [id]
    });
    if (result.rows.length === 0) {
      return json({ error: 'Identidad no encontrada' }, { status: 404 });
    }
    return json({ content: result.rows[0].content as string });
  } catch (err) {
    console.error('Identity fetch error:', err);
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
};
