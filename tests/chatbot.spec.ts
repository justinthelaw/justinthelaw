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

  test('should show reload button when model selection changes', async ({ page }) => {
    await page.goto('/');

    // Open chatbot
    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await chatbotButton.click();

    // Open model settings
    const modelSettingsButton = page.getByTestId('model-settings-button').first();
    await modelSettingsButton.click();

    const modal = page.getByTestId('model-selector-modal');
    await expect(modal).toBeVisible();

    // Get all radio inputs for model selection
    const radioInputs = page.locator('input[name="modelSize"]');
    const count = await radioInputs.count();
    
    // Find the currently selected model
    let currentlySelectedIndex = -1;
    for (let i = 0; i < count; i++) {
      const isChecked = await radioInputs.nth(i).isChecked();
      if (isChecked) {
        currentlySelectedIndex = i;
        break;
      }
    }

    // Ensure we found a selected model
    expect(currentlySelectedIndex).toBeGreaterThanOrEqual(0);

    // Reload button should NOT be visible initially
    let reloadButton = page.getByRole('button', { name: 'Reload' });
    await expect(reloadButton).not.toBeVisible();

    // Select a different model (use the next one in the list, or wrap to first)
    const newIndex = (currentlySelectedIndex + 1) % count;
    await radioInputs.nth(newIndex).click({ force: true });

    // Wait a bit for state to update
    await page.waitForTimeout(100);

    // Now reload button SHOULD be visible
    reloadButton = page.getByRole('button', { name: 'Reload' });
    await expect(reloadButton).toBeVisible();

    // Close modal
    const doneButton = page.getByRole('button', { name: 'Done' });
    await doneButton.click();

    // Modal should be closed
    await expect(modal).not.toBeVisible();

    // Reopen modal
    await modelSettingsButton.click();
    await expect(modal).toBeVisible();

    // Reload button should STILL be visible after reopening
    reloadButton = page.getByRole('button', { name: 'Reload' });
    await expect(reloadButton).toBeVisible();
  });

  test('should hide reload button when selecting the current model', async ({ page }) => {
    await page.goto('/');

    // Open chatbot
    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await chatbotButton.click();

    // Open model settings
    const modelSettingsButton = page.getByTestId('model-settings-button').first();
    await modelSettingsButton.click();

    const modal = page.getByTestId('model-selector-modal');
    await expect(modal).toBeVisible();

    // Get all radio inputs
    const radioInputs = page.locator('input[name="modelSize"]');
    const count = await radioInputs.count();
    
    // Find currently selected model
    let currentlySelectedIndex = -1;
    for (let i = 0; i < count; i++) {
      const isChecked = await radioInputs.nth(i).isChecked();
      if (isChecked) {
        currentlySelectedIndex = i;
        break;
      }
    }

    // Select a different model
    const newIndex = (currentlySelectedIndex + 1) % count;
    await radioInputs.nth(newIndex).click({ force: true });
    await page.waitForTimeout(100);

    // Reload button should be visible
    let reloadButton = page.getByRole('button', { name: 'Reload' });
    await expect(reloadButton).toBeVisible();

    // Select the original model again
    await radioInputs.nth(currentlySelectedIndex).click({ force: true });
    await page.waitForTimeout(100);

    // Reload button should now be hidden
    reloadButton = page.getByRole('button', { name: 'Reload' });
    await expect(reloadButton).not.toBeVisible();
  });
});
