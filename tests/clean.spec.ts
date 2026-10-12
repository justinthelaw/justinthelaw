import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cleanScript = fileURLToPath(new URL("../scripts/clean.mjs", import.meta.url));

function runClean(repositoryRoot: string): void {
  const result = spawnSync(process.execPath, [cleanScript], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  expect(result.status, result.stderr).toBe(0);
}

test("should remove only generated artifacts and tolerate absent targets", async () => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "clean-artifacts-"));
  try {
    for (const target of ["out", "test-results", "playwright-report", ".next"]) {
      await mkdir(path.join(repositoryRoot, target, "nested"), { recursive: true });
      await writeFile(path.join(repositoryRoot, target, "nested", "artifact.txt"), "Generated");
    }
    await writeFile(path.join(repositoryRoot, "test-results.json"), "{}");
    await mkdir(path.join(repositoryRoot, "keep"));
    await writeFile(path.join(repositoryRoot, "keep", "source.txt"), "Keep this source");
    await writeFile(path.join(repositoryRoot, "out-backup.txt"), "Keep this backup");

    runClean(repositoryRoot);
    runClean(repositoryRoot);

    expect((await readdir(repositoryRoot)).sort()).toEqual(["keep", "out-backup.txt"]);
    expect(await readFile(path.join(repositoryRoot, "keep", "source.txt"), "utf8")).toBe("Keep this source");
    expect(await readFile(path.join(repositoryRoot, "out-backup.txt"), "utf8")).toBe("Keep this backup");
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
});

test("should remove artifact links without following them outside the repository", async () => {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), "clean-linked-artifacts-"));
  try {
    const repositoryRoot = path.join(fixtureRoot, "repository");
    const outside = path.join(fixtureRoot, "outside");
    await mkdir(path.join(repositoryRoot, "out"), { recursive: true });
    await mkdir(outside);
    await writeFile(path.join(outside, "keep.txt"), "External source");
    const linkType = process.platform === "win32" ? "junction" : "dir";
    await symlink(outside, path.join(repositoryRoot, ".next"), linkType);
    await symlink(outside, path.join(repositoryRoot, "out", "linked"), linkType);

    runClean(repositoryRoot);

    expect(await readdir(repositoryRoot)).toEqual([]);
    expect(await readdir(outside)).toEqual(["keep.txt"]);
    expect(await readFile(path.join(outside, "keep.txt"), "utf8")).toBe("External source");
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
