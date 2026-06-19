#!/usr/bin/env node

import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const outDir = resolve(process.cwd(), "out");
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const host = process.env.HOST ?? "127.0.0.1";

function normalizeBasePath(value) {
  if (!value || value === "/") {
    return "";
  }

  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function inferBasePath() {
  const indexPath = join(outDir, "index.html");
  if (!existsSync(indexPath)) {
    return "";
  }

  const html = readFileSync(indexPath, "utf8");
  const nextAssetMatch = html.match(/(?:href|src)="(?<basePath>\/[^"]*?)\/_next\//);
  return normalizeBasePath(nextAssetMatch?.groups?.basePath ?? "");
}

const basePath = normalizeBasePath(process.env.BASE_PATH ?? inferBasePath());

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function stripBasePath(pathname) {
  if (!basePath) {
    return pathname;
  }

  if (pathname === "/") {
    return null;
  }

  if (pathname === basePath) {
    return "/";
  }

  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length);
  }

  return pathname;
}

function resolveOutFile(requestPath) {
  let path = requestPath;
  if (path.endsWith("/")) {
    path = `${path}index.html`;
  }

  const normalized = normalize(path).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = resolve(outDir, `.${sep}${normalized}`);
  if (filePath !== outDir && !filePath.startsWith(`${outDir}${sep}`)) {
    return null;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    return join(filePath, "index.html");
  }

  return filePath;
}

function serveFile(filePath, response) {
  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    const notFoundPath = join(outDir, "404.html");
    if (existsSync(notFoundPath)) {
      response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      createReadStream(notFoundPath).pipe(response);
      return;
    }

    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": contentTypes.get(extname(filePath)) ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://localhost:${port}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  const strippedPath = stripBasePath(pathname);

  if (strippedPath === null) {
    response.writeHead(302, { location: `${basePath}/` });
    response.end();
    return;
  }

  serveFile(resolveOutFile(strippedPath), response);
});

server.listen(port, host, () => {
  const address = server.address();
  const actualPort = typeof address === "object" && address !== null ? address.port : port;
  const pathHint = basePath ? `${basePath}/` : "/";
  console.log(`Serving static export from ${outDir}`);
  console.log(`Local preview: http://${host}:${actualPort}${pathHint}`);
});
