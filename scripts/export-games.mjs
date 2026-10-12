import { cp, lstat, mkdir, readFile, readdir, realpath, stat } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

async function assertSafeOutput(repositoryRoot, target, directory = false) {
  const local = relative(repositoryRoot, target);
  if (!local || local === ".." || local.startsWith(`..${sep}`)) throw new Error("Output leaves the selected repository");
  const parts = local.split(sep);
  let current = repositoryRoot;
  for (let index = 0; index < parts.length; index += 1) {
    current = resolve(current, parts[index]);
    const info = await lstat(current).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (!info) continue;
    if (info.isSymbolicLink()) throw new Error("Game export destinations must not contain symbolic links");
    if ((directory || index < parts.length - 1) && !info.isDirectory()) {
      throw new Error("Game export parent must be a directory");
    }
    if (!directory && index === parts.length - 1 && !info.isFile()) {
      throw new Error("Game export destination must be a regular file");
    }
  }
}

async function existingFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const result = [];
  for (const entry of entries) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) result.push(...await existingFiles(resolve(directory, entry.name), name));
    else result.push(name);
  }
  return result;
}

/** Copy a game's declared static distribution, or its complete legacy tree. */
async function exportGame(source, destination, repositoryRoot) {
  await assertSafeOutput(repositoryRoot, destination, true);
  const manifestPath = resolve(source, "distribution.json");
  const raw = await readFile(manifestPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (raw === null) {
    await cp(source, destination, { recursive: true });
    return;
  }
  if (raw.length > 1_000_000) throw new Error("Game distribution manifest is too large");
  const manifest = JSON.parse(raw);
  if (manifest.version !== 1 || !Array.isArray(manifest.files) || !manifest.files.length ||
      manifest.files.length > 10_000 || new Set(manifest.files).size !== manifest.files.length) {
    throw new Error("Invalid game distribution manifest");
  }
  const canonicalRoot = await realpath(source);
  const files = [];
  for (const filename of manifest.files) {
    if (typeof filename !== "string" || !filename || filename.startsWith("/") ||
        filename.split("/").some((part) => !part || part === "." || part === "..") ||
        /[\\?#%]/.test(filename) || filename.includes(String.fromCharCode(0))) throw new Error("Unsafe game distribution path");
    const input = resolve(source, filename);
    const canonical = await realpath(input);
    const local = relative(canonicalRoot, canonical);
    if (local.startsWith(`..${sep}`) || local === ".." || !local || !(await lstat(input)).isFile()) {
      throw new Error("Game distribution resources must be local regular files");
    }
    files.push({ input, output: resolve(destination, filename) });
  }
  const allowed = new Set(manifest.files);
  const stale = (await existingFiles(destination)).filter((filename) => !allowed.has(filename));
  if (stale.length) throw new Error("The game export contains stale resources; use a clean output directory");
  await mkdir(destination, { recursive: true });
  for (const file of files) {
    await assertSafeOutput(repositoryRoot, file.output);
    await mkdir(dirname(file.output), { recursive: true });
    await cp(file.input, file.output);
  }
}

/** Static manifests keep authoring history and unselected campaigns out of Pages. */
export async function exportGames(repositoryRoot = process.cwd()) {
  const source = resolve(repositoryRoot, "games");
  const sourceInfo = await stat(source).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!sourceInfo) return;
  if (!sourceInfo.isDirectory()) throw new Error("games must be a directory");
  const destination = resolve(repositoryRoot, "out", "games");
  await assertSafeOutput(repositoryRoot, destination, true);
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const input = resolve(source, entry.name);
    const output = resolve(destination, entry.name);
    if (entry.isDirectory()) await exportGame(input, output, repositoryRoot);
    else if (entry.isFile()) { await assertSafeOutput(repositoryRoot, output); await cp(input, output); }
  }
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "")) {
  await exportGames();
}
