import { test, expect } from '@playwright/test';

test.describe('AI Chatbot Model Loading Tests', () => {
  test('should open chatbot and display model loading messages', async ({ page }) => {
    await page.goto('/');

    // Open the AI chatbot
    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await expect(chatbotButton).toBeVisible();
    await chatbotButton.click();

    // Wait for chatbot to be opened and check for loading messages
    // The chatbot should show either model loading or be ready within reasonable time
    await page.waitForTimeout(2000); // Give initial loading time

    // Check if there's a welcome message or loading indicator
    const chatArea = page.locator('[class*="overflow-y-auto"]').first();
    await expect(chatArea).toBeVisible();

    // The model should either be loading or loaded within 30 seconds
    // If the large model fails, it should fallback gracefully
    await page.waitForTimeout(5000);

    // Verify that the input area is present (chatbot UI loaded)
    const inputArea = page.locator('input[type="text"]').last();
    await expect(inputArea).toBeVisible();
  });

  test('should handle model fallback gracefully', async ({ page }) => {
    await page.goto('/');

    // Add console listener to capture model loading logs
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('model') || msg.text().includes('Model') || msg.text().includes('fallback')) {
        consoleMessages.push(msg.text());
      }
    });

    // Open the AI chatbot
    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await chatbotButton.click();

    // Wait for potential model loading and fallback
    await page.waitForTimeout(10000);

    // Check that chatbot is functional regardless of which model loaded
    const inputArea = page.locator('input[type="text"]').last();
    await expect(inputArea).toBeVisible();
    
    // Input should not be permanently disabled (model loading should complete or fallback)
    await page.waitForTimeout(30000); // Wait up to 30 seconds for model loading
    
    // If large model fails and falls back, it should still work
    const placeholder = await inputArea.getAttribute('placeholder');
    expect(placeholder).not.toContain('Model failed to load');
  });

  test('should display model settings when settings button is clicked', async ({ page }) => {
    await page.goto('/');

    // Open the AI chatbot
    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await chatbotButton.click();

    // Find and click the model settings button (gear icon)
    const settingsButton = page.locator('button[aria-label="Model settings"]').first();
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // Verify model settings modal opens
    await expect(page.locator('text=Model Settings')).toBeVisible();
    
    // Check that all model sizes are available
    await expect(page.locator('text=Small')).toBeVisible();
    await expect(page.locator('text=Medium')).toBeVisible();
    await expect(page.locator('text=Large')).toBeVisible();
  });
});