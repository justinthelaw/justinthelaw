import { test, expect, type Page } from "./fixtures";
import { DERIVED_CONFIG } from "../src/config/site";

const gameTitle = "Pokémon Mystery Dungeon: Blue Rescue Team";
const portalName = `Open ${DERIVED_CONFIG.possessiveName} arcade`;

interface RecordedKey {
  type: "keydown" | "keyup";
  code: string;
  key: string;
}

interface RecordedControlsVisibility {
  visible: boolean;
  attribute: string;
}

// This fixture records the website's input bridge; it contains no game source.
const inputFixture = `<!doctype html><html><body>
  <output id="key-events">[]</output>
  <output id="focused-key-events">[]</output>
  <output id="control-visibility-events">[]</output>
  <input id="ordinary-input" type="text" value="ordinary text">
  <input id="confirm-input" type="text" data-game-controls-confirm="submit" value="  exact  ">
  <input id="readonly-input" type="text" data-game-controls-confirm="submit" readonly value="read only">
  <textarea id="ordinary-textarea" data-game-controls-confirm="submit">text</textarea>
  <select id="ordinary-select"><option>choice</option></select>
  <div id="ordinary-editable" contenteditable="true" data-game-controls-confirm="submit">editable</div>
  <script>
    const events = [];
    const focusedEvents = [];
    const controlsVisibilityEvents = [];
    window.addEventListener("arcade-controls-visibility", event => {
      controlsVisibilityEvents.push({ visible: event.detail.visible, attribute: document.documentElement.dataset.arcadeControlsVisible });
      document.getElementById("control-visibility-events").textContent = JSON.stringify(controlsVisibilityEvents);
    });
    for (const type of ["keydown", "keyup"]) {
      window.addEventListener(type, event => {
        const recorded = { type: event.type, code: event.code, key: event.key };
        events.push(recorded);
        document.getElementById("key-events").textContent = JSON.stringify(events);
        if (document.hasFocus()) {
          focusedEvents.push(recorded);
          document.getElementById("focused-key-events").textContent = JSON.stringify(focusedEvents);
        }
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

async function recordedControlsVisibility(page: Page): Promise<RecordedControlsVisibility[]> {
  const text = await page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("#control-visibility-events").textContent();
  return JSON.parse(text ?? "[]") as RecordedControlsVisibility[];
}

async function showControls(page: Page): Promise<void> {
  const controls = page.getByRole("region", { name: "Game controls", exact: true });
  if (!await controls.isVisible()) await page.getByRole("button", { name: "Show controls", exact: true }).click();
  await expect(controls).toBeVisible();
}

test("should publish actual overlay visibility after toggles and frame loads", async ({ page }) => {
  await openPlayer(page);
  const controls = page.getByRole("region", { name: "Game controls", exact: true });
  const frame = page.frameLocator(`iframe[title="${gameTitle} game"]`);
  const initial = await controls.isVisible();
  await expect(frame.locator("html")).toHaveAttribute("data-arcade-controls-visible", String(initial));
  await expect.poll(async () => (await recordedControlsVisibility(page)).at(-1)).toEqual({ visible: initial, attribute: String(initial) });

  await page.getByRole("button", { name: initial ? "Hide controls" : "Show controls", exact: true }).click();
  await expect(controls).toBeVisible({ visible: !initial });
  await expect(frame.locator("html")).toHaveAttribute("data-arcade-controls-visible", String(!initial));
  await expect.poll(async () => (await recordedControlsVisibility(page)).at(-1)).toEqual({ visible: !initial, attribute: String(!initial) });

  const replacement = page.waitForEvent("framenavigated", { predicate: (child) => child.url().endsWith("?visibility=1") });
  await page.locator(`iframe[title="${gameTitle} game"]`).evaluate((element) => {
    const iframe = element as HTMLIFrameElement;
    iframe.src = `${iframe.src}?visibility=1`;
  });
  await replacement;
  await expect(frame.locator("html")).toHaveAttribute("data-arcade-controls-visible", String(!initial));
  await expect.poll(() => recordedControlsVisibility(page)).toEqual([{ visible: !initial, attribute: String(!initial) }]);

  await page.getByRole("button", { name: initial ? "Show controls" : "Hide controls", exact: true }).click();
  await expect(controls).toBeVisible({ visible: initial });
  await expect(frame.locator("html")).toHaveAttribute("data-arcade-controls-visible", String(initial));
  await expect.poll(() => recordedControlsVisibility(page)).toEqual([
    { visible: !initial, attribute: String(!initial) },
    { visible: initial, attribute: String(initial) },
  ]);
  expect(await recordedKeys(page)).toEqual([]);
});

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

test("should focus the game when showing controls and deliver focused bridge input", async ({ page }) => {
  await openPlayer(page);
  const controls = page.getByRole("region", { name: "Game controls", exact: true });
  if (await controls.isVisible()) await page.getByRole("button", { name: "Hide controls", exact: true }).click();
  const show = page.getByRole("button", { name: "Show controls", exact: true });
  await show.focus();
  await expect(show).toBeFocused();
  const iframe = page.locator(`iframe[title="${gameTitle} game"]`);
  await expect(iframe).not.toBeFocused();
  await show.click();
  await expect(controls).toBeVisible();
  await expect(iframe).toBeFocused();
  await controls.getByRole("button", { name: "Move right", exact: true }).click();
  await expect(page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("#focused-key-events")).toHaveText(JSON.stringify([
    { type: "keydown", code: "ArrowRight", key: "ArrowRight" },
    { type: "keyup", code: "ArrowRight", key: "ArrowRight" },
  ]));
});

test("should defer game focus until the keyboard toggle key is released", async ({ page }) => {
  await openPlayer(page);
  const controls = page.getByRole("region", { name: "Game controls", exact: true });
  if (await controls.isVisible()) await page.getByRole("button", { name: "Hide controls", exact: true }).click();
  const iframe = page.locator(`iframe[title="${gameTitle} game"]`);
  const show = page.getByRole("button", { name: "Show controls", exact: true });
  await show.focus();
  await page.keyboard.down("Enter");
  await expect(controls).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide controls", exact: true })).toBeFocused();
  await expect(iframe).not.toBeFocused();
  await page.keyboard.up("Enter");
  await expect(iframe).toBeFocused();
  expect(await recordedKeys(page)).toEqual([]);
  const hide = page.getByRole("button", { name: "Hide controls", exact: true });
  await hide.focus();
  await page.keyboard.down("Enter");
  await expect(controls).toBeHidden();
  await expect(page.getByRole("button", { name: "Show controls", exact: true })).toBeFocused();
  await page.keyboard.up("Enter");
  await expect(iframe).toBeFocused();
  expect(await recordedKeys(page)).toEqual([]);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => recordedKeys(page)).toEqual([
    { type: "keydown", code: "ArrowRight", key: "ArrowRight" },
    { type: "keyup", code: "ArrowRight", key: "ArrowRight" },
  ]);
});

test("should keep Space toggle activation and release in the website", async ({ page }) => {
  await openPlayer(page);
  const controls = page.getByRole("region", { name: "Game controls", exact: true });
  if (await controls.isVisible()) await page.getByRole("button", { name: "Hide controls", exact: true }).click();
  const iframe = page.locator(`iframe[title="${gameTitle} game"]`);
  for (const name of ["Show controls", "Hide controls"]) {
    const toggle = page.getByRole("button", { name, exact: true });
    const wasVisible = await controls.isVisible();
    await toggle.focus();
    await page.keyboard.down("Space");
    await expect(toggle).toBeFocused();
    expect(await controls.isVisible()).toBe(wasVisible);
    await page.keyboard.up("Space");
    await expect(iframe).toBeFocused();
    await expect(controls).toBeVisible({ visible: !wasVisible });
    expect(await recordedKeys(page)).toEqual([]);
  }
});

test("should resume focused bridge input after the website toolbar takes focus", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  await page.getByRole("button", { name: "Back to games", exact: true }).focus();
  const iframe = page.locator(`iframe[title="${gameTitle} game"]`);
  await expect(iframe).not.toBeFocused();
  await page.getByRole("region", { name: "Game controls", exact: true })
    .getByRole("button", { name: "Move right", exact: true }).click();
  await expect(iframe).toBeFocused();
  await expect(page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("#focused-key-events")).toHaveText(JSON.stringify([
    { type: "keydown", code: "ArrowRight", key: "ArrowRight" },
    { type: "keyup", code: "ArrowRight", key: "ArrowRight" },
  ]));
});

test("should deliver one focused action after releasing an overlay activation key", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  const iframe = page.locator(`iframe[title="${gameTitle} game"]`);
  const action = page.getByRole("region", { name: "Game controls", exact: true })
    .getByRole("button", { name: "A (Z key)", exact: true });
  const expected: RecordedKey[] = [];
  for (const key of ["Enter", "Space"]) {
    await action.focus();
    await page.keyboard.down(key);
    await expect(action).toBeFocused();
    expect(await recordedKeys(page)).toEqual(expected);
    await page.keyboard.up(key);
    expected.push({ type: "keydown", code: "KeyZ", key: "z" }, { type: "keyup", code: "KeyZ", key: "z" });
    await expect(iframe).toBeFocused();
    await expect(page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("#focused-key-events")).toHaveText(JSON.stringify(expected));
    expect(await recordedKeys(page)).toEqual(expected);
  }
});

test("should cancel an overlay keyboard action when its focus or frame changes", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  const action = page.getByRole("region", { name: "Game controls", exact: true })
    .getByRole("button", { name: "A (Z key)", exact: true });
  await action.focus();
  await page.keyboard.down("Enter");
  await page.getByRole("button", { name: "Back to games", exact: true }).focus();
  await page.keyboard.up("Enter");
  expect(await recordedKeys(page)).toEqual([]);
  await action.focus();
  await page.keyboard.down("Enter");
  const replacement = page.waitForEvent("framenavigated", { predicate: (frame) => frame.url().endsWith("?replacement=1") });
  await page.locator(`iframe[title="${gameTitle} game"]`).evaluate((element) => {
    const frame = element as HTMLIFrameElement;
    frame.addEventListener("load", () => frame.setAttribute("data-fixture-loaded", "true"), { once: true });
    frame.src = `${frame.src}?replacement=1`;
  });
  await replacement;
  await expect(page.locator(`iframe[title="${gameTitle} game"]`)).toHaveAttribute("data-fixture-loaded", "true");
  await expect(page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("#key-events")).toHaveText("[]");
  await expect(action).toBeFocused();
  await page.keyboard.up("Enter");
  expect(await recordedKeys(page)).toEqual([]);
});

test("should cancel interrupted keyboard input and ignore activation repeats", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  const action = page.getByRole("region", { name: "Game controls", exact: true })
    .getByRole("button", { name: "A (Z key)", exact: true });
  await action.focus();
  await page.keyboard.down("Enter");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.keyboard.up("Enter");
  await expect(action).toBeFocused();
  expect(await recordedKeys(page)).toEqual([]);
  await page.keyboard.down("Enter");
  await page.keyboard.down("Enter");
  expect(await recordedKeys(page)).toEqual([]);
  await page.keyboard.up("Enter");
  await expect.poll(() => recordedKeys(page)).toEqual([
    { type: "keydown", code: "KeyZ", key: "z" },
    { type: "keyup", code: "KeyZ", key: "z" },
  ]);
});

test("should retain a cancelled activation release in the host during a pointer toggle", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  const controls = page.getByRole("region", { name: "Game controls", exact: true });
  await controls.getByRole("button", { name: "A (Z key)", exact: true }).focus();
  await page.keyboard.down("Enter");
  await page.getByRole("button", { name: "Hide controls", exact: true }).click();
  await expect(controls).toBeHidden();
  await expect(page.locator(`iframe[title="${gameTitle} game"]`)).not.toBeFocused();
  await page.keyboard.up("Enter");
  expect(await recordedKeys(page)).toEqual([]);
  await page.getByRole("button", { name: "Show controls", exact: true }).click();
  await expect(page.locator(`iframe[title="${gameTitle} game"]`)).toBeFocused();
});

test("should clear cancelled host activation ownership when release reaches the frame", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  const controls = page.getByRole("region", { name: "Game controls", exact: true });
  await controls.getByRole("button", { name: "A (Z key)", exact: true }).focus();
  await page.keyboard.down("Enter");
  await page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("#key-events").click();
  await page.keyboard.up("Enter");
  await controls.getByRole("button", { name: "Move right", exact: true }).click();
  await expect.poll(() => recordedKeys(page)).toEqual([
    { type: "keyup", code: "Enter", key: "Enter" },
    { type: "keydown", code: "ArrowRight", key: "ArrowRight" },
    { type: "keyup", code: "ArrowRight", key: "ArrowRight" },
  ]);
});

test("should preserve overlay activation focus during a delayed first frame load", async ({ page }) => {
  let releaseFrame: () => void = () => {};
  const frameReady = new Promise<void>((resolve) => { releaseFrame = resolve; });
  await page.route("**/games/pokemon-dungeon-reimagined/**", async (route) => {
    await frameReady;
    await route.fulfill({ contentType: "text/html", body: inputFixture });
  });
  await page.goto("/");
  await page.getByRole("link", { name: portalName }).click();
  const opening = page.getByRole("button", { name: `Play ${gameTitle}`, exact: true }).click();
  await expect(page.getByTestId("game-player")).toBeVisible();
  await showControls(page);
  const iframe = page.locator(`iframe[title="${gameTitle} game"]`);
  await iframe.evaluate((element) => {
    element.addEventListener("load", () => element.setAttribute("data-fixture-loaded", "true"), { once: true });
  });
  const action = page.getByRole("region", { name: "Game controls", exact: true })
    .getByRole("button", { name: "A (Z key)", exact: true });
  await action.focus();
  await page.keyboard.down("Enter");
  releaseFrame();
  await opening;
  await expect(iframe).toHaveAttribute("data-fixture-loaded", "true");
  await expect(page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("#key-events")).toHaveText("[]");
  await expect(action).toBeFocused();
  await page.keyboard.up("Enter");
  expect(await recordedKeys(page)).toEqual([]);
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


test("should recheck a captured text field before releasing an overlay confirmation", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  const field = page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("#confirm-input");
  const action = page.getByRole("region", { name: "Game controls", exact: true })
    .getByRole("button", { name: "A (Z key)", exact: true });
  await field.focus();
  await action.focus();
  await page.keyboard.down("Enter");
  await field.evaluate((element) => element.setAttribute("readonly", ""));
  await page.keyboard.up("Enter");
  await expect(action).toBeFocused();
  expect(await recordedKeys(page)).toEqual([]);
  await expect(field).toHaveValue("  exact  ");
});

test("should restore the exact opted-in field for an overlay keyboard confirmation", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  const field = page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("#confirm-input");
  const action = page.getByRole("region", { name: "Game controls", exact: true })
    .getByRole("button", { name: "A (Z key)", exact: true });
  await field.evaluate((element) => element.addEventListener("keydown", () => {
    element.setAttribute("data-fixture-confirmed", "true");
  }, { once: true }));
  await field.focus();
  await action.focus();
  await page.keyboard.down("Enter");
  expect(await recordedKeys(page)).toEqual([]);
  await page.keyboard.up("Enter");
  await expect(field).toBeFocused();
  await expect(field).toHaveAttribute("data-fixture-confirmed", "true");
  expect(await recordedKeys(page)).toEqual([
    { type: "keydown", code: "KeyZ", key: "z" },
    { type: "keyup", code: "KeyZ", key: "z" },
  ]);
  await expect(field).toHaveValue("  exact  ");
});

test("should reject a replacement for a captured confirmation field", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  const field = page.frameLocator(`iframe[title="${gameTitle} game"]`).locator("#confirm-input");
  const action = page.getByRole("region", { name: "Game controls", exact: true })
    .getByRole("button", { name: "A (Z key)", exact: true });
  await field.focus();
  await action.focus();
  await page.keyboard.down("Enter");
  await field.evaluate((element) => element.replaceWith(element.cloneNode(true)));
  await page.keyboard.up("Enter");
  await expect(action).toBeFocused();
  expect(await recordedKeys(page)).toEqual([]);
});

test("should keep host-page typing protected from overlay keys", async ({ page }) => {
  await openPlayer(page);
  await showControls(page);
  await page.getByTestId("game-player").evaluate((player) => {
    const field = document.createElement("input");
    field.id = "host-typing-fixture";
    field.value = "host text";
    player.append(field);
    field.focus();
  });
  const field = page.locator("#host-typing-fixture");
  for (const name of ["A (Z key)", "Start (Enter key)", "Move left"]) {
    await page.getByRole("region", { name: "Game controls", exact: true })
      .getByRole("button", { name, exact: true }).click();
    await expect(field).toBeFocused();
    await expect(field).toHaveValue("host text");
  }
  expect(await recordedKeys(page)).toEqual([]);
});
