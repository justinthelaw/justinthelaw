import { test, expect } from '@playwright/test';
import { SITE_CONFIG } from '../src/config/site';

test.describe('Homepage E2E Tests', () => {
  test('should load homepage and display key elements', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Verify the page loads without errors (no 404 or 500 status)
    await expect(page).toHaveTitle(new RegExp(SITE_CONFIG.fullName));

    // Assert that the main header is visible with the configured name
    await expect(page.getByTestId('main-header')).toBeVisible();
    await expect(page.getByTestId('main-header')).toHaveText(SITE_CONFIG.fullName);

    // Assert that the AI Chatbot button is visible
    await expect(page.getByTestId('ai-chatbot-button')).toBeVisible();

    // Verify social media icons are present in footer
    await expect(page.getByTestId('social-footer')).toBeVisible();

    // Check for configured social links (only if they are set)
    if (SITE_CONFIG.socialLinks.github) {
      await expect(page.locator(`a[href*="github.com/${SITE_CONFIG.githubUsername}"]`)).toBeVisible();
    }
    if (SITE_CONFIG.socialLinks.linkedin) {
      await expect(page.locator(`a[href="${SITE_CONFIG.socialLinks.linkedin}"]`)).toBeVisible();
    }
    if (SITE_CONFIG.socialLinks.huggingface) {
      await expect(page.locator(`a[href="${SITE_CONFIG.socialLinks.huggingface}"]`)).toBeVisible();
    }
    if (SITE_CONFIG.socialLinks.gitlab) {
      await expect(page.locator(`a[href="${SITE_CONFIG.socialLinks.gitlab}"]`)).toBeVisible();
    }
  });

  test('should open AI chatbot when button is clicked', async ({ page }) => {
    await page.goto('/');

    // Ensure AI Chatbot button is visible
    const chatbotButton = page.getByTestId('ai-chatbot-button');
    await expect(chatbotButton).toBeVisible();

    // Click the AI Chatbot button
    await chatbotButton.click();

    // Verify that the chatbot button is no longer visible (indicating chatbox opened)
    await expect(chatbotButton).not.toBeVisible();
  });

  test('should display GitHub profile description', async ({ page }) => {
    await page.goto('/');

    // Wait for the GitHub profile description to load and be visible
    const bioElement = page.getByTestId('github-bio');
    await expect(bioElement).toBeVisible({ timeout: 10000 });
    
    // Should contain some text (either actual bio or fallback)
    await expect(bioElement).not.toBeEmpty();
  });
});