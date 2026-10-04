import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";

test("profile warning leaves the initial message unobstructed", async ({ page }) => {
  // Render the real website component with a trimmed profile, independently of
  // the current profile's size. Reuse the production export's actual styles.
  await page.goto("/");
  const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll((links) =>
    links.map((link) => (link as HTMLLinkElement).href),
  );
  const message = "Ask about my experience, projects, and skills. This message should remain clear of the profile warning.";
  const markup = execFileSync(process.execPath, [resolve("tests/helpers/render-chat-messages.mjs")], {
    encoding: "utf8",
    input: JSON.stringify({
      messages: [
        { id: "initial", type: "ai", content: message, timestamp: 1 },
        { id: "follow-up", type: "user", content: "Tell me more.", timestamp: 2 },
      ],
      currentResponse: "",
      isGenerating: false,
      isLoading: false,
      error: null,
      loadingMessage: null,
      showPersonalContextTrimWarning: true,
      trimmedPersonalContextCharacters: 9,
    }),
  });
  await page.setContent(`<!doctype html><html><head>${stylesheets.map((href) => `<link rel="stylesheet" href="${href}">`).join("")}</head><body><div style="width: min(100%, 400px); padding: 16px">${markup}</div></body></html>`);
  const warning = page.getByTestId("profile-trim-warning");
  await expect(warning).toBeVisible();
  await expect(warning).toHaveAccessibleName("Profile trimmed: 9 characters");
  const warningBounds = await warning.boundingBox();
  const messageBounds = await page.getByText(message, { exact: true }).boundingBox();
  expect(messageBounds!.x + messageBounds!.width).toBeLessThanOrEqual(warningBounds!.x - 6);
});
