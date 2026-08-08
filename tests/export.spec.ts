import { test, expect } from "@playwright/test";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import { createConnection } from "node:net";
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

async function getJavaScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getJavaScriptFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(entryPath);
    }
  }

  return files;
}

async function readExportedJavaScript(): Promise<string> {
  const chunksDir = path.resolve(process.cwd(), "out", "_next", "static");
  const files = await getJavaScriptFiles(chunksDir).catch(() => {
    throw new Error(
      "Missing exported JavaScript at out/_next/static. Run `npm run build` before Playwright tests.",
    );
  });
  const contents = await Promise.all(files.map((filePath) => readFile(filePath, "utf8")));

  return contents.join("\n");
}

interface StaticPreviewServer {
  origin: string;
  close: () => Promise<void>;
}

function sendRawRequest(port: number, request: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    let response = "";

    socket.setEncoding("utf8");
    socket.on("connect", () => socket.end(request));
    socket.on("data", (chunk: string) => {
      response += chunk;
    });
    socket.on("end", () => resolve(response));
    socket.on("error", reject);
  });
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

test("should export the current browser AI worker bundle", async () => {
  const exportedJavaScript = await readExportedJavaScript();

  expect(exportedJavaScript).toContain("justinthelaw/teapot-profile-qa-browser-1024");
  expect(exportedJavaScript).toContain("text2text-generation");
});

test("should embed the resume with Drive preview instead of a download viewer", async () => {
  const outputDir = path.resolve(process.cwd(), "out");
  const exportIndexPath = path.join(outputDir, "index.html");
  const exportHtml = await readFile(exportIndexPath, "utf8").catch(() => {
    throw new Error(
      "Missing exported index HTML at out/index.html. Run `npm run build` before Playwright tests.",
    );
  });
  const exportedJavaScript = await readExportedJavaScript();
  const exportedAssets = `${exportHtml}\n${exportedJavaScript}`;

  expect(exportHtml).toContain(
    `src="https://drive.google.com/file/d/${SITE_CONFIG.resumeFileId}/preview"`,
  );
  expect(exportedAssets).toContain(
    `https://drive.google.com/file/d/${SITE_CONFIG.resumeFileId}/view?usp=sharing`,
  );
  expect(exportedAssets).toContain("Open resume in Google Drive");
  expect(exportedAssets).not.toContain("docs.google.com/viewer");
  expect(exportedAssets).not.toContain("uc?export=download");
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

test("should reject malformed preview paths without stopping the server", async () => {
  const previewServer = await startStaticPreviewServer();

  try {
    const previewUrl = new URL(previewServer.origin);
    const malformedResponse = await fetch(`${previewUrl.origin}/%E0%A4%A`);
    expect(malformedResponse.status).toBe(400);

    const healthyResponse = await fetch(previewServer.origin);
    expect(healthyResponse.status).toBe(200);
  } finally {
    await previewServer.close();
  }
});

test("should reject malformed absolute request targets without stopping the server", async () => {
  const previewServer = await startStaticPreviewServer();

  try {
    const previewUrl = new URL(previewServer.origin);
    const response = await sendRawRequest(
      Number(previewUrl.port),
      "GET http://[ HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n",
    );
    expect(response).toContain(" 400 ");

    const healthyResponse = await fetch(previewServer.origin);
    expect(healthyResponse.status).toBe(200);
  } finally {
    await previewServer.close();
  }
});

test("should initialize the exported AI worker from the base path", async ({
  page,
}) => {
  const previewServer = await startStaticPreviewServer();
  const staticFailures: string[] = [];
  const workerLogs: string[] = [];

  page.on("response", (response) => {
    const responseUrl = response.url();
    if (responseUrl.includes("/_next/static/") && response.status() >= 400) {
      staticFailures.push(`${response.status()} ${responseUrl}`);
    }
  });

  page.on("console", (message) => {
    const text = message.text();
    if (text.includes("[AI WORKER]")) {
      workerLogs.push(text);
    }
  });

  await page.route("https://huggingface.co/**", (route) => {
    route.abort();
  });

  try {
    await page.goto(previewServer.origin);
    await page.getByTestId("ai-chatbot-button").click();

    await expect
      .poll(() =>
        workerLogs.some((line) => line.includes("[AI WORKER] initialized")),
      )
      .toBeTruthy();

    expect(staticFailures).toEqual([]);
  } finally {
    await previewServer.close();
  }
});
