import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

// Playwright transforms JSX into its own fixture objects. This isolated Node
// process uses the pinned TypeScript compiler to render real React components.
const sourceRoot = new URL("../../src/", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    const candidate = specifier.startsWith("@/")
      ? new URL(specifier.slice(2), sourceRoot)
      : specifier.startsWith(".") && context.parentURL?.startsWith(sourceRoot.href)
        ? new URL(specifier, context.parentURL)
        : null;
    if (candidate) {
      for (const suffix of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
        const url = new URL(`${candidate.href}${suffix}`);
        if (existsSync(url) && /\.(?:tsx?|json)$/.test(url.pathname)) {
          return nextResolve(url.href, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(sourceRoot.href) && /\.tsx?$/.test(url)) {
      const result = ts.transpileModule(readFileSync(new URL(url), "utf8"), {
        fileName: fileURLToPath(url),
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
      });
      return { format: "module", source: result.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { ChatMessages } = await import("../../src/components/chat/components/ChatMessages.tsx");
const props = JSON.parse(readFileSync(0, "utf8"));
process.stdout.write(renderToStaticMarkup(createElement(ChatMessages, {
  ...props,
  onRetryModelLoad: () => undefined,
})));
