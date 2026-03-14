import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

const SOURCE_PREFIX = 'https://drive-google.link/';
const TARGET_PREFIX = 'https://drive.google.com/';

export const load: PageServerLoad = async () => {
  const result = await db.execute(
    'SELECT id, identity_id, ip, request_url, referer, created_at FROM downloads ORDER BY created_at DESC'
  );

  const entries = result.rows.map((row) => ({
    id: row.id as number,
    identityId: row.identity_id as number,
    ip: row.ip as string,
    requestUrl: (row.request_url as string).replace(SOURCE_PREFIX, TARGET_PREFIX),
    referer: row.referer as string | null,
    createdAt: row.created_at as string
  }));

  return { entries };
};
