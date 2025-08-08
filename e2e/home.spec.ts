import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://api.github.com/users/justinthelaw', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ bio: 'Playwright test bio' }),
    });
  });

  await page.route('https://drive.google.com/file/d/**/preview', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html><body>PDF</body></html>',
    });
  });

  await page.route('https://huggingface.co/**', async route => {
    await route.fulfill({ status: 404, body: '' });
  });
});

test('displays resume and GitHub bio', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Justin Law' })).toBeVisible();
  await expect(page.getByText('Playwright test bio')).toBeVisible();
  await expect(page.locator('iframe[title="Resume PDF"]')).toBeVisible();
});

test('chatbot shows error when model fails to load', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /AI Chatbot/i }).click();
  await expect(
    page.getByPlaceholder('Model failed to load. Please refresh the page.')
  ).toBeVisible();
});
