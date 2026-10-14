# Repository instructions

This repository contains a static Next.js portfolio, browser-local chatbot,
arcade games, and a local language-model pipeline.
Use package manifests and lockfiles for exact dependency versions.

## Boundaries

- Preserve unrelated work. Use signed commits; merging, deploying, and changing
  issue/PR metadata require explicit authorization.
- The website is a static export: no API routes, server actions,
  `getServerSideProps`, or other server-only features.
- Derive production URLs from `SITE_CONFIG.repository` and `DERIVED_CONFIG`;
  never hardcode the repository base path. Build before serving `out/`.
- Run browser inference in `src/services/ai/worker.ts`, off the main thread.
- Change shared profile facts only in `src/config/public-profile.json`.
- Do not test source inside `games/`, execute game modules, or automate
  playthroughs. Website integration tests use inert fixtures. Static source,
  type, inventory, and asset checks are permitted; manual browser play is allowed.
- Keep authoring tools and disposable art previews outside `games/`. Preserve
  game saves, provenance, and review evidence. Source volume does not prove
  asset completeness or gameplay fidelity.

## Work by area

Read the applicable nested instructions before editing that area.

| Area | Instructions |
| --- | --- |
| Website, chat, arcade host | [src/AGENTS.md](src/AGENTS.md) |
| Website tests and fixtures | [tests/AGENTS.md](tests/AGENTS.md) |
| Export, preview, cleanup scripts | [scripts/AGENTS.md](scripts/AGENTS.md) |
| Workflows and repository automation | [.github/AGENTS.md](.github/AGENTS.md) |
| Public assets and preview evidence | [public/AGENTS.md](public/AGENTS.md) |
| Browser games | [games/AGENTS.md](games/AGENTS.md) |
| Game authoring and static validation | [tools/AGENTS.md](tools/AGENTS.md) |
| Local training, evaluation, model publishing | [llm/AGENTS.md](llm/AGENTS.md) |
| Human guides and evidence records | [docs/AGENTS.md](docs/AGENTS.md) |

Roux's Adventure retains the personality test through Tiny Woods and Caterpie's
rescue, starts directly at its authored menu and adds optional Normal/Ground Roux. Follow its [instructions](games/pokemon-dungeon-reimagined/AGENTS.md)
and [opening plan](games/pokemon-dungeon-reimagined/plan/BLUE-OPENING.md).
Retired full-campaign requirements and already merged branches are not active
work; later-campaign resources stay outside the distribution.

## Validation and documentation

Run `npm run flight-check` after changes: clean, lint, static build, and
Playwright. Also run checks required by affected nested instructions. Report
the commands, outcomes, and any environmental blocker; never imply a skipped
check passed. See [Contributing](docs/CONTRIBUTING.md) for hooks and review.

Keep instructions near the code they govern. Put human setup, configuration,
and architecture guidance in `docs/`; use purpose-named documents for plans
and evidence. Avoid duplicate README files and repeated implementation details.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
