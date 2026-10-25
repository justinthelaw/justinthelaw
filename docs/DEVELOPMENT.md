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

On October 25, 2026, the registry served all 13 ESLint React 5.28.1 packages.
It still blocked the archives for ESLint React 5.28.5, PostCSS 8.5.31 and
markdownlint-cli2 0.24.0. Keep PostCSS at 8.5.30 and the Markdown hook at
0.23.3 until the registry serves their complete dependency graphs. For a new
website pin, regenerate the lockfile with the pinned npm version and test a
cold install. Run `npm run flight-check` at the root and `npm run check` in
`tools/pokemon-dungeon/`.

The training and export locks use setuptools 84.1.0, the first release with
the [Windows installer fix](https://github.com/advisories/GHSA-xmj3-9gf7-h52w).
The registry served HTTPX2 and HTTPCore2 2.13.1 but did not list either 2.14.0
release or Transformers 5.20.2. Keep the two HTTP packages at 2.13.1 and
Transformers at 5.20.1 until those releases are available. Regenerate both
Python locks with the [pipeline commands](../llm/AGENTS.md) and run both
dependency audits before updating these pins.

npm 12.2.1 still bundles undici 6.29.0 and ip-address 10.7.2. Check the next
stable npm release against the published advisory ranges before updating the CLI
pin. The fixes on these package lines are undici 6.29.1 and ip-address 10.7.4.
See the [undici decompression advisory], [undici EventSource advisory], and
[ip-address parsing advisory].

The [setup-python v7.1.0 action lock] also pins undici 6.29.0 for its Node 24
runtime. Both undici advisories include that version. Check the next action
release for a patched runtime before changing its five workflow pins. The
website's npm lock cannot update the action bundle.

[setup-python v7.1.0 action lock]: https://github.com/actions/setup-python/blob/6d4fd22b20465ccc0f7354476588e8df7c9ca0e0/package-lock.json
[undici decompression advisory]: https://github.com/advisories/GHSA-xjj6-f33q-929c
[undici EventSource advisory]: https://github.com/advisories/GHSA-4qv8-2p9j-2685
[ip-address parsing advisory]: https://github.com/advisories/GHSA-rxp7-6hxx-x8q5
