import { test, expect } from "./fixtures";
import { DERIVED_CONFIG } from "../src/config/site";

const arcadeTitle = `${DERIVED_CONFIG.possessiveName} Arcade`;
const portalName = `Open ${DERIVED_CONFIG.possessiveName} arcade`;
const pokemonTitle = "Pokémon Mystery Dungeon: Blue Rescue Team";
const gameFixture = "<!doctype html><html><body>Website game fixture</body></html>";

test.beforeEach(async ({ page }) => {
  // Website integration only: never load or execute the real game source.
  await page.route("**/games/pokemon-dungeon-reimagined/**", (route) =>
    route.fulfill({ contentType: "text/html", body: gameFixture }),
  );
});

test("should offer the Pokemon development game in the first arcade card", async ({ page }) => {
  const gameRequests: string[] = [];
  await page.route("**/games/pokemon-dungeon-reimagined/**", (route) => {
    gameRequests.push(route.request().url());
    return route.fulfill({ contentType: "text/html", body: gameFixture });
  });
  await page.goto("/");
  await page.getByRole("link", { name: portalName }).click();
  const firstCard = page.getByRole("region", { name: "Arcade games" }).getByRole("article").first();
  await expect(firstCard.getByRole("heading", { name: pokemonTitle, exact: true })).toBeVisible({ timeout: 1500 });
  const play = firstCard.getByRole("button", { name: `Play ${pokemonTitle}`, exact: true });
  await expect(play).toBeEnabled({ timeout: 1500 });
  await expect(firstCard).toContainText(/development/i);
  const picture = firstCard.getByRole("img", { name: /art study|development/i });
  await expect(picture).toBeVisible();
  await expect.poll(() => picture.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const previewPath = await picture.getAttribute("src");
  expect(new URL(previewPath!, page.url()).pathname).toMatch(/\/arcade\//);
  await play.focus();
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(gameRequests).toEqual([]);
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

test("should lay out the development game and two unavailable games in one scrollable column", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: portalName }).click();
  const games = page.getByRole("region", { name: "Arcade games" });
  const cards = games.getByRole("article");
  await expect(cards).toHaveCount(3);
  await expect(cards.first().getByRole("heading", { name: pokemonTitle, exact: true })).toBeVisible();
  await expect(games.getByRole("heading", { name: "Coming soon", exact: true })).toHaveCount(2);
  const previews = games.getByRole("img", { name: /pixel blob/ });
  await expect(previews).toHaveCount(2);
  const labels = await previews.evaluateAll((elements) => elements.map((element) => element.getAttribute("aria-label")));
  expect(new Set(labels).size).toBe(2);

  let previousBottom = 0;
  const allCards = await cards.all();
  for (const [index, card] of allCards.entries()) {
    const bounds = await card.boundingBox();
    expect(bounds!.y).toBeGreaterThan(previousBottom);
    previousBottom = bounds!.y + bounds!.height;
    const preview = await card.getByRole("img").boundingBox();
    expect(Math.abs(preview!.x + preview!.width / 2 - (bounds!.x + bounds!.width / 2))).toBeLessThan(2);
    expect(preview!.y).toBeGreaterThan(bounds!.y + 16);
    const play = card.getByRole("button", { name: /Play/ });
    if (index === 0) await expect(play).toBeEnabled();
    else await expect(play).toBeDisabled();
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

test("should keep the joystick still and animate both remaining pixel blobs", async ({ page }) => {
  await page.goto("/");
  const portal = page.getByRole("link", { name: portalName });
  const joystick = portal.getByTestId("arcade-joystick");
  await expect(joystick).toHaveText("🕹️");
  expect(await joystick.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  await portal.click();

  const bodies = page.getByTestId("pixel-blob-body");
  await expect(bodies).toHaveCount(2);
  const running = await bodies.evaluateAll((elements) =>
    elements.every((element) => element.getAnimations().some((animation) => animation.playState === "running")),
  );
  expect(running).toBe(true);
  // WebKit may suspend offscreen animation painting on mobile. Measure the
  // visible character, as a user would see it after reaching its card.
  await bodies.first().scrollIntoViewIfNeeded();
  const firstY = await bodies.first().evaluate((element) => element.getBoundingClientRect().y);
  await expect.poll(() => bodies.first().evaluate((element) => element.getBoundingClientRect().y)).not.toBe(firstY);
});

test("should keep the joystick and remaining card characters still with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const portal = page.getByRole("link", { name: portalName });
  expect(await portal.getByTestId("arcade-joystick").evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  await portal.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(arcadeTitle);
  expect(await page.getByRole("img", { name: /pixel blob/ }).evaluateAll((elements) =>
    elements.flatMap((element) => element.getAnimations({ subtree: true })).length,
  )).toBe(0);
});

test("should fill the viewport with a configured local game and restore Play focus on return", async ({ page }) => {
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
  const dialog = page.getByRole("dialog", { name: "Website fixture", exact: true });
  await expect(dialog).toBeVisible();
  const viewport = page.viewportSize()!;
  await expect.poll(async () => {
    const bounds = await dialog.boundingBox();
    return bounds ? { x: Math.round(bounds.x), y: Math.round(bounds.y), width: Math.round(bounds.width), height: Math.round(bounds.height) } : null;
  }).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height });
  const frame = page.frameLocator('iframe[title="Website fixture game"]');
  await expect(frame.locator("body")).toHaveText("Embedded content loaded");
  await expect(page.locator('iframe[title="Website fixture game"]')).toBeFocused();
  expect(requestedEntryPoint).toBe(`${new URL(page.url()).pathname.replace(/\/arcade\/$/, "")}/games/fixture/index.html`);
  await expect(page).toHaveURL(/\/arcade\/$/);
  await page.getByRole("button", { name: "Back to games" }).click();
  await expect(dialog).toHaveCount(0);
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
    const portalControl = page.getByRole("link", { name: portalName });
    const portal = await portalControl.boundingBox();
    expect(portal!.width).toBeCloseTo(socialControl!.width, 0);
    expect(portal!.height).toBeCloseTo(socialControl!.height, 0);
    expect(portal!.x).toBeCloseTo(robotBounds!.x, 0);
    const joystick = portalControl.getByTestId("arcade-joystick");
    await expect(joystick).toHaveText("🕹️");
    const joystickBounds = (await joystick.boundingBox())!;
    const expectedIconSize = width >= 768 ? 36 : width >= 640 ? 32 : 28;
    expect(joystickBounds.width).toBe(expectedIconSize);
    expect(joystickBounds.height).toBe(expectedIconSize);
    expect(joystickBounds.width).toBeCloseTo(socialBounds!.width, 0);
    expect(joystickBounds.height).toBeCloseTo(socialBounds!.height, 0);
    const emojiFontSize = await joystick.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    expect(emojiFontSize).toBe(expectedIconSize);
    expect(joystickBounds.x + joystickBounds.width / 2).toBeCloseTo(portal!.x + portal!.width / 2, 0);
    expect(joystickBounds.y + joystickBounds.height / 2).toBeCloseTo(portal!.y + portal!.height / 2, 0);
    const bottomInset = 900 - robotBounds!.y - robotBounds!.height;
    const rightInset = width - robotBounds!.x - robotBounds!.width;
    expect(portal!.y).toBeCloseTo(bottomInset, 0);
    expect(rightInset).toBeCloseTo(bottomInset, 0);
    const title = await page.getByTestId("main-header").boundingBox();
    expect(portal!.x > title!.x + title!.width || portal!.y + portal!.height < title!.y).toBe(true);
  }
});
