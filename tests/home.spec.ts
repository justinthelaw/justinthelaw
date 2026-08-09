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
});
