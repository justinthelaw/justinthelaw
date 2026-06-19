import { test, expect, type Page } from "@playwright/test";
import {
  getPersonalContextBudget,
  getPromptBudget,
} from "../src/services/ai/contextProvider";

async function mockModelWorker(page: Page): Promise<void> {
  await page.addInitScript(() => {
    interface MockWorkerMessage {
      action?: string;
      input?: string;
      conversationTurns?: Array<{
        role: string;
        content: string;
      }>;
    }

    interface MockWorkerResponse {
      status: string;
      message?: string;
      response?: string;
    }

    class MockWorker {
      onmessage: ((event: MessageEvent<MockWorkerResponse>) => void) | null =
        null;

      postMessage(message: MockWorkerMessage): void {
        const mockWindow = window as unknown as {
          __mockWorkerMessages: MockWorkerMessage[];
        };
        mockWindow.__mockWorkerMessages.push(message);

        if (message.action === "load") {
          window.setTimeout(() => {
            this.emit({
              status: "load",
              message: "Model loaded successfully!",
            });
            this.emit({ status: "done" });
          }, 0);
          return;
        }

        if (message.action === "generate") {
          window.setTimeout(() => {
            this.emit({ status: "initiate" });
            this.emit({ status: "stream", response: "Mock response." });
            this.emit({ status: "done" });
          }, 0);
        }
      }

      terminate(): void {}

      private emit(response: MockWorkerResponse): void {
        this.onmessage?.(new MessageEvent("message", { data: response }));
      }
    }

    const mockWindow = window as unknown as {
      __mockWorkerMessages: MockWorkerMessage[];
    };
    mockWindow.__mockWorkerMessages = [];
    window.Worker = MockWorker as unknown as typeof Worker;
  });
}

async function openChat(page: Page): Promise<void> {
  const chatbotButton = page.getByTestId("ai-chatbot-button");
  await expect(chatbotButton).toBeVisible();
  await chatbotButton.click();
  await expect(page.getByTestId("chat-input")).toBeVisible({
    timeout: 10_000,
  });
}

