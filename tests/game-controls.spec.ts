import { test, expect, type Page } from "./fixtures";
import { DERIVED_CONFIG } from "../src/config/site";

const gameTitle = "Pokemon Mystery Dungeon Blue Rescue Team - Reimagined";
const portalName = `Open ${DERIVED_CONFIG.possessiveName} arcade`;

interface RecordedKey {
  type: "keydown" | "keyup";
  code: string;
  key: string;
}

// This fixture records the website's input bridge; it contains no game source.
const inputFixture = `<!doctype html><html><body>
  <output id="key-events">[]</output>
  <input id="ordinary-input" type="text" value="ordinary text">
  <input id="confirm-input" type="text" data-game-controls-confirm="submit" value="  exact  ">
  <input id="readonly-input" type="text" data-game-controls-confirm="submit" readonly value="read only">
  <textarea id="ordinary-textarea" data-game-controls-confirm="submit">text</textarea>
  <select id="ordinary-select"><option>choice</option></select>
  <div id="ordinary-editable" contenteditable="true" data-game-controls-confirm="submit">editable</div>
  <script>
    const events = [];
    for (const type of ["keydown", "keyup"]) {
      window.addEventListener(type, event => {
        events.push({ type: event.type, code: event.code, key: event.key });
        document.getElementById("key-events").textContent = JSON.stringify(events);
      });
    }
  </script>
</body></html>`;

test.beforeEach(async ({ page }) => {
  // Register before navigation so no real game module can execute.
  await page.route("**/games/pokemon-dungeon-reimagined/**", (route) =>
    route.fulfill({ contentType: "text/html", body: inputFixture }),
  );
});

async function openPlayer(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("link", { name: portalName }).click();
  await page.getByRole("button", { name: `Play ${gameTitle}`, exact: true }).click();
  await expect(page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("#key-events")).toHaveText("[]");
}

async function recordedKeys(page: Page): Promise<RecordedKey[]> {
  const text = await page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("#key-events").textContent();
  return JSON.parse(text ?? "[]") as RecordedKey[];
}

async function showControls(page: Page): Promise<void> {
  const controls = page.getByRole("region", { name: "Game controls", exact: true });
  if (!await controls.isVisible()) await page.getByRole("button", { name: "Show controls", exact: true }).click();
  await expect(controls).toBeVisible();
}

test("should focus the game for native desktop keyboard input", async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), "Desktop starts with native keyboard controls");
  await openPlayer(page);
  await expect(page.getByRole("region", { name: "Game controls", exact: true })).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("z");
  await expect.poll(() => recordedKeys(page)).toEqual([
    { type: "keydown", code: "ArrowRight", key: "ArrowRight" },
    { type: "keyup", code: "ArrowRight", key: "ArrowRight" },
    { type: "keydown", code: "KeyZ", key: "z" },
    { type: "keyup", code: "KeyZ", key: "z" },
  ]);
});

test("should restore native desktop keyboard input after hiding touch controls", async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), "Desktop keyboard must resume after pointer toggles");
  await openPlayer(page);
  await page.getByRole("button", { name: "Show controls", exact: true }).click();
  await page.getByRole("button", { name: "Hide controls", exact: true }).click();
  await expect(page.getByRole("region", { name: "Game controls", exact: true })).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("z");
  await expect.poll(() => recordedKeys(page), { timeout: 1500 }).toEqual([
    { type: "keydown", code: "ArrowRight", key: "ArrowRight" },
    { type: "keyup", code: "ArrowRight", key: "ArrowRight" },
    { type: "keydown", code: "KeyZ", key: "z" },
    { type: "keyup", code: "KeyZ", key: "z" },
  ]);
});

