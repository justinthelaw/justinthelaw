import { test, expect, type Page } from "@playwright/test";

const VISUALIZER_QUESTION = "What role does Justin have at OpenAI?";
const MOCK_ANSWER = "Justin currently works at OpenAI.";
const HELD_LOADING_MESSAGE = "Downloading model... 42%";
const HOLD_MODEL_LOADING_SESSION_KEY = "__holdVisualizerModelLoading";

interface MockWorkerMessage {
  action?: string;
  input?: string;
  conversationTurns?: Array<{
    role: string;
    content: string;
  }>;
}

interface MockWorkerInitOptions {
  answer: string;
  heldLoadingMessage: string;
  holdModelLoadingSessionKey: string;
}

async function mockModelWorker(page: Page): Promise<void> {
  await page.addInitScript((options: MockWorkerInitOptions) => {
    interface LocalMockWorkerMessage {
      action?: string;
      input?: string;
      conversationTurns?: Array<{
        role: string;
        content: string;
      }>;
    }

    interface LocalMockWorkerResponse {
      status: string;
      message?: string;
      response?: string;
      progress?: number;
    }

    class MockWorker {
      onmessage: ((event: MessageEvent<LocalMockWorkerResponse>) => void) | null =
        null;

      postMessage(message: LocalMockWorkerMessage): void {
        const mockWindow = window as unknown as {
          __mockWorkerMessages: LocalMockWorkerMessage[];
        };
        mockWindow.__mockWorkerMessages.push(message);

        if (message.action === "load") {
          if (
            window.sessionStorage.getItem(options.holdModelLoadingSessionKey) ===
            "true"
          ) {
            window.setTimeout(() => {
              this.emit({
                status: "load",
                message: options.heldLoadingMessage,
                progress: 42,
              });
            }, 10);
            return;
          }

          window.setTimeout(() => {
            this.emit({
              status: "load",
              message: "Downloading model... 42%",
              progress: 42,
            });
            this.emit({
              status: "load",
              message: "Model loaded successfully!",
              progress: 100,
            });
            this.emit({ status: "done" });
          }, 10);
          return;
        }

        if (message.action === "generate") {
          window.setTimeout(() => {
            this.emit({ status: "initiate" });
            this.emit({ status: "stream", response: "Justin currently " });
            this.emit({ status: "stream", response: "works at OpenAI." });
            this.emit({ status: "done" });
          }, 10);
        }
      }

      terminate(): void {}

      private emit(response: LocalMockWorkerResponse): void {
        this.onmessage?.(new MessageEvent("message", { data: response }));
      }
    }

    const mockWindow = window as unknown as {
      __mockWorkerMessages: LocalMockWorkerMessage[];
      __mockAnswer: string;
    };
    mockWindow.__mockWorkerMessages = [];
    mockWindow.__mockAnswer = options.answer;
    window.Worker = MockWorker as unknown as typeof Worker;
  }, {
    answer: MOCK_ANSWER,
    heldLoadingMessage: HELD_LOADING_MESSAGE,
    holdModelLoadingSessionKey: HOLD_MODEL_LOADING_SESSION_KEY,
  });
}

async function openVisualizer(page: Page): Promise<void> {
  await page.getByTestId("ai-chatbot-button").click();
  await expect(page.getByTestId("chat-input")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId("profile-visualizer-button")).toBeEnabled({
    timeout: 10_000,
  });
  await page.getByTestId("profile-visualizer-button").click();
  await expect(page.getByTestId("profile-visualizer-modal")).toBeVisible();
}

async function getTraceCardCenterDelta(
  page: Page,
  stageId: string
): Promise<number> {
  return page.evaluate((nextStageId) => {
    const traceList = document.querySelector(
      '[data-testid="profile-visualizer-trace-list"]'
    );
    const traceCard = document.querySelector(
      `[data-testid="profile-visualizer-transform-${nextStageId}"]`
    );

    if (!traceList || !traceCard) {
      return Number.POSITIVE_INFINITY;
    }

    const traceListRect = traceList.getBoundingClientRect();
    const traceCardRect = traceCard.getBoundingClientRect();
    const traceListCenter = traceListRect.top + traceListRect.height / 2;
    const traceCardCenter = traceCardRect.top + traceCardRect.height / 2;

    return Math.abs(traceCardCenter - traceListCenter);
  }, stageId);
}

