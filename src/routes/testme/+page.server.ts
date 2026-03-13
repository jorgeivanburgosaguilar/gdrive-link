import type { PageServerLoad } from './$types';

const HEADER_LABELS: Record<string, string> = {
  'user-agent': 'User-Agent',
  accept: 'Accept',
  'accept-language': 'Accept-Language',
  'accept-encoding': 'Accept-Encoding',
  connection: 'Connection',
  'cache-control': 'Cache-Control',
  referer: 'Referer',
  dnt: 'Do Not Track',
  'upgrade-insecure-requests': 'Upgrade-Insecure-Requests',
  'sec-fetch-site': 'Sec-Fetch-Site',
  'sec-fetch-mode': 'Sec-Fetch-Mode',
  'sec-fetch-user': 'Sec-Fetch-User',
  'sec-fetch-dest': 'Sec-Fetch-Dest'
};

const EXPOSED_HEADERS = Object.keys(HEADER_LABELS);

export const load: PageServerLoad = async ({ request, url, getClientAddress }) => {
  const requestHeaders = EXPOSED_HEADERS.map((name) => ({
    key: name,
    label: HEADER_LABELS[name],
    value: request.headers.get(name) ?? 'Unavailable'
  }));

  let clientIp = 'Unavailable';
  try {
    clientIp = getClientAddress();
  } catch {
    clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'Unavailable';
  }

  return {
    requestHeaders,
    requestUrl: url.toString(),
    host: url.host,
    protocol: url.protocol.replace(':', ''),
    clientIp
  };
};
