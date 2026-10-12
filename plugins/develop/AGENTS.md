# Maintaining develop

- Keep this package a portable skills-only plugin. Do not add machine-specific paths, tokens, executable hooks or a service dependency without a concrete need.
- Keep development defaults and handoffs in `skills/develop/references/contract.md`. Development entry points retain its gates; standalone `adversarial-loop` reviews use their self-contained protocol without coding dependencies.
- Preserve `upgrade -> iterate -> superpowers`, dynamic `justinthelaw` repository discovery, fresh non-forked reviews and original model/effort matching. Use only the singular `upgrade` entry point.
- Change user-facing behavior only within the request; never use internal review as authorization to bypass host controls.
- From this plugin directory, run `python scripts/validate.py --marketplace-root ../..`, `python -m unittest discover -s tests`, and relevant fresh-context scenarios in `tests/scenarios.md` before publication. Run `git diff --check` from the repository root. Omit `--marketplace-root` for detached installed payloads. Inspect actual artifacts; text matching alone does not validate agent behavior.
- Keep conversation packets and task-specific findings outside tracked files. Commit only scoped changes, update the plugin version when releasing, and verify the same Git revision on each installed surface.
