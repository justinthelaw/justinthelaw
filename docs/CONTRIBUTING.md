# Contributing

Thanks for contributing to Justin's projects.

## Ground Rules

- Keep changes scoped and easy to review.
- Prefer small pull requests with clear intent.
- Add or update docs when behavior changes.
- Run local checks before opening a pull request.

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
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

## Pull Request Expectations

- Use a short, descriptive title.
- Describe what changed and why.
- Link issues with `Fixes #<id>` when applicable.
- Include screenshots for UI changes.
- Confirm local checks in the PR checklist.
