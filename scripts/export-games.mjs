import { cp, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Copy complete browser games and their assets into the static Pages export. */
export async function exportGames(repositoryRoot = process.cwd()) {
  const source = resolve(repositoryRoot, "games");
  const sourceInfo = await stat(source).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!sourceInfo) return;
  if (!sourceInfo.isDirectory()) throw new Error("games must be a directory");
  await cp(source, resolve(repositoryRoot, "out", "games"), { recursive: true });
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "")) {
  await exportGames();
}
