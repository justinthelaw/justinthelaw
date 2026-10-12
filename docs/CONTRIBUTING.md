# Contributing

Keep changes focused, preserve unrelated work, and follow the applicable
[nested instructions](../AGENTS.md#work-by-area). See [Development](DEVELOPMENT.md)
for the pinned toolchain and local setup.

## Validation

Run commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run flight-check` | Required clean, lint, static build, and Playwright checks |
| `pre-commit install --hook-type pre-commit --hook-type pre-push` | Install configured hooks once per clone |
| `pre-commit run --all-files` | Check Markdown, YAML, workflows, shell, whitespace, and conflicts |
| `pre-commit run --all-files --hook-stage pre-push` | Also check large files, private keys, and applicable app lint |

Install pre-commit with `uv tool install pre-commit` or `pipx install pre-commit`.
The configured minimum version and hook revisions live in
`.pre-commit-config.yaml`. Keep `engine-strict` and stable upstream hook tags.

Playwright uses a fresh production preview on port 3000. Build before standalone
`npm run test` and stop any competing server. UI tests stub external profile,
avatar, and resume requests; review screenshots still require a fresh live
GitHub bio. Disclose paused animations or stubbed resume iframes.

Games are validated statically using the isolated authoring package. Do not
execute game modules, test source inside `games/`, or automate playthroughs.
Follow package-specific checks for changes under `llm/`, `tools/`, or `plugins/`.

## Pull requests

Use a short title and explain the problem, the change, and resulting behavior.
Link applicable issues, include screenshots for UI changes, and list validation
commands with their outcomes. State blockers, remaining risks, and breaking
changes. Update affected instructions and human guides without duplicating them.

Use signed commits. Merging, deploying, and changing issue/PR metadata require
explicit authorization; preparing a change does not grant that authorization.
