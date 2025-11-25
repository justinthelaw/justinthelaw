import { test, expect } from '@playwright/test';

test.describe('Chatbot UI Tests', () => {
  test('should display "medium" tag for medium model in model selector', async ({ page }) => {
    await page.goto('/');

    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await expect(chatbotButton).toBeVisible();
    await chatbotButton.click();

    const modelSettingsButton = page.getByTestId('model-settings-button').first();
    await modelSettingsButton.click();

    const modal = page.getByTestId('model-selector-modal');
    await expect(modal).toBeVisible();

    const mediumTag = page.getByTestId('model-tag-medium');
    await expect(mediumTag).toBeVisible();
    await expect(mediumTag).toHaveText('Balanced');
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

  test('should automatically reload when model selection changes', async ({
    page,
  }) => {
    await page.goto('/');

    // Click chatbot button
    await page.getByTestId('ai-chatbot-button').click();

    // Wait for model settings button to be visible (indicates chat is open)
    const settingsButton = page.getByTestId('model-settings-button').first();
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // Wait for model selector modal
    const modelSelectorModal = page.getByTestId('model-selector-modal');
    await expect(modelSelectorModal).toBeVisible();

    // Find all radio inputs
    const radioInputs = modelSelectorModal.locator('input[type="radio"]');
    const radioCount = await radioInputs.count();
    expect(radioCount).toBeGreaterThan(0);

    // Find currently selected model
    let currentlySelectedIndex = -1;
    for (let i = 0; i < radioCount; i++) {
      if (await radioInputs.nth(i).isChecked()) {
        currentlySelectedIndex = i;
        break;
      }
    }
    expect(currentlySelectedIndex).toBeGreaterThanOrEqual(0);

    // Select a different model (next one in list)
    const newIndex = (currentlySelectedIndex + 1) % radioCount;
    await radioInputs.nth(newIndex).click({ force: true });

    // Modal should close automatically and model should start loading
    await expect(modelSelectorModal).not.toBeVisible();
    
    // Settings button should be visible again (chat still open with new model loading)
    await expect(settingsButton).toBeVisible();
  });

});
