import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { createHash, timingSafeEqual } from 'crypto';

export const load: PageServerLoad = ({ locals }) => {
  if (locals.authenticated) redirect(303, '/auditlog');
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const password = String(data.get('password') ?? '');

    const submitted = createHash('sha256').update(password).digest('hex');
    const expected = createHash('sha256').update(env.ADMIN_PASSWORD).digest('hex');
    const valid =
      submitted.length === expected.length &&
      timingSafeEqual(Buffer.from(submitted), Buffer.from(expected));

    if (!valid) return fail(400, { error: 'Contraseña incorrecta' });

    cookies.set('session', expected, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      maxAge: 60 * 60 * 24 * 7
    });

    redirect(303, '/auditlog');
  }
};
