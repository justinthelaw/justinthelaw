# Offline authoring tools

- `pokemon-dungeon/` owns the Blue opening's exporters, static checkers,
  factual catalogs, source archives and provenance. Follow its
  [instructions](pokemon-dungeon/AGENTS.md).
- Keep authoring dependencies, caches and disposable previews out of `games/`
  and the published distribution.
- Tools may parse source, JSON, PNGs and source archives. They must not import
  or execute game modules, run native game code or automate playthroughs.
- Preserve pinned inputs and independent factual checks; do not refresh hashes
  solely to make a failed comparison pass.
