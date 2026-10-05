import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const toolRoot = fileURLToPath(new URL('../', import.meta.url));
const configFile = path.join(toolRoot, 'tsconfig.json');
const vendorRoot = path.resolve(toolRoot, '../../games/pokemon-dungeon-reimagined/vendor/three');
const declarations = new Map([
  [path.join(vendorRoot, 'three.module.min.js'), path.join(toolRoot, 'node_modules/@types/three/index.d.ts')],
  [path.join(vendorRoot, 'GLTFLoader.min.js'), path.join(toolRoot, 'node_modules/@types/three/examples/jsm/loaders/GLTFLoader.d.ts')],
]);
const raw = ts.readConfigFile(configFile, ts.sys.readFile);
const config = ts.parseJsonConfigFileContent(raw.config ?? {}, ts.sys, toolRoot);
const host = ts.createCompilerHost(config.options);
// Source files remain directly served JS. Resolve only the exact pinned vendor
// paths to their declarations; never type-check minified third-party internals.
host.resolveModuleNames = (names, containingFile) => names.map(name => {
  const declaration = declarations.get(path.resolve(path.dirname(containingFile), name));
  if (declaration) return { resolvedFileName: declaration, extension: ts.Extension.Dts, isExternalLibraryImport: true };
  return ts.resolveModuleName(name, containingFile, config.options, host).resolvedModule;
});
const program = ts.createProgram(config.fileNames, config.options, host);
const diagnostics = [...(raw.error ? [raw.error] : []), ...config.errors, ...ts.getPreEmitDiagnostics(program)];
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: filename => filename,
    getCurrentDirectory: () => toolRoot,
    getNewLine: () => '\n',
  }));
  process.exitCode = 1;
} else console.log(`Strict static types checked (${config.fileNames.length} authored source files; no execution).`);