test("should provide usable touch controls and bridge diagonal and action keys", async ({ page }, testInfo) => {
  await openPlayer(page);
  const controls = page.getByRole("region", { name: "Game controls", exact: true });
  if (testInfo.project.use.isMobile) await expect(controls).toBeVisible();
  await showControls(page);
  await expect(controls.getByRole("button", { name: /^Move / })).toHaveCount(8);
  const viewport = page.viewportSize()!;
  for (const button of await controls.getByRole("button").all()) {
    const bounds = await button.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(viewport.height / 2);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
  }

  await controls.getByRole("button", { name: "Move up-right", exact: true }).click();
  await expect.poll(() => recordedKeys(page)).toHaveLength(4);
  const diagonal = await recordedKeys(page);
  expect(diagonal.every((event) => event.key === event.code)).toBe(true);
  expect(diagonal.filter((event) => event.type === "keydown").map((event) => event.code).sort()).toEqual(["ArrowRight", "ArrowUp"]);
  expect(diagonal.filter((event) => event.type === "keyup").map((event) => event.code).sort()).toEqual(["ArrowRight", "ArrowUp"]);

  const actions = [
    { name: /^A\b/, code: "KeyZ", key: "z" },
    { name: /^B\b/, code: "KeyX", key: "x" },
    { name: /^Start\b/, code: "Enter", key: "Enter" },
    { name: /^Select\b/, code: "ShiftRight", key: "Shift" },
    { name: /^Menu\b/, code: "Escape", key: "Escape" },
  ];
  for (const action of actions) {
    const previousCount = (await recordedKeys(page)).length;
    await controls.getByRole("button", { name: action.name }).click();
    await expect.poll(() => recordedKeys(page)).toHaveLength(previousCount + 2);
    expect((await recordedKeys(page)).slice(previousCount)).toEqual([
      { type: "keydown", code: action.code, key: action.key },
      { type: "keyup", code: action.code, key: action.key },
    ]);
  }
});

test("should keep emulator controls usable in narrow portrait and short landscape layouts", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Responsive control layout needs one browser");
  for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await openPlayer(page);
    await showControls(page);
    for (const button of await page.getByRole("region", { name: "Game controls", exact: true }).getByRole("button").all()) {
      const bounds = (await button.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(viewport.height / 2);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    }
  }
});

test("should keep a shared direction held until its final pointer is released", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  const controls = page.getByRole("region", { name: "Game controls", exact: true });
  const up = controls.getByRole("button", { name: "Move up", exact: true });
  const diagonal = controls.getByRole("button", { name: "Move up-right", exact: true });
  // Two independently owned pointers share ArrowUp. Synthetic pointer IDs
  // exercise the real host adapter without executing any game implementation.
  await up.dispatchEvent("pointerdown", { pointerId: 41, pointerType: "touch", button: 0, buttons: 1 });
  await diagonal.dispatchEvent("pointerdown", { pointerId: 42, pointerType: "touch", button: 0, buttons: 1 });
  const pressed = [
    { type: "keydown", code: "ArrowUp", key: "ArrowUp" },
    { type: "keydown", code: "ArrowRight", key: "ArrowRight" },
  ];
  await expect.poll(() => recordedKeys(page)).toEqual(pressed);
  await up.dispatchEvent("pointercancel", { pointerId: 41, pointerType: "touch" });
  expect(await recordedKeys(page)).toEqual(pressed);
  await diagonal.dispatchEvent("pointercancel", { pointerId: 42, pointerType: "touch" });
  await expect.poll(() => recordedKeys(page)).toEqual([
    ...pressed,
    { type: "keyup", code: "ArrowUp", key: "ArrowUp" },
    { type: "keyup", code: "ArrowRight", key: "ArrowRight" },
  ]);
});

test("should release held input when the embedded window loses focus", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  const left = page.getByRole("region", { name: "Game controls", exact: true }).getByRole("button", { name: "Move left", exact: true });
  await left.dispatchEvent("pointerdown", { pointerId: 61, pointerType: "touch", button: 0, buttons: 1 });
  await expect.poll(() => recordedKeys(page)).toEqual([{ type: "keydown", code: "ArrowLeft", key: "ArrowLeft" }]);
  await page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("body").evaluate(() => {
    window.dispatchEvent(new Event("blur"));
  });
  const released = [
    { type: "keydown", code: "ArrowLeft", key: "ArrowLeft" },
    { type: "keyup", code: "ArrowLeft", key: "ArrowLeft" },
  ];
  await expect.poll(() => recordedKeys(page)).toEqual(released);
  // The later pointer cancellation must not emit a second release.
  await left.dispatchEvent("pointercancel", { pointerId: 61, pointerType: "touch" });
  expect(await recordedKeys(page)).toEqual(released);
});

