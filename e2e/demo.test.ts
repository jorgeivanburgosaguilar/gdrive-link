import { expect, test } from '@playwright/test';

test('/testme page has expected h1', async ({ page }) => {
	await page.goto('/testme');
	await expect(
		page.getByRole('heading', { level: 1, name: 'Session fingerprint form' })
	).toBeVisible();
	await expect(page.getByRole('button', { name: 'Refresh current session' })).toBeVisible();
});

test('drive short-link splash shows the mapped Google Drive destination', async ({ page }) => {
	await page.goto('/file/d/1qFt2fhknhixoMDQ1pLivc6e0LmyRtXM_/view?usp=drive_link');
	await expect(
		page.getByRole('heading', { level: 1, name: 'Redirecting to Google Drive' })
	).toBeVisible();
	await expect(page.getByRole('button', { name: 'Open now' })).toBeVisible();
	await expect(page.locator('form.actions')).toHaveAttribute(
		'action',
		'https://drive.google.com/file/d/1qFt2fhknhixoMDQ1pLivc6e0LmyRtXM_/view?usp=drive_link'
	);
});
