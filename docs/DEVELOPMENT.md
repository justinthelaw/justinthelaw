# Development Guide

## Local Setup

### Web App

```bash
npm install
npm run dev
```

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
| [Architecture and pipeline diagrams](diagrams.md) | System map and fine-tuning handoff |
| [Customization](CUSTOMIZATION.md) | Site personalization |
| [Contributing](CONTRIBUTING.md) | Contribution workflow |
| [Security](SECURITY.md) | Vulnerability reporting |
| [Support](SUPPORT.md) | Help and issue guidance |
| [Code of Conduct](CODE_OF_CONDUCT.md) | Community expectations |
