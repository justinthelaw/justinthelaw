# Exporters and static gates

- `export-blue-*.mjs` projects selected facts, onboarding, effects and distribution.
  Art generation lives in `../art/blue/`.
- `check-source.mjs` parses/lints source and local imports.
  `check-blue-facts.mjs` independently pins factual JSON;
  `check-blue-rules.mjs` and `check-blue-opening.mjs` inspect scoped contracts.
  `check-png-codec.mjs` verifies offline image encoding/decoding.
- Checks may parse game source/ASTs but must never import or execute it, run
  native game code or automate playthroughs. Do not replace independent evidence
  with outputs from the implementation being checked.
- Keep `--check` non-mutating, reproducible and limited to selected resources.
  Preserve distribution closure, 3 MiB total and media/memory admission limits.
- Script names and sequencing are canonical in `../package.json`.
