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

## Contributor Docs

- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
