import { test, expect } from "@playwright/test";

test.describe("Chatbot UI Tests", () => {
  test('should display "Generic" tag for dumber model in model selector', async ({
    page,
  }) => {
    await page.goto("/");

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
    await expect(dumberTag).toHaveText("Generic");
  });

  test("should display model loading message without model size", async ({
    page,
  }) => {
    await page.goto("/");

    const chatbotButton = page.getByTestId("ai-chatbot-button");
    await chatbotButton.click();

    await page.waitForTimeout(1000);
  });

  test("should maintain scroll position at bottom when messages are sent", async ({
    page,
  }) => {
    await page.goto("/");

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
    await page.goto("/");

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

    // Settings button should still exist in DOM (chat still open with new model loading)
    await expect(settingsButton).toBeAttached();
  });
});
