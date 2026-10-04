import { test, expect } from "@playwright/test";
import { DERIVED_CONFIG } from "../src/config/site";

const arcadeTitle = `${DERIVED_CONFIG.possessiveName} Arcade`;
const portalName = `Open ${DERIVED_CONFIG.possessiveName} arcade`;

test.beforeEach(async ({ page }) => {
  await page.route("https://api.github.com/users/**", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.route("https://drive.google.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>Resume preview</p>" }),
  );
});

test("should reach the arcade by keyboard and reload its own page", async ({ page }) => {
  await page.goto("/");
  const portal = page.getByRole("link", { name: portalName });
  await expect(portal).toBeVisible();
  const bounds = await portal.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds!.y).toBeLessThan(32);
  expect(bounds!.x).toBeGreaterThan(viewport.width / 2);
  expect(bounds!.width).toBeGreaterThanOrEqual(40);
  expect(bounds!.height).toBeGreaterThanOrEqual(40);

  await portal.focus();
  await expect(page.getByRole("tooltip")).toHaveText(`Portal to ${DERIVED_CONFIG.possessiveName} arcade`);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(page.getByRole("heading", { level: 1, name: arcadeTitle })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: arcadeTitle })).toBeVisible();
  await page.getByRole("link", { name: "Back to home" }).click();
  await expect(page.getByTestId("main-header")).toBeVisible();
});

test("should lay out three padded previews and disabled Play buttons in one scrollable column", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: portalName }).click();
  const games = page.getByRole("region", { name: "Arcade games" });
  const cards = games.getByRole("article");
  await expect(cards).toHaveCount(3);
  await expect(games.getByRole("heading", { name: "Coming soon", exact: true })).toHaveCount(3);
  const previews = games.getByRole("img", { name: /pixel blob/ });
  await expect(previews).toHaveCount(3);
  const labels = await previews.evaluateAll((elements) => elements.map((element) => element.getAttribute("aria-label")));
  expect(new Set(labels).size).toBe(3);

  let previousBottom = 0;
  for (const card of await cards.all()) {
    const bounds = await card.boundingBox();
    expect(bounds!.y).toBeGreaterThan(previousBottom);
    previousBottom = bounds!.y + bounds!.height;
    const preview = await card.getByRole("img").boundingBox();
    expect(Math.abs(preview!.x + preview!.width / 2 - (bounds!.x + bounds!.width / 2))).toBeLessThan(2);
    expect(preview!.y).toBeGreaterThan(bounds!.y + 16);
    const play = card.getByRole("button", { name: /Play/ });
    await expect(play).toBeDisabled();
    const playBounds = await play.boundingBox();
    expect(playBounds!.x).toBeGreaterThan(bounds!.x + bounds!.width / 2);
    expect(playBounds!.y).toBeGreaterThan(preview!.y + preview!.height);
  }

  await cards.last().scrollIntoViewIfNeeded();
  await expect(cards.last().getByRole("button", { name: /Play/ })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const lastCard = await cards.last().boundingBox();
  expect(page.viewportSize()!.height - lastCard!.y - lastCard!.height).toBeGreaterThanOrEqual(32);
  for (const card of await cards.all()) {
    const bounds = await card.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(16);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width - 16);
  }
  await expect(page.getByRole("navigation", { name: "Arcade navigation" })).not.toContainText("Justin Law");
});

test("should bob the portal and all three pixel blobs", async ({ page }) => {
  await page.goto("/");
  const portal = page.getByRole("link", { name: portalName });
  const portalBody = portal.getByTestId("pixel-blob-body");
  const portalY = await portalBody.evaluate((element) => element.getBoundingClientRect().y);
  await expect.poll(() => portalBody.evaluate((element) => element.getBoundingClientRect().y)).not.toBe(portalY);
  await portal.click();

  const bodies = page.getByTestId("pixel-blob-body");
  await expect(bodies).toHaveCount(3);
  const running = await bodies.evaluateAll((elements) =>
    elements.every((element) => element.getAnimations().some((animation) => animation.playState === "running")),
  );
  expect(running).toBe(true);
  const firstY = await bodies.first().evaluate((element) => element.getBoundingClientRect().y);
  await expect.poll(() => bodies.first().evaluate((element) => element.getBoundingClientRect().y)).not.toBe(firstY);
});

test("should keep portal and card characters still with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const portal = page.getByRole("link", { name: portalName });
  expect(await portal.locator("svg").evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  await portal.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(arcadeTitle);
  expect(await page.getByRole("img", { name: /pixel blob/ }).evaluateAll((elements) =>
    elements.flatMap((element) => element.getAnimations({ subtree: true })).length,
  )).toBe(0);
});

