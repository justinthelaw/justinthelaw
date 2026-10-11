import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "acorn";
import { minify } from "terser";

/** @typedef {{ source: string, output: string, sha256: string, imports: Record<string, string> }} InputModule */

const toolsRoot = fileURLToPath(new URL("../", import.meta.url));
const outputRoot = path.resolve(toolsRoot, "../../games/pokemon-dungeon-reimagined/vendor/three");
const packageRoot = path.join(toolsRoot, "node_modules/three");
const version = "0.186.1";
const integrity = "sha512-blFeqb49wRCSGUGj7gtpfnSGHy2lwDk94RhUmS1c/hTby70kvChbWpkJ4Pm1390LqzzvTmzgXKHPEafJwCb8jA==";
const licenseHash = "8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc";
const maxFileBytes = 1_048_576;
const arguments_ = process.argv.slice(2);
if (arguments_.length > 1 || (arguments_.length === 1 && arguments_[0] !== "--check")) {
  throw new Error("Usage: node scripts/vendor.mjs [--check]");
}
const checkOnly = arguments_[0] === "--check";

// Never follow existing output-path symlinks, including ancestor directories.
async function checkDestination(filename, directory) {
  const parts = path.resolve(filename).split(path.sep).filter(Boolean);
  let current = path.parse(path.resolve(filename)).root;
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    let entry;
    try { entry = await lstat(current); } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    const mustBeDirectory = index < parts.length - 1 || directory;
    if (entry.isSymbolicLink() || (mustBeDirectory ? !entry.isDirectory() : !entry.isFile())) {
      throw new Error(`Unsafe vendor destination: ${current}`);
    }
  }
}

/** @type {InputModule[]} */
const modules = [
  {
    source: "build/three.core.js", output: "three.core.min.js",
    sha256: "9edde002b066a9a05676a6127f67735b62baf399bdea529f2f7e31657da769e6",
    imports: {},
  },
  {
    source: "build/three.module.js", output: "three.module.min.js",
    sha256: "9052042d676cb0fdc1ddfefe193053f34b7ac0513a616fdac4535d49987812ea",
    imports: { "./three.core.js": "./three.core.min.js" },
  },
  {
    source: "examples/jsm/loaders/GLTFLoader.js", output: "GLTFLoader.min.js",
    sha256: "131c0f78c01d19368ae495caa65b3adaa10487810a36a05bb5901b769a35ac16",
    imports: {
      three: "./three.module.min.js",
      "../utils/BufferGeometryUtils.js": "./BufferGeometryUtils.min.js",
      "../utils/SkeletonUtils.js": "./SkeletonUtils.min.js",
    },
  },
  {
    source: "examples/jsm/utils/BufferGeometryUtils.js", output: "BufferGeometryUtils.min.js",
    sha256: "9fb63427ce6641fa14fd0baff9cc4d1b5f9c3d85fd084bf2e90e803c44ec1797",
    imports: { three: "./three.module.min.js" },
  },
  {
    source: "examples/jsm/utils/SkeletonUtils.js", output: "SkeletonUtils.min.js",
    sha256: "b1632a703206c3d830de9fcbe515696770d04b71a15ee6b50afa6d2c3298c86f",
    imports: { three: "./three.module.min.js" },
  },
];

/** @param {string | Uint8Array} bytes */
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Parse source text only; this never imports or executes a vendor module.
 * @param {string} code
 * @param {string} filename
 */
function importLiterals(code, filename) {
  /** @type {import("acorn").Token[]} */
  const tokens = [];
  const program = parse(code, { ecmaVersion: "latest", sourceType: "module", onToken: tokens });
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const token = tokens[i];
    const next = tokens[i + 1];
    if ((token.type.label === "import" || token.value === "require") && next.type.label === "(") {
      throw new Error(`${filename}: dynamic import/require is outside the vendor allowlist`);
    }
  }
  return program.body.flatMap((statement) => {
    if (statement.type !== "ImportDeclaration" && statement.type !== "ExportAllDeclaration" && statement.type !== "ExportNamedDeclaration") return [];
    if (!statement.source) return [];
    if (typeof statement.source.value !== "string") throw new Error(`${filename}: nonliteral module source`);
    return [{ value: statement.source.value, start: statement.source.start, end: statement.source.end }];
  });
}

