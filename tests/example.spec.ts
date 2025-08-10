import { test, expect } from '@playwright/test';

test.describe('Homepage E2E Tests', () => {
  test('should load homepage and display key elements', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Verify the page loads without errors (no 404 or 500 status)
    await expect(page).toHaveTitle(/Justin Law/);

    // Assert that the main header "Justin Law" is visible
    await expect(page.getByTestId('main-header')).toBeVisible();
    await expect(page.getByTestId('main-header')).toHaveText('Justin Law');

    // Assert that the AI Chatbot button is visible
    await expect(page.getByTestId('ai-chatbot-button')).toBeVisible();

    // Verify social media icons are present in footer
    await expect(page.getByTestId('social-footer')).toBeVisible();

    // Check for GitHub, LinkedIn, HuggingFace, and GitLab links
    await expect(page.locator('a[href*="github.com/justinthelaw"]')).toBeVisible();
    await expect(page.locator('a[href*="linkedin.com/in/justinwingchunglaw"]')).toBeVisible();
    await expect(page.locator('a[href*="huggingface.co/justinthelaw"]')).toBeVisible();
    await expect(page.locator('a[href*="repo1.dso.mil/justinthelaw"]')).toBeVisible();
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

  test('should display resume fallback when iframe is blocked', async ({ page }) => {
    await page.goto('/');

    // Initially, the resume viewer should be visible
    await expect(page.getByTestId('resume-viewer')).toBeVisible();

    // The loading state should be shown first
    await expect(page.getByTestId('resume-loading')).toBeVisible();

    // Wait for the fallback to appear (timeout is 5 seconds)
    await expect(page.getByTestId('resume-fallback')).toBeVisible({ timeout: 7000 });

    // Verify fallback content is displayed
    await expect(page.getByText('Resume')).toBeVisible();
    await expect(page.getByText('The PDF preview may be blocked by your browser\'s security settings')).toBeVisible();

    // Verify the "View Resume" link is present and has correct attributes
    const resumeLink = page.getByTestId('resume-view-link');
    await expect(resumeLink).toBeVisible();
    await expect(resumeLink).toHaveText('View Resume');
    await expect(resumeLink).toHaveAttribute('href', 'https://drive.google.com/file/d/1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp/view');
    await expect(resumeLink).toHaveAttribute('target', '_blank');

    // Verify instruction text is present
    await expect(page.getByText('Click above to open the PDF in a new tab')).toBeVisible();
  });
});