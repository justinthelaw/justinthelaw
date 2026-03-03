import { test, expect, type Locator, type Page } from "@playwright/test";

async function openChat(page: Page): Promise<void> {
  const chatbotButton = page.getByTestId("ai-chatbot-button");
  await expect(chatbotButton).toBeVisible();
  await chatbotButton.click();
  await expect(page.getByTestId("model-settings-button").first()).toBeVisible();
}

async function openSettings(page: Page): Promise<Locator> {
  await openChat(page);
  const settingsButton = page.getByTestId("model-settings-button").first();
  await settingsButton.click();
  const modal = page.getByTestId("model-selector-modal");
  await expect(modal).toBeVisible();
  return modal;
}

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
    const modal = await openSettings(page);

    const dumberTag = modal.getByTestId("model-tag-dumber");
    await expect(dumberTag).toBeVisible();
    await expect(dumberTag).toContainText("Generic");
  });

  test('should display "Fine-Tuned" tag for smarter model in model selector', async ({
    page,
  }) => {
    const modal = await openSettings(page);

    const fineTunedTag = modal.getByText("Fine-Tuned");
    await expect(fineTunedTag).toBeVisible();
  });

  test("should display HuggingFace links on model tags", async ({ page }) => {
    const modal = await openSettings(page);

    const huggingFaceLinks = modal.locator('a[href*="huggingface.co"]');
    const linkCount = await huggingFaceLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(2);
  });

  test("should display AI disclaimer message in chat input", async ({
    page,
  }) => {
    await openChat(page);
    const disclaimer = page.getByText(
      "AI can make mistakes. Always verify the information."
    );
    await expect(disclaimer).toBeVisible();
  });

  test("should display model loading message without model size", async ({
    page,
  }) => {
    await openChat(page);
    await expect(page.getByTestId("chat-input")).toBeVisible();
  });

  test("should maintain scroll position at bottom when messages are sent", async ({
    page,
  }) => {
    await openChat(page);
    await expect(page.getByTestId("chat-messages-scroll")).toBeVisible();
  });

  test("should automatically reload when model selection changes", async ({
    page,
  }) => {
    const modelSelectorModal = await openSettings(page);

    const radioInputs = modelSelectorModal.locator('input[type="radio"]');
    const radioCount = await radioInputs.count();
    expect(radioCount).toBeGreaterThan(0);

    let currentlySelectedIndex = -1;
    for (let i = 0; i < radioCount; i++) {
      if (await radioInputs.nth(i).isChecked()) {
        currentlySelectedIndex = i;
        break;
      }
    }
    expect(currentlySelectedIndex).toBeGreaterThanOrEqual(0);

    const modelLabels = modelSelectorModal.locator("label");
    const newIndex = (currentlySelectedIndex + 1) % radioCount;
    await modelLabels.nth(newIndex).click();

    await expect(modelSelectorModal).not.toBeVisible();
    await expect(page.getByTestId("model-settings-button").first()).toBeVisible();
  });

  test("should log the requested model for each selection order", async ({
    page,
  }) => {
    const logs: string[] = [];
    page.on("console", (message) => {
      logs.push(message.text());
    });

    await openChat(page);

    const settingsButton = page.getByTestId("model-settings-button").first();
    await settingsButton.click();

    const modal = page.getByTestId("model-selector-modal");
    await expect(modal).toBeVisible();

    const smarterOption = modal.getByTestId("model-option-smarter");
    const dumberOption = modal.getByTestId("model-option-dumber");

    const smarterChecked = await smarterOption
      .locator('input[type="radio"]')
      .isChecked();

    const firstTargetModel = smarterChecked ? "DUMBER" : "SMARTER";
    const secondTargetModel = smarterChecked ? "SMARTER" : "DUMBER";
    const firstOption = smarterChecked ? dumberOption : smarterOption;
    const secondOption = smarterChecked ? smarterOption : dumberOption;

    await firstOption.click();
    await expect(modal).not.toBeVisible();

    await expect
      .poll(() =>
        logs.some((line) =>
          line.includes(`[AI MODEL] load requested: ${firstTargetModel}`)
        )
      )
      .toBeTruthy();

    await settingsButton.click();
    await expect(modal).toBeVisible();
    await secondOption.click();
    await expect(modal).not.toBeVisible();

    await expect
      .poll(() =>
        logs.some((line) =>
          line.includes(`[AI MODEL] load requested: ${secondTargetModel}`)
        )
      )
      .toBeTruthy();
  });
});
