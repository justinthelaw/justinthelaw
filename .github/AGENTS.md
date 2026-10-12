# Repository automation instructions

| Workflow | Responsibility |
| --- | --- |
| `workflows/app.test.yml` | PR website build, lint, Playwright, preview artifacts |
| `workflows/deploy.yml` | Static Pages build/test and authorized deployment |
| `workflows/game-static.yml` | Isolated game source/type/asset checks |
| `workflows/llm.test.yml` | Profile-QA locks, unit tests, dependency smoke checks and audits |
| `workflows/lint.yml` | Pre-commit checks |
| `workflows/plugins.test.yml` | Plugin package/marketplace validation on Linux and Windows |

- Keep the Node version aligned with `.nvmrc`, npm with `package.json`, and
  Python with the relevant lock/environment requirements. Preserve
  `engine-strict`; keep Node types on the runtime's major version.
- Pin third-party actions to reviewed commit SHAs with version comments. Keep
  permissions minimal and preserve concurrency cancellation and artifact limits.
- Website tests use freshly built `out/`. Game-only changes must still trigger
  Pages builds; game validation remains static and isolated in
  `tools/pokemon-dungeon/` with its own lockfile and `npm run check`.
- Keep `llm/` path filters, lock commands, namespaced imports, and scheduled
  validation consistent with [the pipeline instructions](../llm/AGENTS.md).
- Use stable upstream pre-commit tags; keep local hooks and CI aligned.
  Run applicable YAML, actionlint, and pre-commit validation after changes.
- Changing workflow files does not authorize deployment, merging, or issue/PR
  metadata changes. Preserve root authorization requirements.
