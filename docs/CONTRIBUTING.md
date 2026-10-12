# Contributing

Keep changes focused, update affected docs, and run local checks before opening
a pull request. See [Development](DEVELOPMENT.md) for setup.

## Toolchain

Use Node.js 24 from `.nvmrc` and npm 12.2.0 from `package.json`.
`@types/node` stays on Node 24; Dependabot excludes major type updates until the
runtime changes. The npm engine minimum is 11.19.0 for Dependabot's bundled
resolver; keep `engine-strict`. Use stable upstream pre-commit tags.

## Validation

| Command | Purpose |
| --- | --- |
| `npm run flight-check` | Required before pushing: clean, lint, build, test |
| `npm run build && npm run test` | Standalone Playwright run; requires `out/` |
| `pre-commit install --hook-type pre-commit --hook-type pre-push` | Install hooks once per clone |
| `pre-commit run --all-files` | Run pre-commit checks |
| `pre-commit run --all-files --hook-stage pre-push` | Run pre-push checks, including app lint |

Hooks check Markdown, YAML, workflows, shell scripts, whitespace, smart quotes,
merge conflicts, private keys, and large files.

## Pull Requests

Use a short title, explain what changed and why, link applicable issues with
`Fixes #<id>`, include UI screenshots, and record checks in the PR checklist.
