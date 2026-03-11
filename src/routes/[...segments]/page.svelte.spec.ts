import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';

import Page from './+page.svelte';

describe('/[...segments]/+page.svelte', () => {
	it('renders the splash page and manual redirect link', async () => {
		render(Page, {
			data: {
				targetUrl: 'https://drive.google.com/file/d/abc123/view?usp=drive_link',
				displayPath: '/file/d/abc123/view?usp=drive_link',
				countdownSeconds: 5
			}
		});

		await expect
			.element(page.getByRole('heading', { level: 1, name: 'Redirecting to Google Drive' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('5')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Open now' })).toBeInTheDocument();
		await expect
			.element(page.getByText('https://drive.google.com/file/d/abc123/view?usp=drive_link'))
			.toBeInTheDocument();
	});
});
