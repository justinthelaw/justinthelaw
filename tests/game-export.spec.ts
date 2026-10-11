import { test, expect } from "@playwright/test";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
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

test("should export only a game's declared distribution", async () => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "arcade-scoped-export-"));
  try {
    const source = path.join(repositoryRoot, "games", "sample");
    await mkdir(path.join(source, "assets"), { recursive: true });
    await writeFile(path.join(source, "index.html"), "Scoped game fixture");
    await writeFile(path.join(source, "assets", "sprite.txt"), "Fixture asset");
    await writeFile(path.join(source, "unused.txt"), "Not part of the game");
    await writeFile(path.join(source, "distribution.json"), JSON.stringify({
      version: 1, files: ["index.html", "assets/sprite.txt"],
    }));
    await exportGames(repositoryRoot);
    const exported = path.join(repositoryRoot, "out", "games", "sample");
    expect((await readdir(exported)).sort()).toEqual(["assets", "index.html"]);
    expect(await readFile(path.join(exported, "assets", "sprite.txt"), "utf8")).toBe("Fixture asset");
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
});

test("should reject a distribution that escapes its game directory", async () => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "arcade-unsafe-export-"));
  try {
    const source = path.join(repositoryRoot, "games", "sample");
    await mkdir(source, { recursive: true });
    await writeFile(path.join(repositoryRoot, "games", "private.txt"), "Private fixture");
    await writeFile(path.join(source, "distribution.json"), JSON.stringify({
      version: 1, files: ["../private.txt"],
    }));
    await expect(exportGames(repositoryRoot)).rejects.toThrow("Unsafe game distribution path");
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
});

test("should reject stale files after a distribution is reduced", async () => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "arcade-stale-export-"));
  try {
    const source = path.join(repositoryRoot, "games", "sample");
    await mkdir(source, { recursive: true });
    await writeFile(path.join(source, "index.html"), "Scoped fixture");
    await writeFile(path.join(source, "old.txt"), "Old resource");
    const manifest = path.join(source, "distribution.json");
    await writeFile(manifest, JSON.stringify({ version: 1, files: ["index.html", "old.txt"] }));
    await exportGames(repositoryRoot);
    await writeFile(manifest, JSON.stringify({ version: 1, files: ["index.html"] }));
    await expect(exportGames(repositoryRoot)).rejects.toThrow("stale resources");
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
});

test("should reject a linked export destination", async () => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "arcade-linked-export-"));
  try {
    const source = path.join(repositoryRoot, "games", "sample");
    const outside = path.join(repositoryRoot, "outside");
    await mkdir(source, { recursive: true });
    await mkdir(outside);
    await writeFile(path.join(source, "index.html"), "Inert fixture");
    await writeFile(path.join(source, "distribution.json"), JSON.stringify({ version: 1, files: ["index.html"] }));
    await symlink(outside, path.join(repositoryRoot, "out"), "dir");
    await expect(exportGames(repositoryRoot)).rejects.toThrow("symbolic links");
    expect(await readdir(outside)).toEqual([]);
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
});
