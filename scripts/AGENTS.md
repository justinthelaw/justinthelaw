# Website tooling instructions

Run these Node.js tools from the repository root. They support static builds;
do not add application server behavior or execute game source.

| Script | Contract |
| --- | --- |
| `clean.mjs` | Removes `out/`, `.next/`, Playwright output, and `test-results.json` |
| `export-games.mjs` | Runs after build; copies games into `out/games/` |
| `serve-static-preview.mjs` | Serves existing `out/`; infers the exported base path |

- Keep cleanup restricted to declared disposable outputs. Preserve source,
  saves, evidence, dependencies, and unrelated processes/files.
- A missing `games/` is a no-op. Games with `distribution.json` export only its
  version-1 `files` list; absent manifests retain the complete-tree fallback.
- Preserve manifest size/count/duplicate checks, local regular-file validation,
  source containment, destination containment, and symlink protections.
  Stale undeclared outputs must fail and request a clean output directory.
- Preview `/` redirects to the inferred base path. Keep `HOST`, `PORT`, and
  `BASE_PATH` overrides, traversal protection, MIME handling, and exported 404
  fallback. Build before `npm start`; do not serve the source as a preview.
- Validate copying, cleanup, and URL behavior with temporary inert fixtures in
  `tests/`. Never import or run game modules to validate the exporter.
