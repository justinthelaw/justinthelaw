import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const toolRoot = fileURLToPath(new URL('../', import.meta.url));
const configFile = path.join(toolRoot, 'tsconfig.json');
const raw = ts.readConfigFile(configFile, ts.sys.readFile);
const config = ts.parseJsonConfigFileContent(raw.config ?? {}, ts.sys, toolRoot);
const program = ts.createProgram(config.fileNames, config.options);
const diagnostics = [...(raw.error ? [raw.error] : []), ...config.errors, ...ts.getPreEmitDiagnostics(program)];
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: filename => filename,
    getCurrentDirectory: () => toolRoot,
    getNewLine: () => '\n',
  }));
  process.exitCode = 1;
} else console.log(`Strict static types checked (${config.fileNames.length} authored source files; no execution).`);
