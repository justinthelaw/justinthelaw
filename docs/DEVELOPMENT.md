# Development Guide

## Local Setup

### Web App

```bash
nvm install
nvm use
npm install --global npm@12.2.0
npm install
npm run dev
```

The repository pins Node.js in `.nvmrc`, npm in `package.json`, and Python in
`.python-version`. Install Python with `uv python install` before creating the
profile-QA virtual environment.

TypeScript 7.0.2 runs the standalone `npm run typecheck` compiler. The
`typescript` import uses the official `@typescript/typescript6` compatibility
alias (API 6.0.3) for Next.js and typescript-eslint until they support the new
native API. This follows the [official side-by-side migration](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6-0).

Upgrade deferred: npm's CLI bundle retains affected brace-expansion, ip-address
and undici copies even in 12.2.0; retain the latest stable npm parent. Revisit
when a published release refreshes its bundle: [upstream tracking issue](https://github.com/npm/cli/issues/10062).

Node 24.21.0 remains the newest active LTS runtime. Node 26 and its types stay
deferred until the [Node 26 LTS transition](https://github.com/nodejs/Release#release-schedule)
on October 28 and a runtime lane review.

Dependency audit and retained transitive constraints are recorded in
[the October 2 ledger](dependency-upgrades/2026-10-02.md).

### Production-Style Static Preview

```bash
npm run build
npm start
```

## Validation

Run this before pushing:

```bash
npm run flight-check
```

`npm run test` expects a built static export in `out/`. Run `npm run build`
first when running Playwright outside `flight-check`.

## Pre-commit

Install hooks once per clone:

```bash
pre-commit install --hook-type pre-commit --hook-type pre-push
```

Run pre-commit-stage hooks manually:

```bash
pre-commit run --all-files
```

Run local pre-push hooks manually:

```bash
pre-commit run --all-files --hook-stage pre-push
```

Pre-commit stage hooks cover formatting and repo hygiene: markdown, YAML,
GitHub Actions workflow lint, shell script checks, whitespace, smart quotes,
merge conflicts, private keys, and large files. The local app ESLint hook runs
at pre-push.

## Contributor Docs

| Document | Purpose |
| --- | --- |
| [Architecture and pipeline diagrams](DIAGRAMS.md) | System map and fine-tuning handoff |
| [Customization](CUSTOMIZATION.md) | Site personalization |
| [Contributing](CONTRIBUTING.md) | Contribution workflow |
| [Security](SECURITY.md) | Vulnerability reporting |
| [Support](SUPPORT.md) | Help and issue guidance |
| [Code of Conduct](CODE_OF_CONDUCT.md) | Community expectations |
