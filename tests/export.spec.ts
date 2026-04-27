import { test, expect } from "@playwright/test";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { DERIVED_CONFIG, SITE_CONFIG } from "../src/config/site";

function getSocialIconFiles(): string[] {
  const socialIconFiles: string[] = [];

  if (SITE_CONFIG.socialLinks.github.length > 0) {
    socialIconFiles.push("github.png");
  }
  if (SITE_CONFIG.socialLinks.linkedin.length > 0) {
    socialIconFiles.push("linkedin.png");
  }
  if (SITE_CONFIG.socialLinks.huggingface.length > 0) {
    socialIconFiles.push("huggingface.png");
  }
  if (SITE_CONFIG.socialLinks.gitlab.length > 0) {
    socialIconFiles.push("gitlab.png");
  }

  return socialIconFiles;
}

function getIconPathCandidates(filename: string): string[] {
  const expectedBasePath = DERIVED_CONFIG.githubPagesBasePath;

  return [
    expectedBasePath.length > 0 ? `${expectedBasePath}/${filename}` : `/${filename}`,
    `/${filename}`,
  ];
}

function isBlockedRawGitHubHost(urlValue: string): boolean {
  try {
    const parsedUrl = new URL(urlValue, "https://example.invalid");
    return parsedUrl.hostname === "raw.githubusercontent.com";
  } catch {
    return false;
  }
}

test("should export bundled social icon assets with valid local paths", async () => {
  const outputDir = path.resolve(process.cwd(), "out");
  const exportIndexPath = path.join(outputDir, "index.html");

  const exportHtml = await readFile(exportIndexPath, "utf8").catch(() => {
    throw new Error(
      "Missing exported index HTML at out/index.html. Run `npm run build` before Playwright tests.",
    );
  });

  const socialIconFiles = getSocialIconFiles();

  for (const filename of socialIconFiles) {
    await expect(
      access(path.join(outputDir, filename)).then(() => true).catch(() => false),
    ).resolves.toBe(true);
  }

  socialIconFiles.forEach((filename) => {
    const pathCandidates = getIconPathCandidates(filename);
    const hasExpectedPath = pathCandidates.some((pathCandidate) =>
      exportHtml.includes(`src="${pathCandidate}"`),
    );

    expect(hasExpectedPath).toBe(true);
  });

  const srcAttributeMatches = Array.from(exportHtml.matchAll(/src="([^"]+)"/g));
  const hasBlockedRawGitHubSource = srcAttributeMatches.some((srcMatch) =>
    isBlockedRawGitHubHost(srcMatch[1] ?? ""),
  );

  expect(hasBlockedRawGitHubSource).toBe(false);
});
