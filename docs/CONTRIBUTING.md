# Contributing

Thanks for contributing to Justin's projects.

## Ground Rules

- Keep changes scoped and easy to review.
- Prefer small pull requests with clear intent.
- Add or update docs when behavior changes.
- Run local checks before opening a pull request.

## Development Setup

### Web app

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
```

### Fine-tuning pipeline

1. Move into `pipeline/`.
2. Sync dependencies with `uv`:

```bash
cd pipeline
uv sync
```

## Validation

Run this before pushing:

```bash
npm run flight-check
```

Pipeline-only updates should also run:

```bash
cd pipeline
uv run ruff check scripts
uv run pyright scripts/eval_dataset.py scripts/eval_metrics.py scripts/eval_reporting.py scripts/evaluate_model.py scripts/utils.py
```

## Pre-commit

Install hooks once per clone:

```bash
pre-commit install --hook-type pre-commit --hook-type pre-push
```

Run all hooks manually:

```bash
pre-commit run --all-files
```

## Pull Request Expectations

- Use a short, descriptive title.
- Describe what changed and why.
- Link issues with `Fixes #<id>` when applicable.
- Include screenshots for UI changes.
- Confirm local checks in the PR checklist.
