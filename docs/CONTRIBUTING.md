# Contributing

Thanks for contributing to Justin's projects.

## Ground Rules

| Rule | Detail |
| --- | --- |
| Scope | Keep changes scoped and easy to review |
| Pull requests | Prefer small pull requests with clear intent |
| Documentation | Add or update docs when behavior changes |
| Validation | Run local checks before opening a pull request |

## Development Setup

| Step | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Run development server | `npm run dev` |

Run commands from the repository root.

## Validation

Run this before pushing:

```bash
npm run flight-check
```

Standalone Playwright tests need a built `out/` directory. Use
`npm run build && npm run test` if you are not running `flight-check`.

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

Hooks cover markdown, YAML, GitHub Actions workflows, shell scripts,
whitespace, smart quotes, merge conflicts, private keys, large files, and
pre-push app linting.

## Pull Request Expectations

| Expectation | Detail |
| --- | --- |
| Title | Use a short, descriptive title |
| Summary | Describe what changed and why |
| Issues | Link issues with `Fixes #<id>` when applicable |
| UI changes | Include screenshots |
| Checks | Confirm local checks in the PR checklist |