test("should embed a configured local entry point and restore Play focus on return", async ({ page }) => {
  // Exercise website player integration with fixture content, never game source.
  await page.route("**/_next/data/**/arcade.json", (route) => route.fulfill({
    json: {
      pageProps: { games: [{ id: "fixture", title: "Website fixture", description: "Player integration fixture", blobVariant: "blue", entryPoint: "/games/fixture/index.html" }] },
      __N_SSG: true,
    },
  }));
  let requestedEntryPoint = "";
  await page.route("**/games/fixture/index.html", (route) => {
    requestedEntryPoint = new URL(route.request().url()).pathname;
    return route.fulfill({ contentType: "text/html", body: "<html><body>Embedded content loaded</body></html>" });
  });
  await page.goto("/");
  await page.getByRole("link", { name: portalName }).click();
  const play = page.getByRole("button", { name: "Play Website fixture" });
  await expect(play).toBeEnabled();
  await play.click();
  const frame = page.frameLocator('iframe[title="Website fixture game"]');
  await expect(frame.locator("body")).toHaveText("Embedded content loaded");
  expect(requestedEntryPoint).toBe(`${new URL(page.url()).pathname.replace(/\/arcade\/$/, "")}/games/fixture/index.html`);
  await expect(page).toHaveURL(/\/arcade\/$/);
  await page.getByRole("button", { name: "Back to games" }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(play).toBeFocused();
});

test("should align icon-only corner controls with social buttons at every responsive tier", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Responsive icon sizing only needs one browser");
  for (const width of [320, 375, 640, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const robot = page.getByTestId("ai-chatbot-button");
    await expect(robot).toHaveText("");
    await expect(robot).toHaveAccessibleName("Open AI chatbot");
    const robotBounds = await robot.boundingBox();
    const social = page.getByTestId("social-footer").getByRole("link").first();
    const socialControl = await social.boundingBox();
    expect(robotBounds!.width).toBeCloseTo(socialControl!.width, 0);
    expect(robotBounds!.height).toBeCloseTo(socialControl!.height, 0);
    expect(robotBounds!.y + robotBounds!.height / 2).toBeCloseTo(socialControl!.y + socialControl!.height / 2, 0);
    const robotIcon = robot.locator("svg");
    const iconBounds = await robotIcon.boundingBox();
    const socialBounds = await social.locator("img").boundingBox();
    expect(iconBounds!.width).toBeCloseTo(socialBounds!.width, 0);
    expect(iconBounds!.height).toBeCloseTo(socialBounds!.height, 0);
    const drawing = await robotIcon.evaluate((element) => {
      const svg = element as SVGSVGElement;
      const bounds = svg.getBBox();
      const matrix = svg.getScreenCTM()!;
      return {
        width: bounds.width * matrix.a,
        height: bounds.height * matrix.d,
        centerX: (bounds.x + bounds.width / 2) * matrix.a + matrix.e,
        centerY: (bounds.y + bounds.height / 2) * matrix.d + matrix.f,
      };
    });
    expect(drawing.width / socialBounds!.width).toBeGreaterThanOrEqual(0.9);
    // Preserve the existing robot's 20:16 silhouette rather than stretching it.
    expect(drawing.width / drawing.height).toBeCloseTo(1.25, 2);
    expect(drawing.centerX).toBeCloseTo(robotBounds!.x + robotBounds!.width / 2, 0);
    expect(drawing.centerY).toBeCloseTo(robotBounds!.y + robotBounds!.height / 2, 0);
    const colors = await robotIcon.evaluate((element) => ({
      fill: getComputedStyle(element).fill,
      stroke: getComputedStyle(element).stroke,
      text: getComputedStyle(element.parentElement!).color,
    }));
    expect(colors.fill).not.toBe("none");
    expect(colors.stroke).not.toBe(colors.text);
    const footer = await page.getByTestId("social-footer").boundingBox();
    expect(robotBounds!.x).toBeGreaterThan(footer!.x + footer!.width);
    const portal = await page.getByRole("link", { name: portalName }).boundingBox();
    expect(portal!.width).toBeCloseTo(socialControl!.width, 0);
    expect(portal!.height).toBeCloseTo(socialControl!.height, 0);
    expect(portal!.x).toBeCloseTo(robotBounds!.x, 0);
    const bottomInset = 900 - robotBounds!.y - robotBounds!.height;
    const rightInset = width - robotBounds!.x - robotBounds!.width;
    expect(portal!.y).toBeCloseTo(bottomInset, 0);
    expect(rightInset).toBeCloseTo(bottomInset, 0);
    const title = await page.getByTestId("main-header").boundingBox();
    expect(portal!.x > title!.x + title!.width || portal!.y + portal!.height < title!.y).toBe(true);
  }
});
