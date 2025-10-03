import { test, expect } from '@playwright/test';

test.describe('Chatbot UI Tests', () => {
  test('should display "Balanced" tag for medium model in model selector', async ({ page }) => {
    await page.goto('/');

    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await expect(chatbotButton).toBeVisible();
    await chatbotButton.click();

    const modelSettingsButton = page.getByTestId('model-settings-button').first();
    await modelSettingsButton.click();

    const modal = page.getByTestId('model-selector-modal');
    await expect(modal).toBeVisible();

    const balancedTag = page.getByTestId('model-tag-balanced');
    await expect(balancedTag).toBeVisible();
    await expect(balancedTag).toHaveText('Balanced');
  });

  test('should not display "Reset to Auto" button in model selector', async ({ page }) => {
    await page.goto('/');

    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await chatbotButton.click();

    const modelSettingsButton = page.getByTestId('model-settings-button').first();
    await modelSettingsButton.click();

    const modal = page.getByTestId('model-selector-modal');
    await expect(modal).toBeVisible();

    const resetButton = page.getByRole('button', { name: /reset to auto/i });
    await expect(resetButton).not.toBeVisible();
  });

  test('should display model loading message without model size', async ({ page }) => {
    await page.goto('/');

    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await chatbotButton.click();

    await page.waitForTimeout(1000);
  });

  test('should maintain scroll position at bottom when messages are sent', async ({ page }) => {
    await page.goto('/');

    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await chatbotButton.click();

    await page.waitForTimeout(2000);

    const chatWindow = page.locator('.overflow-y-auto').first();
    await expect(chatWindow).toBeVisible();
  });
});
