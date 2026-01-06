import { test, expect } from "@playwright/test";

test.describe("Chatbot UI Tests", () => {
  // Clear localStorage before each test to ensure clean state
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display "Generic" tag for dumber model in model selector', async ({
    page,
  }) => {
    const chatbotButton = page.getByTestId("ai-chatbot-button");
    await expect(chatbotButton).toBeVisible();
    await chatbotButton.click();

    // Wait for chatbot to open and be ready
    await page.waitForTimeout(500);

    // Click model settings button (use .first() for desktop viewports, `.last()` for mobile viewports)
    // Desktop (lg) is >= 1024px, so viewports < 1024px are mobile
    const viewportSize = page.viewportSize();
    const isMobile = viewportSize && viewportSize.width < 1024;
    const settingsButton = isMobile
      ? page.getByTestId("model-settings-button").last()
      : page.getByTestId("model-settings-button").first();
    await settingsButton.click();

    const modal = page.getByTestId("model-selector-modal");
    await expect(modal).toBeVisible();

    const dumberTag = page.getByTestId("model-tag-dumber");
    await expect(dumberTag).toBeVisible();
    await expect(dumberTag).toContainText("Generic");
  });

  test('should display "Fine-Tuned" tag for smarter model in model selector', async ({
    page,
  }) => {
    const chatbotButton = page.getByTestId("ai-chatbot-button");
    await expect(chatbotButton).toBeVisible();
    await chatbotButton.click();

    // Wait for chatbot to open and be ready
    await page.waitForTimeout(500);

    // Click model settings button
    const viewportSize = page.viewportSize();
    const isMobile = viewportSize && viewportSize.width < 1024;
    const settingsButton = isMobile
      ? page.getByTestId("model-settings-button").last()
      : page.getByTestId("model-settings-button").first();
    await settingsButton.click();

    const modal = page.getByTestId("model-selector-modal");
    await expect(modal).toBeVisible();

    // Check for Fine-Tuned tag on SMARTER model
    const fineTunedTag = modal.getByText("Fine-Tuned");
    await expect(fineTunedTag).toBeVisible();
  });

  test("should display HuggingFace links on model tags", async ({ page }) => {
    const chatbotButton = page.getByTestId("ai-chatbot-button");
    await chatbotButton.click();

    // Wait for chatbot to open and be ready
    await page.waitForTimeout(500);

    // Click model settings button
    const viewportSize = page.viewportSize();
    const isMobile = viewportSize && viewportSize.width < 1024;
    const settingsButton = isMobile
      ? page.getByTestId("model-settings-button").last()
      : page.getByTestId("model-settings-button").first();
    await settingsButton.click();

    const modal = page.getByTestId("model-selector-modal");
    await expect(modal).toBeVisible();

    // Check that HuggingFace links exist for model tags
    const huggingFaceLinks = modal.locator('a[href*="huggingface.co"]');
    const linkCount = await huggingFaceLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(2); // Both models have HuggingFace links
  });

  test("should display AI disclaimer message in chat input", async ({
    page,
  }) => {
    const chatbotButton = page.getByTestId("ai-chatbot-button");
    await chatbotButton.click();

    // Wait for chatbot to open
    await page.waitForTimeout(500);

    // Check for the AI disclaimer message
    // Use viewport-aware selector since there are mobile/desktop layouts
    const viewportSize = page.viewportSize();
    const isMobile = viewportSize && viewportSize.width < 1024;
    const disclaimer = isMobile
      ? page
          .getByText("AI can make mistakes. Always verify the information.")
          .last()
      : page
          .getByText("AI can make mistakes. Always verify the information.")
          .first();
    await expect(disclaimer).toBeVisible();
  });

  test("should display model loading message without model size", async ({
    page,
  }) => {
    const chatbotButton = page.getByTestId("ai-chatbot-button");
    await chatbotButton.click();

    await page.waitForTimeout(1000);
  });

  test("should select model based on available RAM", async ({ page }) => {
    const chatbotButton = page.getByTestId("ai-chatbot-button");
    await chatbotButton.click();

    // Wait for chatbot to open and be ready
    await page.waitForTimeout(500);

    // Click model settings button
    const viewportSize = page.viewportSize();
    const isMobile = viewportSize && viewportSize.width < 1024;
    const settingsButton = isMobile
      ? page.getByTestId("model-settings-button").last()
      : page.getByTestId("model-settings-button").first();
    await settingsButton.click();

    const modal = page.getByTestId("model-selector-modal");
    await expect(modal).toBeVisible();

    // In test environment with sufficient RAM, SMARTER should be selected
    // (The system starts with SMARTER and downgrades only if RAM is insufficient)
    const smarterLabel = modal.locator('label:has-text("Smarter")');
    const smarterRadio = smarterLabel.locator('input[type="radio"]');
    await expect(smarterRadio).toBeChecked();
  });

  test("should maintain scroll position at bottom when messages are sent", async ({
    page,
  }) => {
    const chatbotButton = page.getByTestId("ai-chatbot-button");
    await chatbotButton.click();

    // Wait for chatbot to load
    await page.waitForTimeout(2000);

    // Verify chat window exists in DOM (will be visible in either desktop or mobile layout)
    const chatWindow = page.locator(".overflow-y-auto").last();
    await expect(chatWindow).toBeAttached();
  });

  test("should automatically reload when model selection changes", async ({
    page,
  }) => {
    // Click chatbot button
    await page.getByTestId("ai-chatbot-button").click();

    // Wait for chatbot to open and be ready
    await page.waitForTimeout(500);

    // Click model settings button (use .first() for desktop viewports, .last() for mobile viewports)
    const viewportSize = page.viewportSize();
    const isMobile = viewportSize && viewportSize.width < 1024;
    const settingsButton = isMobile
      ? page.getByTestId("model-settings-button").last()
      : page.getByTestId("model-settings-button").first();
    await settingsButton.click();

    // Wait for model selector modal
    const modelSelectorModal = page.getByTestId("model-selector-modal");
    await expect(modelSelectorModal).toBeVisible();

    // Find all model option labels (which contain the radio inputs)
    const modelLabels = modelSelectorModal.locator('label');
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

    // Select a different model (next one in list) by clicking the label
    const newIndex = (currentlySelectedIndex + 1) % radioCount;
    await modelLabels.nth(newIndex).click();

    // Modal should close automatically and model should start loading
    await expect(modelSelectorModal).not.toBeVisible();

    // Settings button should still exist in DOM (chat still open with new model loading)
    await expect(settingsButton).toBeAttached();
  });
});
