# Plugins

- Keep each distributable package under `plugins/<name>/` with a portable `plugin.json` and self-contained `skills/` references.
- Register packages in the repository-root `.agents/plugins/marketplace.json`; source paths are relative to the repository root.
- Keep installation guidance in each package's `INSTALL.md`, agent instructions in scoped `AGENTS.md`, and executable checks with that package.
- Do not store tokens, conversation transcripts, machine-specific paths, or installed plugin caches here. Git updates and installation are separate operations.
- For Develop, run `python plugins/develop/scripts/validate.py --marketplace-root .` and `python -m unittest discover -s plugins/develop/tests -p test_validate.py` from the repository root.
