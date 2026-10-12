# Documentation instructions

Keep guides concise and anchored to current source behavior. Nested `AGENTS.md`
files own engineering constraints; human guides explain setup, configuration,
architecture, contribution, and support.

| Document | Purpose |
| --- | --- |
| `DEVELOPMENT.md` | Toolchain, local setup, validation, package entry points |
| `CUSTOMIZATION.md` | Configuration fields and user-visible behavior |
| `DIAGRAMS.md` | Runtime and build/training boundaries |
| `CONTRIBUTING.md` | Hooks, validation evidence, review expectations |
| `SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md` | Human reporting and community policies |

- Read the relevant code/configuration before changing behavioral claims.
  Use paths under `llm/` and the `llm.persona` Python namespace for the pipeline.
- Link to canonical instructions instead of copying large command lists or
  implementation details. Add README files only for a distinct human purpose.
- Dated audit, plan, and review records are evidence, not automatic current
  requirements. Preserve dates, checked revisions, limits, and unresolved work;
  label superseded scope and link the active instructions.
- Check relative links, code paths, Markdown structure, and diagrams after
  moves. Never present missing artifacts or unrun validation as verified.
