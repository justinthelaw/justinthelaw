import { test, expect } from "@playwright/test";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
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

interface StaticPreviewServer {
  origin: string;
  close: () => Promise<void>;
}

async function startStaticPreviewServer(): Promise<StaticPreviewServer> {
  const child = spawn(process.execPath, ["scripts/serve-static-preview.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: "0",
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  const origin = await waitForPreviewServer(child);

  return {
    origin,
    close: () => stopStaticPreviewServer(child),
  };
}

function waitForPreviewServer(child: ChildProcessWithoutNullStreams): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Static preview server did not start.\n${output}`));
    }, 10_000);

    const cleanup = (): void => {
      clearTimeout(timeout);
      child.stdout.off("data", handleOutput);
      child.stderr.off("data", handleOutput);
      child.off("exit", handleExit);
    };

    const handleOutput = (chunk: Buffer): void => {
      output += chunk.toString();
      const previewUrlMatch = output.match(/Local preview: (http:\/\/[^\s]+)/);
      const previewUrl = previewUrlMatch?.[1];
      if (previewUrl) {
        cleanup();
        resolve(previewUrl);
      }
    };

    const handleExit = (code: number | null): void => {
      cleanup();
      reject(new Error(`Static preview server exited with code ${code ?? "unknown"}.\n${output}`));
    };

    child.stdout.on("data", handleOutput);
    child.stderr.on("data", handleOutput);
    child.once("exit", handleExit);
  });
}

function stopStaticPreviewServer(child: ChildProcessWithoutNullStreams): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, 5_000);

    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill("SIGTERM");
  });
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

test("should preview static export from the emitted base path", async () => {
  const socialIconFiles = getSocialIconFiles();
  const previewServer = await startStaticPreviewServer();

  try {
    const basePath = DERIVED_CONFIG.githubPagesBasePath;
    const previewUrl = new URL(previewServer.origin);
    const rootUrl = new URL("/", previewUrl.origin);

    if (basePath.length > 0) {
      const rootResponse = await fetch(rootUrl, { redirect: "manual" });
      expect(rootResponse.status).toBe(302);
      expect(rootResponse.headers.get("location")).toBe(`${basePath}/`);
      expect(previewUrl.pathname).toBe(`${basePath}/`);
    }

    const indexResponse = await fetch(previewServer.origin);
    expect(indexResponse.status).toBe(200);
    expect(indexResponse.headers.get("content-type")).toContain("text/html");

    const iconResponse = await fetch(new URL(`${basePath}/${socialIconFiles[0]}`, rootUrl));
    expect(iconResponse.status).toBe(200);
    expect(iconResponse.headers.get("content-type")).toBe("image/png");
  } finally {
    await previewServer.close();
  }
});
