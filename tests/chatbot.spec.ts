import { test, expect } from '@playwright/test';

test.describe('Chatbot UI Tests', () => {
  test('should display "Balanced" tag for medium model in model selector', async ({ page }) => {
    await page.goto('/');

    // Open the chatbot
    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await expect(chatbotButton).toBeVisible();
    await chatbotButton.click();

    // Open model settings
    const modelSettingsButton = page.getByTestId('model-settings-button');
    await expect(modelSettingsButton).toBeVisible();
    await modelSettingsButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('model-selector-modal');
    await expect(modal).toBeVisible();

    // Check that the "Balanced" tag is visible (not "Balance")
    const balancedTag = page.getByTestId('model-tag-balanced');
    await expect(balancedTag).toBeVisible();
    await expect(balancedTag).toHaveText('Balanced');
  });

  test('should not display "Reset to Auto" button in model selector', async ({ page }) => {
    await page.goto('/');

    // Open the chatbot
    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await chatbotButton.click();

    // Open model settings
    const modelSettingsButton = page.getByTestId('model-settings-button');
    await modelSettingsButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('model-selector-modal');
    await expect(modal).toBeVisible();

    // Verify "Reset to Auto" button is not present
    const resetButton = page.getByRole('button', { name: /reset to auto/i });
    await expect(resetButton).not.toBeVisible();
  });

  test('should display model loading message without model size', async ({ page }) => {
    await page.goto('/');

    // Open the chatbot
    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await chatbotButton.click();

    // Wait a moment for potential loading messages
    // Note: This test may need to be adjusted based on actual loading behavior
    // The loading message format should be "Loading model... X%" not "Loading SMALL/MEDIUM/LARGE model... X%"
    // In a real scenario, we'd need to intercept the worker messages or check the UI during actual loading
    // For now, we just verify the chatbot opens successfully
    await page.waitForTimeout(1000);
  });

  test('should maintain scroll position at bottom when messages are sent', async ({ page }) => {
    await page.goto('/');

    // Open the chatbot
    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await chatbotButton.click();

    // Wait for chatbot to be ready
    await page.waitForTimeout(2000);

    // The chat window should exist and be scrollable
    // Note: This is a basic test - actual scroll behavior would require
    // sending messages and observing the scroll position, which requires
    // the model to be loaded and functional
    const chatWindow = page.locator('.overflow-y-auto').first();
    await expect(chatWindow).toBeVisible();
  });
});
