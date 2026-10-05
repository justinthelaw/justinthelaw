import { realpath, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import * as acorn from 'acorn';

const toolRoot = fileURLToPath(new URL('../', import.meta.url));
const repositoryRoot = path.resolve(toolRoot, '../..');
const gameRoot = path.join(repositoryRoot, 'games/pokemon-dungeon-reimagined');
const roots = ['scripts', 'art', 'art-preview'].map(directory => path.join(toolRoot, directory));
roots.push(path.join(gameRoot, 'src'));

async function listSource(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const results = await Promise.all(entries.map(async entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return listSource(filename);
    return entry.isFile() && /\.(?:mjs|js)$/.test(entry.name) ? [filename] : [];
  }));
  return results.flat();
}

// Parse only: game modules must never be imported or evaluated by these checks.
function importsOf(node, imports = []) {
  if (node.type === 'ImportExpression') {
    if (node.source.type !== 'Literal' || typeof node.source.value !== 'string') {
      throw new Error('Dynamic module imports must have a statically checkable local path.');
    }
    imports.push(node.source.value);
  } else if (/^(ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration)$/.test(node.type) && node.source) {
    imports.push(node.source.value);
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'source' || key === 'type') continue;
    if (Array.isArray(value)) {
      for (const child of value) if (child && typeof child.type === 'string') importsOf(child, imports);
    } else if (value && typeof value.type === 'string') importsOf(value, imports);
  }
  return imports;
}

const sources = (await Promise.all(roots.map(listSource))).flat();
const linter = new ESLint({ cwd: repositoryRoot, overrideConfigFile: path.join(toolRoot, 'eslint.config.mjs') });
const results = await linter.lintFiles([...sources, path.join(toolRoot, 'eslint.config.mjs')]);
const formatted = await (await linter.loadFormatter('stylish')).format(results);
if (formatted) console.log(formatted);
let failed = results.some(result => result.errorCount || result.warningCount);
for (const filename of sources.filter(file => file.startsWith(`${gameRoot}${path.sep}`))) {
  try {
    const ast = acorn.parse(await readFile(filename, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' });
    for (const specifier of importsOf(ast)) {
      if (!/^\.\.?\//.test(specifier) || /[?#%\\]/.test(specifier) || !/\.(?:mjs|js)$/.test(specifier)) {
        throw new Error(`Imports must name a local JavaScript file: ${specifier}`);
      }
      const target = await realpath(path.resolve(path.dirname(filename), specifier));
      const relative = path.relative(gameRoot, target);
      if (relative.startsWith('..') || path.isAbsolute(relative) || relative.startsWith(`plan${path.sep}`)) {
        throw new Error(`Import leaves runtime tree: ${specifier}`);
      }
      if (!(await stat(target)).isFile()) throw new Error(`Module is not a regular file: ${specifier}`);
    }
  } catch (error) {
    console.error(`${filename}: ${error.message}`);
    failed = true;
  }
}
if (failed) process.exitCode = 1;
else console.log(`Static lint and local module paths checked (${sources.length} authored files; no game execution).`);
