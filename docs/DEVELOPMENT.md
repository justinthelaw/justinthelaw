# Development Guide

## Local Setup

### Web app

```bash
npm install
npm run dev
```

### Production-style static preview

```bash
npm run build
npm start
```

## Validation

Run this before pushing:

```bash
npm run flight-check
```

For pipeline-only updates, also run:

```bash
cd pipeline
uv sync
uv run ruff check scripts
uv run pyright scripts/eval_dataset.py scripts/eval_metrics.py scripts/eval_reporting.py scripts/evaluate_model.py scripts/utils.py
```

## Pre-commit

Install hooks once per clone:

```bash
pre-commit install --hook-type pre-commit --hook-type pre-push
```

Run hooks manually:

```bash
pre-commit run --all-files
```

## Contributor Docs

- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