test.describe("LLM Visualizer", () => {
  test.beforeEach(async ({ page }) => {
    await mockModelWorker(page);
    await page.goto("/");
  });

  test("opens, closes with Escape, and returns focus to the trigger", async ({
    page,
  }) => {
    const chatButton = page.getByTestId("ai-chatbot-button");
    await chatButton.click();
    await expect(page.getByTestId("chat-input")).toBeVisible({
      timeout: 10_000,
    });
    const trigger = page.getByTestId("profile-visualizer-button");
    await expect(trigger).toBeEnabled({
      timeout: 10_000,
    });
    await trigger.focus();
    await page.keyboard.press("Enter");

    const modal = page.getByTestId("profile-visualizer-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");

    await page.keyboard.press("Escape");
    await expect(modal).toHaveCount(0);
    await expect(chatButton).toBeFocused();
  });

  test("keeps tab focus contained inside the modal", async ({ page }) => {
    await openVisualizer(page);

    for (let index = 0; index < 14; index += 1) {
      await page.keyboard.press("Tab");
      const isFocusInsideModal = await page.evaluate(() => {
        return Boolean(
          document.activeElement?.closest(
            '[data-testid="profile-visualizer-modal"]'
          )
        );
      });
      expect(isFocusInsideModal).toBe(true);
    }
  });

  test("shows header icon tooltips beside the clear button", async ({
    page,
  }) => {
    await page.getByTestId("ai-chatbot-button").click();
    await expect(page.getByTestId("chat-input")).toBeVisible({
      timeout: 10_000,
    });

    const clearButtonBox = await page.getByTestId("chat-clear-button").boundingBox();
    const visualizerButton = page.getByTestId("profile-visualizer-button");
    await expect(visualizerButton).toBeEnabled({
      timeout: 10_000,
    });
    const visualizerButtonBox = await visualizerButton.boundingBox();

    expect(clearButtonBox).not.toBeNull();
    expect(visualizerButtonBox).not.toBeNull();
    expect(
      Math.abs(clearButtonBox!.y - visualizerButtonBox!.y)
    ).toBeLessThanOrEqual(2);
    expect(visualizerButtonBox!.x).toBeGreaterThan(clearButtonBox!.x);

    await expect(page.getByTestId("profile-visualizer-tooltip")).toBeHidden();
    await visualizerButton.focus();
    await expect(page.getByTestId("profile-visualizer-tooltip")).toBeVisible();
    await expect(page.getByTestId("profile-visualizer-tooltip")).toHaveText(
      "LLM Visualizer"
    );

    await visualizerButton.blur();
    await expect(page.getByTestId("chat-clear-tooltip")).toBeHidden();
    await page.getByTestId("chat-clear-button").focus();
    await expect(page.getByTestId("chat-clear-tooltip")).toBeVisible();
    await expect(page.getByTestId("chat-clear-tooltip")).toHaveText(
      "Clear chat history"
    );
  });

  test("shows randomized profile question suggestions", async ({ page }) => {
    await openVisualizer(page);

    const suggestionTexts = await page
      .getByTestId("profile-visualizer-suggestion")
      .allTextContents();

    expect(suggestionTexts).toHaveLength(4);
    expect(new Set(suggestionTexts).size).toBe(suggestionTexts.length);
    suggestionTexts.forEach((suggestion) => {
      expect(suggestion).toMatch(/Justin|OpenAI|Defense Unicorns|recommendations/i);
    });
  });

  test("keeps the question controls unobscured on narrow mobile viewports", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await openVisualizer(page);

    const layout = await page.evaluate(() => {
      const input = document.querySelector(
        '[data-testid="profile-visualizer-question"]'
      );
      const sendButton = document.querySelector(
        '[data-testid="profile-visualizer-play"]'
      );
      const scene = document.querySelector(
        '[data-testid="profile-visualizer-canvas"]'
      );
      const trace = document.querySelector(
        '[data-testid="profile-visualizer-trace-list"]'
      );
      const scenePanel = document.querySelector(
        '[data-testid="profile-visualizer-scene-panel"]'
      );
      const tracePanel = document.querySelector(
        '[data-testid="profile-visualizer-trace-panel"]'
      );

      if (
        !input ||
        !sendButton ||
        !scene ||
        !trace ||
        !scenePanel ||
        !tracePanel
      ) {
        return null;
      }

      const inputRect = input.getBoundingClientRect();
      const sendButtonRect = sendButton.getBoundingClientRect();
      const sceneRect = scene.getBoundingClientRect();
      const scenePanelRect = scenePanel.getBoundingClientRect();
      const tracePanelRect = tracePanel.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;

      return {
        controlsStacked: sendButtonRect.top >= inputRect.bottom,
        inputFullyInViewport:
          inputRect.left >= 0 &&
          inputRect.right <= viewportWidth &&
          inputRect.top >= 0 &&
          inputRect.bottom <= viewportHeight,
        sendButtonFullyInViewport:
          sendButtonRect.left >= 0 &&
          sendButtonRect.right <= viewportWidth &&
          sendButtonRect.top >= 0 &&
          sendButtonRect.bottom <= viewportHeight,
        inputAboveScene: inputRect.bottom <= sceneRect.top,
        sendButtonAboveScene: sendButtonRect.bottom <= sceneRect.top,
        scenePanelAboveTracePanel: scenePanelRect.bottom <= tracePanelRect.top,
      };
    });

    expect(layout).not.toBeNull();
    expect(layout?.controlsStacked).toBe(true);
    expect(layout?.inputFullyInViewport).toBe(true);
    expect(layout?.sendButtonFullyInViewport).toBe(true);
    expect(layout?.inputAboveScene).toBe(true);
    expect(layout?.sendButtonAboveScene).toBe(true);
    expect(layout?.scenePanelAboveTracePanel).toBe(true);
  });

  test("lays out the send button responsively with the question input", async ({
    page,
  }) => {
    await openVisualizer(page);

    const layout = await page.evaluate(() => {
      const input = document.querySelector(
        '[data-testid="profile-visualizer-question"]'
      );
      const sendButton = document.querySelector(
        '[data-testid="profile-visualizer-play"]'
      );

      if (!input || !sendButton) {
        return {
          bottomDelta: Number.POSITIVE_INFINITY,
          heightDelta: Number.POSITIVE_INFINITY,
          isNarrowViewport: false,
          stacked: false,
        };
      }

      const inputRect = input.getBoundingClientRect();
      const sendButtonRect = sendButton.getBoundingClientRect();

      return {
        bottomDelta: Math.abs(inputRect.bottom - sendButtonRect.bottom),
        heightDelta: Math.abs(inputRect.height - sendButtonRect.height),
        isNarrowViewport: document.documentElement.clientWidth < 640,
        stacked: sendButtonRect.top >= inputRect.bottom,
      };
    });

    await expect(page.getByTestId("profile-visualizer-play")).toHaveClass(
      "h-11 w-full rounded-lg bg-blue-600 px-0 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
    );
    await expect(page.getByTestId("profile-visualizer-play")).toHaveText("Send");

    if (layout.isNarrowViewport) {
      expect(layout.stacked).toBe(true);
      expect(layout.heightDelta).toBeLessThanOrEqual(1);
      return;
    }

    expect(layout.bottomDelta).toBeLessThanOrEqual(1);
    expect(layout.heightDelta).toBeLessThanOrEqual(1);
  });

  test("keeps the launcher disabled until the chat model is loaded", async ({
    page,
  }) => {
    await page.evaluate((sessionKey) => {
      sessionStorage.setItem(sessionKey, "true");
    }, HOLD_MODEL_LOADING_SESSION_KEY);
    await page.reload();

    await page.getByTestId("ai-chatbot-button").click();
    await expect(page.getByTestId("chat-input")).toBeVisible({
      timeout: 10_000,
    });

    const visualizerButton = page.getByTestId("profile-visualizer-button");
    await expect(visualizerButton).toBeDisabled();
    await expect(visualizerButton).toHaveAttribute(
      "aria-label",
      "Open LLM Visualizer"
    );
  });

  test("closes the chat overlay when opened", async ({ page }) => {
    await openVisualizer(page);
    await expect(page.getByTestId("chat-input")).toHaveCount(0);
  });

  test("renders nonblank canvas pixels", async ({ page }) => {
    await openVisualizer(page);
    const canvas = page.getByTestId("profile-visualizer-canvas");
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(500);

    const nonBlackPixels = await canvas.evaluate((element) => {
      const canvasElement = element as HTMLCanvasElement;
      const gl =
        canvasElement.getContext("webgl2") ??
        canvasElement.getContext("webgl");
      if (gl) {
        const width = gl.drawingBufferWidth;
        const height = gl.drawingBufferHeight;
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        let count = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          if (pixels[index] + pixels[index + 1] + pixels[index + 2] > 24) {
            count += 1;
          }
        }
        return count;
      }

      const context = canvasElement.getContext("2d");
      if (!context) {
        return 0;
      }
      const imageData = context.getImageData(
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      let count = 0;
      for (let index = 0; index < imageData.data.length; index += 4) {
        if (
          imageData.data[index] +
            imageData.data[index + 1] +
            imageData.data[index + 2] >
          24
        ) {
          count += 1;
        }
      }
      return count;
    });

    expect(nonBlackPixels).toBeGreaterThan(100);
  });

  test("offers zoom controls for the scene", async ({ page }) => {
    await openVisualizer(page);

    const zoomValue = page.getByTestId("profile-visualizer-zoom-value");
    await expect(zoomValue).toHaveText("100%");

    await page.getByTestId("profile-visualizer-zoom-in").click();
    await expect(zoomValue).toHaveText("114%");
    await expect(page.getByTestId("profile-visualizer-zoom-reset")).toBeEnabled();

    await page.getByTestId("profile-visualizer-zoom-reset").click();
    await expect(zoomValue).toHaveText("100%");

    await page.getByTestId("profile-visualizer-zoom-out").click();
    await expect(zoomValue).toHaveText("86%");

    await page.getByTestId("profile-visualizer-zoom-reset").click();
    for (let index = 0; index < 6; index += 1) {
      await page.getByTestId("profile-visualizer-zoom-in").click();
    }
    await expect(zoomValue).toHaveText("184%");
    await expect(page.getByTestId("profile-visualizer-zoom-in")).toBeDisabled();
  });

  test("runs the real service path with mocked worker streaming", async ({
    page,
  }) => {
    await openVisualizer(page);
    await page.getByTestId("profile-visualizer-question").fill(VISUALIZER_QUESTION);
    await expect(
      page.getByTestId("profile-visualizer-transform-question")
    ).toContainText(VISUALIZER_QUESTION);
    await expect(
      page.getByTestId("profile-visualizer-transform-worker")
    ).toContainText("Context:");
    await expect(
      page.getByTestId("profile-visualizer-transform-worker")
    ).toContainText("Question:");
    await expect(
      page.getByTestId("profile-visualizer-transform-worker")
    ).toContainText(VISUALIZER_QUESTION);
    await expect(
      page.getByTestId("profile-visualizer-transform-worker")
    ).toContainText("Answer:");
    await expect(
      page.getByTestId("profile-visualizer-transform-retrieval")
    ).toContainText("teapotai/teapotembedding");

    await page.getByTestId("profile-visualizer-stage-decoder").click();
    await expect
      .poll(() => getTraceCardCenterDelta(page, "decoder"))
      .toBeLessThan(90);

    await page.getByTestId("profile-visualizer-play").click();

    await expect(page.getByTestId("profile-visualizer-stream")).toContainText(
      MOCK_ANSWER
    );
    await expect(page.getByTestId("profile-visualizer-stage-decoder")).toHaveAttribute(
      "data-stage-state",
      "complete"
    );
    await expect
      .poll(() => getTraceCardCenterDelta(page, "decoder"))
      .toBeLessThan(90);

    const workerMessages = await page.evaluate(() => {
      const mockWindow = window as unknown as {
        __mockWorkerMessages: MockWorkerMessage[];
      };
      return mockWindow.__mockWorkerMessages;
    });
    const generateMessage = workerMessages.find(
      (message) => message.action === "generate"
    );

    expect(
      workerMessages.filter((message) => message.action === "load")
    ).toHaveLength(1);
    expect(generateMessage?.input).toBe(VISUALIZER_QUESTION);
    expect(generateMessage?.conversationTurns).toEqual([]);
  });
});
