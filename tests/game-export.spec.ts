import { test, expect } from "@playwright/test";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { exportGames } from "../scripts/export-games.mjs";

test("should export complete games with their relative scripts and assets", async () => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "arcade-export-"));
  try {
    const source = path.join(repositoryRoot, "games", "sample");
    await mkdir(path.join(source, "assets"), { recursive: true });
    await writeFile(path.join(source, "index.html"), '<script src="./game.js"></script>');
    await writeFile(path.join(source, "game.js"), 'fetch("./assets/level.json");');
    await writeFile(path.join(source, "assets", "level.json"), '{"level":1}');

    await exportGames(repositoryRoot);
    const exported = path.join(repositoryRoot, "out", "games", "sample");
    expect(await readFile(path.join(exported, "index.html"), "utf8")).toContain('./game.js');
    expect(await readFile(path.join(exported, "game.js"), "utf8")).toContain('./assets/level.json');
    expect(JSON.parse(await readFile(path.join(exported, "assets", "level.json"), "utf8"))).toEqual({ level: 1 });
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
});

test("should leave the export alone until a games folder exists", async () => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "arcade-empty-"));
  try {
    await mkdir(path.join(repositoryRoot, "out"));
    await writeFile(path.join(repositoryRoot, "out", "index.html"), "Home");
    await exportGames(repositoryRoot);
    expect(await readdir(path.join(repositoryRoot, "out"))).toEqual(["index.html"]);
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
});
