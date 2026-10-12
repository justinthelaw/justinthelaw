# Development Guide

## Local Setup

```bash
nvm install
nvm use
npm install --global npm@12.2.0
npm install
npm run dev
```

Run from the repository root. Node.js, npm, and Python are pinned in `.nvmrc`,
`package.json`, and `.python-version`. Run `uv python install` before creating
the [profile-QA environments](../ml/profile-qa/README.md#prerequisites).

## Static Preview and Validation

| Command | Purpose |
| --- | --- |
| `npm run build && npm start` | Serve the static export at its GitHub Pages base path |
| `npm run flight-check` | Required before pushing: clean, lint, build, test |
| `npm run build && npm run test` | Standalone Playwright run; build `out/` first |

Install and run the [contribution hooks](CONTRIBUTING.md#validation).

## Deferred Upgrades

- Keep website TypeScript 6.0.3: 7.0.2 exceeds the
  [typescript-eslint parser's](https://registry.npmjs.org/@typescript-eslint/typescript-estree/8.71.1)
  supported range, `>=4.8.4 <6.1.0`. The isolated game package uses TypeScript
  7.0.2 through `tsc --project tsconfig.json`.
- Keep Node 24.21.0 and Node 24 types. Revisit Node 26 after its
  [October 28 LTS transition](https://github.com/nodejs/Release#release-schedule)
  and a runtime lane review.
- Keep Python 3.14.8: ONNX Runtime lacks a Python 3.15 wheel.
- See the [September 29 dependency ledger](dependency-upgrades/2026-09-29.md)
  for audit evidence and retained transitive constraints.

## Guides

| Guide | Purpose |
| --- | --- |
| [Diagrams](DIAGRAMS.md) | Architecture and training pipeline |
| [Customization](CUSTOMIZATION.md) | Site configuration |
| [Contributing](CONTRIBUTING.md) | Checks and pull requests |
| [Security](SECURITY.md) | Vulnerability reporting |
| [Support](SUPPORT.md) | Bugs and feature requests |
| [Code of Conduct](CODE_OF_CONDUCT.md) | Community expectations |
