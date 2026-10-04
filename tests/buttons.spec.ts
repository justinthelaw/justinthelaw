import { test, expect, type Locator, type Page } from "@playwright/test";

async function expectConciseTooltip(page: Page, control: Locator, topic: RegExp): Promise<void> {
  await control.focus();
  const tooltip = page.locator('[role="tooltip"][data-state$="open"]');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText(topic);
  const words = (await tooltip.innerText()).trim().split(/\s+/);
  expect(words.length).toBeGreaterThanOrEqual(2);
  expect(words.length).toBeLessThanOrEqual(5);
  await control.blur();
  await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden();
}

test.beforeEach(async ({ page }) => {
  await page.route("https://api.github.com/users/**", (route) => route.fulfill({ status: 503 }));
  await page.route("https://drive.google.com/**", (route) => route.fulfill({ contentType: "text/html", body: "Resume preview" }));
});

test("home controls explain their destinations on keyboard focus and hover", async ({ page }, testInfo) => {
  await page.goto("/");
  for (const platform of ["GitHub", "LinkedIn", "HuggingFace", "GitLab"]) {
    await expectConciseTooltip(page, page.getByTestId("social-footer").getByRole("link", { name: new RegExp(platform) }), new RegExp(platform));
  }
  const robot = page.getByTestId("ai-chatbot-button");
  await expectConciseTooltip(page, robot, /chat/i);
  await expectConciseTooltip(page, page.getByTestId("resume-drive-link"), /Google Drive/);
  await expectConciseTooltip(page, page.getByRole("link", { name: "Open Justin's arcade" }), /arcade/);
  if (!testInfo.project.name.includes("Mobile")) {
    await robot.hover();
    await expect(page.getByRole("tooltip")).toContainText(/chat/i);
  }
});

test("arcade navigation and unavailable games explain their actions", async ({ page }) => {
  await page.goto("/arcade/");
  await expectConciseTooltip(page, page.getByRole("link", { name: "Back to home" }), /home/i);
  const unavailable = page.getByRole("button", { name: "Play, coming soon" }).first();
  await expect(unavailable).toBeDisabled();
  await expectConciseTooltip(page, unavailable.locator(".."), /coming soon/i);
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("chat keeps download consent simple and labels every action", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("ai-chatbot-button").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const consent = page.getByTestId("model-download-consent");
  const copy = (await consent.innerText()).trim();
  expect(copy.split(/\s+/).length).toBeLessThanOrEqual(35);
  expect(copy).toMatch(/820 MB/);
  expect(copy).toMatch(/fallback/i);
  expect(copy).toMatch(/browser/i);
  await expectConciseTooltip(page, page.getByTestId("model-load-button"), /chat/i);
  await expectConciseTooltip(page, page.getByTestId("chat-clear-button"), /clear/i);
  await expectConciseTooltip(page, page.getByTestId("chat-send-button").locator(".."), /send/i);
  await expectConciseTooltip(page, dialog.getByRole("button", { name: "Close chat" }), /close/i);
  await dialog.getByRole("button", { name: "Close chat" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("ai-chatbot-button")).toBeFocused();
});