/** @param {string} code @param {InputModule} module */
function rewriteImports(code, module) {
  const literals = importLiterals(code, module.source);
  const actual = [...new Set(literals.map((item) => item.value))].sort();
  const expected = Object.keys(module.imports).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${module.source}: import allowlist mismatch (${actual.join(", ")})`);
  }
  for (const literal of literals.reverse()) {
    code = code.slice(0, literal.start) + JSON.stringify(module.imports[literal.value]) + code.slice(literal.end);
  }
  return code;
}

/** @type {import("terser").MinifyOptions} */
const minifyOptions = {
  ecma: 2022,
  module: true,
  compress: { passes: 2 },
  mangle: true,
  format: { comments: /@license|@preserve|^!/ },
};
const lock = JSON.parse(await readFile(path.join(toolsRoot, "package-lock.json"), "utf8"));
const packageInfo = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
const lockedThree = lock.packages["node_modules/three"];
if (packageInfo.version !== version || lockedThree?.version !== version || lockedThree?.integrity !== integrity) {
  throw new Error("Installed/locked Three.js does not match the reviewed version and integrity");
}
for (const [name, expected] of [["terser", "5.51.2"], ["acorn", "8.18.0"]]) {
  const installed = JSON.parse(await readFile(path.join(toolsRoot, "node_modules", name, "package.json"), "utf8"));
  if (installed.version !== expected || lock.packages[`node_modules/${name}`]?.version !== expected) {
    throw new Error(`${name}: installed/locked version must be ${expected}`);
  }
}

/** @type {Map<string, string>} */
const outputs = new Map();
const records = [];
for (const module of modules) {
  const source = await readFile(path.join(packageRoot, module.source), "utf8");
  if (sha256(source) !== module.sha256) throw new Error(`${module.source}: source SHA-256 mismatch`);
  const result = await minify(rewriteImports(source, module), minifyOptions);
  if (!result.code) throw new Error(`${module.source}: minifier produced no code`);
  const code = `/*! three.js ${version} | MIT | see LICENSE */\n${result.code}\n`;
  const imports = [...new Set(importLiterals(code, module.output).map((item) => item.value))].sort();
  const expected = [...new Set(Object.values(module.imports))].sort();
  if (JSON.stringify(imports) !== JSON.stringify(expected)) throw new Error(`${module.output}: generated import mismatch`);
  for (const specifier of imports) {
    if (!specifier.startsWith("./") || !modules.some((entry) => entry.output === specifier.slice(2))) {
      throw new Error(`${module.output}: import is not a generated local module`);
    }
  }
  outputs.set(module.output, code);
  records.push({ source: module.source, sourceSha256: module.sha256, sourceBytes: Buffer.byteLength(source), output: module.output, sha256: sha256(code), encodedBytes: Buffer.byteLength(code), imports });
}
const license = await readFile(path.join(packageRoot, "LICENSE"), "utf8");
if (sha256(license) !== licenseHash) throw new Error("Three.js LICENSE SHA-256 mismatch");
outputs.set("LICENSE", license);
const provenance = {
  schemaVersion: 1,
  package: { name: "three", version, source: `https://registry.npmjs.org/three/-/three-${version}.tgz`, integrity, license: "MIT", licenseFile: "LICENSE", licenseSha256: licenseHash },
  generator: { script: "tools/pokemon-dungeon/scripts/vendor.mjs", terser: "5.51.2", acorn: "8.18.0", options: { ecma: 2022, module: true, compressPasses: 2, mangle: true, retainedComments: "@license|@preserve|^!" } },
  scope: "WebGL2 engine and GLTFLoader static dependency closure; no game code or decoder packages",
  files: records,
};
outputs.set("provenance.json", `${JSON.stringify(provenance, null, 2)}\n`);
for (const [name, content] of outputs) {
  if (Buffer.byteLength(content) > maxFileBytes) throw new Error(`${name}: exceeds 1,024 KiB file limit`);
}
const coreBytes = records.filter((record) => record.source.startsWith("build/")).reduce((sum, record) => sum + record.encodedBytes, 0);
if (coreBytes >= maxFileBytes) throw new Error("Combined engine modules exceed the under-1-MiB target");
await checkDestination(outputRoot, true);
let existing = [];
try { existing = await readdir(outputRoot); } catch (error) {
  if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
  if (checkOnly) throw new Error("Vendor output is absent; run npm run vendor", { cause: error });
}
for (const name of existing) {
  if (!outputs.has(name)) throw new Error(`Unexpected vendor file ${name}; inspect it before regeneration`);
}
if (!checkOnly) await mkdir(outputRoot, { recursive: true });
for (const [name, content] of outputs) {
  const destination = path.join(outputRoot, name);
  await checkDestination(destination, false);
  if (checkOnly) {
    if (await readFile(destination, "utf8") !== content) throw new Error(`${name}: stale or modified; regenerate and review`);
  } else {
    await writeFile(destination, content);
  }
}
console.log(`${checkOnly ? "Verified" : "Generated"} ${outputs.size} vendor files; engine ${coreBytes} bytes; all static imports local.`);
