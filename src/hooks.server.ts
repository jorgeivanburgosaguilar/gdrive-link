import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createHash, timingSafeEqual } from 'crypto';

const PROTECTED_PATHS = ['/auditlog', '/api/identity/'];

function sessionToken(): string {
  return createHash('sha256').update(env.ADMIN_PASSWORD).digest('hex');
}

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));

  if (isProtected) {
    const cookie = event.cookies.get('session') ?? '';
    const expected = sessionToken();
    const valid =
      cookie.length === expected.length &&
      timingSafeEqual(Buffer.from(cookie), Buffer.from(expected));

    if (!valid) {
      if (path.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      redirect(303, '/login');
    }

    event.locals.authenticated = true;
  }

  return resolve(event);
};
