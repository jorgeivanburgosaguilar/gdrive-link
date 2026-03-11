import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/testme/+page.svelte', () => {
	it('should render the session fingerprint heading', async () => {
		render(Page, {
			data: {
				requestHeaders: [],
				requestUrl: 'http://localhost/testme',
				host: 'localhost',
				protocol: 'http'
			}
		});

		const heading = page.getByRole('heading', { level: 1, name: 'Session fingerprint form' });
		await expect.element(heading).toBeInTheDocument();
	});
});