test("should release held input when a pointer is cancelled or controls are hidden", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  const controls = page.getByRole("region", { name: "Game controls", exact: true });
  const movement = controls.getByRole("button", { name: "Move right", exact: true });
  await movement.evaluate((element) => element.addEventListener("pointerdown", (event) => {
    element.setAttribute("data-fixture-pointer-id", String((event as PointerEvent).pointerId));
  }, { once: true }));
  const bounds = (await movement.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await expect.poll(() => recordedKeys(page)).toEqual([{ type: "keydown", code: "ArrowRight", key: "ArrowRight" }]);
  const pointerId = Number(await movement.getAttribute("data-fixture-pointer-id"));
  await movement.dispatchEvent("pointercancel", { pointerId, pointerType: "mouse" });
  await page.mouse.up();
  await expect.poll(() => recordedKeys(page)).toEqual([
    { type: "keydown", code: "ArrowRight", key: "ArrowRight" },
    { type: "keyup", code: "ArrowRight", key: "ArrowRight" },
  ]);

  await page.mouse.down();
  await expect.poll(() => recordedKeys(page)).toHaveLength(3);
  const hide = page.getByRole("button", { name: "Hide controls", exact: true });
  await hide.focus();
  await hide.press("Enter");
  await page.mouse.up();
  await expect(controls).toBeHidden();
  await expect.poll(() => recordedKeys(page)).toEqual([
    { type: "keydown", code: "ArrowRight", key: "ArrowRight" },
    { type: "keyup", code: "ArrowRight", key: "ArrowRight" },
    { type: "keydown", code: "ArrowRight", key: "ArrowRight" },
    { type: "keyup", code: "ArrowRight", key: "ArrowRight" },
  ]);
});


test("should bridge only A and Start to an explicitly opted-in editable text input", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  const controls = page.getByRole("region", { name: "Game controls", exact: true });
  const field = page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("#confirm-input");
  await field.focus();
  for (const name of ["Move up-right", "B (X key)", "Select (Shift key)", "Menu (Escape key)"]) {
    await controls.getByRole("button", { name, exact: true }).click();
  }
  expect(await recordedKeys(page)).toEqual([]);
  await expect(field).toBeFocused();
  for (const action of [{ name: "A (Z key)", code: "KeyZ", key: "z" }, { name: "Start (Enter key)", code: "Enter", key: "Enter" }]) {
    const before = (await recordedKeys(page)).length;
    await controls.getByRole("button", { name: action.name, exact: true }).click();
    await expect.poll(() => recordedKeys(page)).toHaveLength(before + 2);
    expect((await recordedKeys(page)).slice(before)).toEqual([
      { type: "keydown", code: action.code, key: action.key },
      { type: "keyup", code: action.code, key: action.key },
    ]);
    await expect(field).toBeFocused();
    await expect(field).toHaveValue("  exact  ");
  }
});

test("should retain ordinary typing protection and require the exact confirm opt-in", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  const controls = page.getByRole("region", { name: "Game controls", exact: true });
  const frame = page.frameLocator(`iframe[title="${gameTitle} game"]`);
  for (const id of ["ordinary-input", "readonly-input", "ordinary-textarea", "ordinary-select", "ordinary-editable"]) {
    const field = frame.locator(`#${id}`);
    await field.focus();
    for (const name of ["A (Z key)", "Start (Enter key)", "Move left"]) {
      await controls.getByRole("button", { name, exact: true }).click();
    }
    await expect(field).toBeFocused();
    expect(await recordedKeys(page)).toEqual([]);
  }
  const optedIn = frame.locator("#confirm-input");
  await optedIn.evaluate((field) => field.setAttribute("data-game-controls-confirm", "other"));
  await optedIn.focus();
  await controls.getByRole("button", { name: "A (Z key)", exact: true }).click();
  await controls.getByRole("button", { name: "Start (Enter key)", exact: true }).click();
  expect(await recordedKeys(page)).toEqual([]);
  await optedIn.press("Enter");
  await expect.poll(() => recordedKeys(page)).toEqual([
    { type: "keydown", code: "Enter", key: "Enter" },
    { type: "keyup", code: "Enter", key: "Enter" },
  ]);
});
