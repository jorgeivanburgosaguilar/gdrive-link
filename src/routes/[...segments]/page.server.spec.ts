import { describe, expect, it } from 'vitest';

import { load } from './+page.server';

type LoadResult = {
	displayPath: string;
	targetUrl: string;
	countdownSeconds: number;
};

describe('/[...segments]/+page.server', () => {
	it('maps file links to the Google Drive domain', async () => {
		const result = (await load({
			url: new URL(
				'https://short.test/file/d/1qFt2fhknhixoMDQ1pLivc6e0LmyRtXM_/view?usp=drive_link'
			)
		} as Parameters<typeof load>[0])) as LoadResult;

		expect(result.displayPath).toBe(
			'/file/d/1qFt2fhknhixoMDQ1pLivc6e0LmyRtXM_/view?usp=drive_link'
		);
		expect(result.targetUrl).toBe(
			'https://drive.google.com/file/d/1qFt2fhknhixoMDQ1pLivc6e0LmyRtXM_/view?usp=drive_link'
		);
		expect(result.countdownSeconds).toBe(5);
	});

	it('maps folder links to the Google Drive domain', async () => {
		const result = (await load({
			url: new URL(
				'https://short.test/drive/folders/1f24yH-BAhaAbzXA1Rc8LJ3CmteYz7W28?usp=drive_link'
			)
		} as Parameters<typeof load>[0])) as LoadResult;

		expect(result.targetUrl).toBe(
			'https://drive.google.com/drive/folders/1f24yH-BAhaAbzXA1Rc8LJ3CmteYz7W28?usp=drive_link'
		);
	});
});
