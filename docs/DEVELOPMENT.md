# Development

## Local website

Use the versions pinned in `.nvmrc`, `package.json`, and `.python-version`.
The website currently targets Node 26 LTS with npm 12.2.2. From the repository root:

```bash
nvm install
nvm use
npm install --global npm@12.2.2
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

The November 8 refresh retains Node 26.13.0 active LTS and adopts Next.js 16.4.5
active LTS. Keep website TypeScript below 6.1 while the selected
typescript-eslint peer contract requires it; the isolated game tools use
TypeScript 7 independently. Babel 7, Nano ID 3 and Protobuf.js 7 remain on
the major versions required by their parent packages. Minimatch is overridden
to 11.0.5 in both npm graphs to fix
[globparts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249);
validate lint and the complete lockfile graph when refreshing that override.
Transformers.js owns
its exact ONNX runtime pins, including the existing upstream Web development
build; do not independently replace that tested runtime pair.

Both Python hash locks are refreshed, including PyTorch 2.15.0, Transformers
5.22.2, Hugging Face Hub 2.4.0, ONNX Runtime 1.31.1, HTTPX2/HTTPCore2 2.16.0
and setuptools 84.2.1. Python advances to 3.14.10: ONNX Runtime 1.31.1 provides
CPython wheels through 3.14, so a binary-only Python 3.15 resolution fails.
Regenerate both locks with the [pipeline commands](../llm/AGENTS.md), check
reproducibility, and run both dependency audits before updating these pins.
CUDA packages remain owned by the supported PyTorch graph; do not force newer
GPU-library versions into it. On POSIX systems, set `ORT_DISABLE_TELEMETRY=1`
before starting Python for local dependency smoke checks and tests, matching
Ubuntu CI's runtime opt-out. Windows ETW does not honor this environment flag.

npm 12.2.2 bundles patched undici 6.29.1 and ip-address 10.7.5, resolving
its earlier bundled-runtime deferrals. The fixed package lines begin at undici
6.29.1 and ip-address 10.7.4. See the [undici decompression advisory],
[undici EventSource advisory], and [ip-address parsing advisory].

The [setup-python v7.1.0 action lock] also pins undici 6.29.0 for its Node 24
runtime. Both undici advisories include that version. Check the next action
release for a patched runtime before changing its five workflow pins. The
website's npm lock cannot update the action bundle.

[setup-python v7.1.0 action lock]: https://github.com/actions/setup-python/blob/6d4fd22b20465ccc0f7354476588e8df7c9ca0e0/package-lock.json
[undici decompression advisory]: https://github.com/advisories/GHSA-xjj6-f33q-929c
[undici EventSource advisory]: https://github.com/advisories/GHSA-4qv8-2p9j-2685
[ip-address parsing advisory]: https://github.com/advisories/GHSA-rxp7-6hxx-x8q5