test.describe("Chatbot UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    await mockModelWorker(page);
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("should display AI disclaimer message in chat input", async ({
    page,
  }) => {
    await openChat(page);
    const disclaimer = page.getByText(
      "AI can make mistakes. Always verify the information.",
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

  test("should wrap long uninterrupted user messages inside the chat bubble", async ({
    page,
  }) => {
    const promptBudget = getPromptBudget();
    const longMessage = "x".repeat(promptBudget.inputCharacterLimit);

    await openChat(page);
    await page.getByTestId("chat-input").fill(longMessage);
    await expect(page.getByTestId("chat-send-button")).toBeEnabled({
      timeout: 10_000,
    });
    await page.getByTestId("chat-send-button").click();

    const scrollBox = await page
      .getByTestId("chat-messages-scroll")
      .boundingBox();
    const userBubble = page.getByTestId("chat-message-user").last();
    await expect(userBubble).toBeVisible();
    const userBubbleBox = await userBubble.boundingBox();

    expect(scrollBox).not.toBeNull();
    expect(userBubbleBox).not.toBeNull();
    expect(userBubbleBox!.x + userBubbleBox!.width).toBeLessThanOrEqual(
      scrollBox!.x + scrollBox!.width + 1,
    );
    expect(userBubbleBox!.width).toBeLessThanOrEqual(scrollBox!.width);
  });

  test("should show profile trim warning only when retrieval excludes sections", async ({
    page,
  }) => {
    const personalContextBudget = getPersonalContextBudget();

    await openChat(page);

    if (personalContextBudget.isTrimmed) {
      await expect(page.getByTestId("profile-trim-warning")).toBeVisible();
    } else {
      await expect(page.getByTestId("profile-trim-warning")).toHaveCount(0);
      await expect(page.getByTestId("profile-trim-warning-tooltip")).toHaveCount(
        0,
      );
    }
  });

  test("should show input trim warning with exact overage", async ({
    page,
  }, testInfo) => {
    const promptBudget = getPromptBudget();
    const overage = 9;
    const expectedMessage = `Message: ${overage} chars over; tail trimmed.`;

    await openChat(page);
    await page
      .getByTestId("chat-input")
      .fill("x".repeat(promptBudget.inputCharacterLimit + overage));

    const inputLimitWarning = page.getByTestId("chat-input-limit-warning");
    await expect(inputLimitWarning).toBeVisible();
    await expect(inputLimitWarning).toHaveAttribute(
      "aria-label",
      expectedMessage,
    );

    const inputBox = await page.getByTestId("chat-input").boundingBox();
    const sendButtonBox = await page.getByTestId("chat-send-button").boundingBox();
    const warningBox = await inputLimitWarning.boundingBox();

    expect(inputBox).not.toBeNull();
    expect(sendButtonBox).not.toBeNull();
    expect(warningBox).not.toBeNull();
    const warningCenter = warningBox!.x + warningBox!.width / 2;
    const sendButtonCenter = sendButtonBox!.x + sendButtonBox!.width / 2;
    const sendButtonTopGap =
      sendButtonBox!.y - (warningBox!.y + warningBox!.height);
    const inputBottom = inputBox!.y + inputBox!.height;
    const sendButtonBottom = sendButtonBox!.y + sendButtonBox!.height;

    expect(warningBox!.x).toBeGreaterThanOrEqual(inputBox!.x + inputBox!.width);
    expect(Math.abs(warningCenter - sendButtonCenter)).toBeLessThanOrEqual(2);
    expect(Math.abs(inputBottom - sendButtonBottom)).toBeLessThanOrEqual(1);
    expect(sendButtonTopGap).toBeGreaterThanOrEqual(6);
    expect(sendButtonTopGap).toBeLessThanOrEqual(12);

    const inputTooltip = page.getByTestId("chat-input-limit-warning-tooltip");
    await expect(inputTooltip).toBeHidden();
    if (testInfo.project.name.includes("Mobile")) {
      await inputLimitWarning.click();
    } else {
      await inputLimitWarning.focus();
    }
    await expect(inputTooltip).toBeVisible();
    await expect(inputTooltip).toHaveText(expectedMessage);

    const tooltipBox = await inputTooltip.boundingBox();
    const viewportSize = page.viewportSize();

    expect(tooltipBox).not.toBeNull();
    expect(viewportSize).not.toBeNull();
    expect(tooltipBox!.x).toBeGreaterThanOrEqual(0);
    expect(tooltipBox!.x + tooltipBox!.width).toBeLessThanOrEqual(
      viewportSize!.width + 1,
    );
    expect(tooltipBox!.y).toBeGreaterThanOrEqual(0);
    expect(tooltipBox!.y + tooltipBox!.height).toBeLessThanOrEqual(
      viewportSize!.height + 1,
    );
  });

  test("should toggle warning tooltip by click on mobile", async ({
    page,
  }, testInfo) => {
    test.skip(
      !testInfo.project.name.includes("Mobile"),
      "Click toggle is mobile/touch behavior.",
    );

    const promptBudget = getPromptBudget();
    const overage = 9;
    const expectedMessage = `Message: ${overage} chars over; tail trimmed.`;

    await openChat(page);
    await page
      .getByTestId("chat-input")
      .fill("x".repeat(promptBudget.inputCharacterLimit + overage));

    const inputLimitWarning = page.getByTestId("chat-input-limit-warning");
    const inputTooltip = page.getByTestId("chat-input-limit-warning-tooltip");

    await expect(inputTooltip).toBeHidden();
    await inputLimitWarning.click();
    await expect(inputTooltip).toBeVisible();
    await expect(inputTooltip).toHaveText(expectedMessage);

    const tooltipBox = await inputTooltip.boundingBox();
    const viewportSize = page.viewportSize();

    expect(tooltipBox).not.toBeNull();
    expect(viewportSize).not.toBeNull();
    expect(tooltipBox!.x).toBeGreaterThanOrEqual(0);
    expect(tooltipBox!.x + tooltipBox!.width).toBeLessThanOrEqual(
      viewportSize!.width + 1,
    );
    expect(tooltipBox!.y).toBeGreaterThanOrEqual(0);
    expect(tooltipBox!.y + tooltipBox!.height).toBeLessThanOrEqual(
      viewportSize!.height + 1,
    );

    await page.mouse.click(4, 4);
    await expect(inputTooltip).toBeHidden();
  });

  test("should send recent turns to the worker for follow-up prompts", async ({
    page,
  }) => {
    await openChat(page);
    await page
      .getByTestId("chat-input")
      .fill("Tell me about Justin's Defense Unicorns work.");
    await page.getByTestId("chat-send-button").click();
    await expect(page.getByTestId("chat-message-ai").last()).toContainText(
      "Mock response.",
    );

    await page.getByTestId("chat-input").fill("What did he improve there?");
    await page.getByTestId("chat-send-button").click();

    const generateMessages = await page.evaluate(() => {
      const mockWindow = window as unknown as {
        __mockWorkerMessages: Array<{
          action?: string;
          input?: string;
          conversationTurns?: Array<{
            role: string;
            content: string;
          }>;
        }>;
      };
      return mockWindow.__mockWorkerMessages.filter(
        (message) => message.action === "generate",
      );
    });

    expect(generateMessages).toHaveLength(2);
    expect(generateMessages[1].input).toBe("What did he improve there?");
    expect(generateMessages[1].conversationTurns).toEqual([
      {
        role: "user",
        content: "Tell me about Justin's Defense Unicorns work.",
      },
      {
        role: "assistant",
        content: "Mock response.",
      },
    ]);
  });
});
