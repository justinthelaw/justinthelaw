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

test("should export bundled social icon assets with valid local paths", async () => {
  const outputIndexPath = path.join(process.cwd(), "out", "index.html");
  const fallbackIndexPath = path.join(process.cwd(), ".next", "export", "index.html");
  const exportIndexPath = await access(outputIndexPath)
    .then(() => outputIndexPath)
    .catch(() => fallbackIndexPath);

  const exportHtml = await readFile(exportIndexPath, "utf8").catch(() => {
    throw new Error(
      "Missing exported index HTML (checked out/index.html and .next/export/index.html). Run `npm run build` before Playwright tests.",
    );
  });

  const socialIconFiles = getSocialIconFiles();
  const rootOutputDir = path.dirname(exportIndexPath);

  for (const filename of socialIconFiles) {
    await expect(
      access(path.join(rootOutputDir, filename)).then(() => true).catch(() => false),
    ).resolves.toBe(true);
  }

  socialIconFiles.forEach((filename) => {
    const pathCandidates = getIconPathCandidates(filename);
    const hasExpectedPath = pathCandidates.some((pathCandidate) =>
      exportHtml.includes(`src="${pathCandidate}"`),
    );

    expect(hasExpectedPath).toBe(true);
  });

  expect(exportHtml.includes("raw.githubusercontent.com")).toBe(false);
});
