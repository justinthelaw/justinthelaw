import { test, expect } from "@playwright/test";
import { DERIVED_CONFIG, SITE_CONFIG } from "../src/config/site";

function getSocialIconFiles(): string[] {
  const socialIconFiles: string[] = [];

  if (SITE_CONFIG.socialLinks.github.length > 0) {
    socialIconFiles.push('github.png');
  }
  if (SITE_CONFIG.socialLinks.linkedin.length > 0) {
    socialIconFiles.push('linkedin.png');
  }
  if (SITE_CONFIG.socialLinks.huggingface.length > 0) {
    socialIconFiles.push('huggingface.png');
  }
  if (SITE_CONFIG.socialLinks.gitlab.length > 0) {
    socialIconFiles.push('gitlab.png');
  }

  return socialIconFiles;
}

test.describe('Homepage E2E Tests', () => {
  test('should load homepage and display key elements', async ({ page }) => {
    // Navigate to the homepage
    await page.goto("/");

    // Verify the page loads without errors (no 404 or 500 status)
    await expect(page).toHaveTitle(new RegExp(SITE_CONFIG.fullName));

    // Assert that the main header is visible with the configured name
    await expect(page.getByTestId("main-header")).toBeVisible();
    await expect(page.getByTestId("main-header")).toHaveText(
      SITE_CONFIG.fullName,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: SITE_CONFIG.fullName }),
    ).toBeVisible();

    // Assert that the AI Chatbot button is visible
    await expect(page.getByTestId("ai-chatbot-button")).toBeVisible();

    // Verify social media icons are present in footer
    await expect(page.getByTestId("social-footer")).toBeVisible();

    // Check for configured social links (only if they are set)
    if (SITE_CONFIG.socialLinks.github) {
      await expect(
        page.locator(`a[href*="github.com/${SITE_CONFIG.githubUsername}"]`),
      ).toBeVisible();
    }
    if (SITE_CONFIG.socialLinks.linkedin) {
      await expect(
        page.locator(`a[href="${SITE_CONFIG.socialLinks.linkedin}"]`),
      ).toBeVisible();
    }
    if (SITE_CONFIG.socialLinks.huggingface) {
      await expect(
        page.locator(`a[href="${SITE_CONFIG.socialLinks.huggingface}"]`),
      ).toBeVisible();
    }
    if (SITE_CONFIG.socialLinks.gitlab) {
      await expect(
        page.locator(`a[href="${SITE_CONFIG.socialLinks.gitlab}"]`),
      ).toBeVisible();
    }

    const resumeLink = page.getByRole("link", {
      name: "Open resume in Google Drive",
    });
    await expect(resumeLink).toBeVisible();
    await expect(resumeLink).toHaveAttribute(
      "href",
      `https://drive.google.com/file/d/${SITE_CONFIG.resumeFileId}/view?usp=sharing`,
    );
    await expect(resumeLink).toHaveAttribute("target", "_blank");
    await expect(resumeLink).toHaveAttribute("rel", "noopener noreferrer");
    await expect(
      page.getByTestId("resume-viewer").getByTestId("resume-drive-link"),
    ).toBeVisible();

    const resumeViewerBox = await page
      .getByTestId("resume-viewer")
      .boundingBox();
    const resumeLinkBox = await resumeLink.boundingBox();

    expect(resumeViewerBox).not.toBeNull();
    expect(resumeLinkBox).not.toBeNull();
    expect(resumeLinkBox!.x).toBeGreaterThanOrEqual(resumeViewerBox!.x - 1);
    expect(resumeLinkBox!.y).toBeGreaterThanOrEqual(resumeViewerBox!.y - 1);
    expect(resumeLinkBox!.x + resumeLinkBox!.width).toBeLessThanOrEqual(
      resumeViewerBox!.x + resumeViewerBox!.width + 1,
    );
    expect(resumeLinkBox!.y + resumeLinkBox!.height).toBeLessThanOrEqual(
      resumeViewerBox!.y + resumeViewerBox!.height + 1,
    );
    expect(resumeLinkBox!.x + resumeLinkBox!.width / 2).toBeLessThan(
      resumeViewerBox!.x + resumeViewerBox!.width / 2,
    );
    expect(resumeLinkBox!.y + resumeLinkBox!.height / 2).toBeLessThan(
      resumeViewerBox!.y + resumeViewerBox!.height / 2,
    );

    await resumeLink.focus();
    await expect(page.getByTestId("resume-drive-tooltip")).toHaveText(
      "Open in Google Drive",
    );
  });

  test("should open AI chatbot when button is clicked", async ({ page }) => {
    await page.goto("/");

    // Ensure AI Chatbot button is visible
    const chatbotButton = page.getByTestId("ai-chatbot-button");
    await expect(chatbotButton).toBeVisible();

    // Click the AI Chatbot button
    await chatbotButton.click();

    // Verify that the chatbot button is no longer visible (indicating chatbox opened)
    await expect(chatbotButton).not.toBeVisible();
    await expect(
      page.getByRole("dialog", { name: "AI Chatbot" }),
    ).toBeVisible();
  });

  test("should keep the larger desktop chatbot anchored bottom-right", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name.startsWith("Mobile"),
      "Desktop layout applies at the lg breakpoint",
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.getByTestId("ai-chatbot-button").click();

    const dialog = page.getByRole("dialog", { name: "AI Chatbot" });
    await expect(dialog).toBeVisible();

    const layout = await dialog.evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        bottom: Number.parseFloat(styles.bottom),
        height: Number.parseFloat(styles.height),
        position: styles.position,
        right: Number.parseFloat(styles.right),
        rootFontSize: Number.parseFloat(
          window.getComputedStyle(document.documentElement).fontSize,
        ),
        width: Number.parseFloat(styles.width),
      };
    });

    expect(layout.position).toBe("fixed");
    expect(layout.right).toBeCloseTo(24, 0);
    expect(layout.bottom).toBeCloseTo(24, 0);
    expect(layout.width / layout.rootFontSize).toBeGreaterThan(24);
    expect(layout.height / layout.rootFontSize).toBeGreaterThan(37.5);
  });

  test("should retain the configured profile description when GitHub fails", async ({
    page,
  }) => {
    await page.route(
      `https://api.github.com/users/${SITE_CONFIG.githubUsername}`,
      async (route) => {
        await route.fulfill({ status: 503, body: "Service Unavailable" });
      },
    );
    await page.goto("/");

    const bioElement = page.getByTestId("github-bio");
    await expect(bioElement).toBeVisible();
    await expect(bioElement).toHaveText(SITE_CONFIG.githubBioFallback);
  });

  test("should refresh the configured profile description from GitHub", async ({
    page,
  }) => {
    const liveBio = "Live GitHub profile description";
    await page.route(
      `https://api.github.com/users/${SITE_CONFIG.githubUsername}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ bio: liveBio }),
        });
      },
    );
    await page.goto("/");

    await expect(page.getByTestId("github-bio")).toHaveText(liveBio);
  });

  test("should expose canonical and social share metadata", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      DERIVED_CONFIG.siteUrl,
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "profile",
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      DERIVED_CONFIG.siteUrl,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      SITE_CONFIG.seo.title,
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      SITE_CONFIG.seo.description,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      SITE_CONFIG.seo.imageUrl,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary",
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      "content",
      SITE_CONFIG.seo.title,
    );
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute(
      "content",
      SITE_CONFIG.seo.description,
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      "content",
      SITE_CONFIG.seo.imageUrl,
    );
  });

  test('should render social icons with deterministic src paths', async ({ page }) => {
    await page.goto('/');

    const socialIconFiles = getSocialIconFiles();
    const footerIcons = page.getByTestId('social-footer').locator('img');

    await expect(footerIcons).toHaveCount(socialIconFiles.length);

    for (let index = 0; index < socialIconFiles.length; index += 1) {
      const icon = footerIcons.nth(index);
      await expect(icon).toBeVisible();
      const resolvedSource = await icon.getAttribute('src');

      expect(resolvedSource).toBeTruthy();
      expect(resolvedSource?.endsWith(`/${socialIconFiles[index]}`)).toBe(true);
    }
  });

  test('should render larger social controls at every responsive tier', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      'One browser is sufficient for responsive CSS sizing',
    );

    const sizeTiers = [
      { viewportWidth: 375, previousControlRem: 2, previousIconRem: 1.5 },
      { viewportWidth: 640, previousControlRem: 2.25, previousIconRem: 1.75 },
      { viewportWidth: 768, previousControlRem: 2.5, previousIconRem: 2 },
    ];

    for (const sizeTier of sizeTiers) {
      await page.setViewportSize({ width: sizeTier.viewportWidth, height: 900 });
      await page.goto('/');

      const socialLinks = page.getByTestId('social-footer').getByRole('link');
      await expect(socialLinks).toHaveCount(getSocialIconFiles().length);

      const measurements = await socialLinks.evaluateAll((links) => {
        const rootFontSize = Number.parseFloat(
          window.getComputedStyle(document.documentElement).fontSize,
        );

        return links.map((link) => {
          const image = link.querySelector('img');
          if (!(image instanceof HTMLImageElement)) {
            throw new Error('Social link is missing its icon image');
          }

          const controlBounds = link.getBoundingClientRect();
          const iconBounds = image.getBoundingClientRect();

          return {
            controlHeightRem: controlBounds.height / rootFontSize,
            controlWidthRem: controlBounds.width / rootFontSize,
            iconHeightRem: iconBounds.height / rootFontSize,
            iconWidthRem: iconBounds.width / rootFontSize,
          };
        });
      });

      for (const measurement of measurements) {
        expect(measurement.controlWidthRem).toBeGreaterThan(
          sizeTier.previousControlRem,
        );
        expect(measurement.controlHeightRem).toBeGreaterThan(
          sizeTier.previousControlRem,
        );
        expect(measurement.iconWidthRem).toBeGreaterThan(
          sizeTier.previousIconRem,
        );
        expect(measurement.iconHeightRem).toBeGreaterThan(
          sizeTier.previousIconRem,
        );
      }
    }
  });
});
