import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

const REDIRECT_DELAY_SECONDS = 3;
const DRIVE_ORIGIN = 'https://drive.google.com';

export const load: PageServerLoad = async ({ url }) => {
	const trimmedPath = url.pathname.replace(/^\/+/, '');

	if (!trimmedPath) {
		throw error(404, 'Not found');
	}

	const displayPath = `/${trimmedPath}${url.search}`;
	const targetUrl = new URL(displayPath, DRIVE_ORIGIN).toString();

	return {
		targetUrl,
		displayPath,
		countdownSeconds: REDIRECT_DELAY_SECONDS
	};
};
