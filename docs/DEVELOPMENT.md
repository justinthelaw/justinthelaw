# Development

## Local website

Use the versions pinned in `.nvmrc`, `package.json`, and `.python-version`.
The website currently targets Node 24 with npm 12.2.1. From the repository root:

```bash
nvm install
nvm use
npm install --global npm@12.2.1
ONNXRUNTIME_NODE_INSTALL=skip npm ci
npm run dev
```

`ONNXRUNTIME_NODE_INSTALL=skip` prevents the transitive native ONNX package from
downloading optional CUDA binaries. The website runs inference in the browser
with ONNX Runtime Web; website CI uses the same installation setting.

The development server uses an empty base path. Production uses the configured
GitHub Pages path; preview the built output when checking deployment behavior.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local Next.js development |
| `npm run build` | Static export to `out/`, then game export |
| `npm start` | Serve existing `out/`; build first |
| `npm run flight-check` | Required clean, lint, build, and Playwright checks |
| `npm run clean` | Remove disposable website build/test output |

For a standalone browser test run, run `npm run build` followed by `npm run test`.
Playwright starts a fresh production preview on port 3000 and never reuses a
running server. Stop any competing server first. See
[Contributing](CONTRIBUTING.md) for hooks and review evidence.

## Other packages

| Area | Entry point |
| --- | --- |
| Website architecture | [Diagrams](DIAGRAMS.md) |
| Site configuration | [Customization](CUSTOMIZATION.md) |
| Arcade controls | [Player guide](../games/PLAYER-GUIDE.md) |
| Game authoring/static checks | [Tool instructions](../tools/pokemon-dungeon/AGENTS.md) |
| Local model pipeline | [LLM instructions](../llm/AGENTS.md) |

The Python pipeline lives directly in `llm/`; run its modules from the repository
root as `python -m llm.persona.<module>`. Follow its instructions for isolated
training/export environments and the required validation commands.

## Dependency decisions

The website and game use separate TypeScript versions. Keep the website's Node
types on its Node major version. Use the manifests and lockfiles for exact pins.

On October 24, 2026, the configured registry blocked the PostCSS 8.5.31 archive
and nine archives in the ESLint React 5.28.1 release because of their age. The
website uses PostCSS 8.5.30 and ESLint React 5.28.0 until the registry serves
every archive for the newer versions. Before restoring either pin, check the
full dependency graph, regenerate the lockfile with the pinned npm version, and
run a cold install. Run `npm run flight-check` at the root and `npm run check`
in `tools/pokemon-dungeon/`.

npm 12.2.1 still bundles undici 6.29.0 and ip-address 10.7.2. Check the next
stable npm release against the published advisory ranges before updating the CLI
pin. The fixes on these package lines are undici 6.29.1 and ip-address 10.7.4.
See the [undici decompression advisory], [undici EventSource advisory], and
[ip-address parsing advisory].

[undici decompression advisory]: https://github.com/advisories/GHSA-xjj6-f33q-929c
[undici EventSource advisory]: https://github.com/advisories/GHSA-4qv8-2p9j-2685
[ip-address parsing advisory]: https://github.com/advisories/GHSA-rxp7-6hxx-x8q5
