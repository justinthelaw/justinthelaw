import { test as base } from "@playwright/test";

export { expect, type Locator, type Page } from "@playwright/test";

export const inertGameFixture = "<!doctype html><html><body>Website game fixture</body></html>";

/** Keep UI checks independent of third-party availability and TLS handshakes.
 * Individual tests can override these page routes with explicit responses.
 * Game URLs default to inert HTML; website code and local assets remain real.
 */
export const test = base.extend({
  page: async ({ page }, providePage) => {
    await page.route("**/games/**", (route) =>
      route.fulfill({ contentType: "text/html", body: inertGameFixture }),
    );
    await page.route("https://api.github.com/users/**", (route) =>
      route.fulfill({ status: 503, body: "Profile fixture unavailable" }),
    );
    await page.route("https://drive.google.com/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><html><body>Resume preview fixture</body></html>",
      }),
    );
    await page.route("https://avatars.githubusercontent.com/**", (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#cad5e2"/></svg>',
      }),
    );
    await providePage(page);
  },
});
