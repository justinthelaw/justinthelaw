# Pokémon Dungeon authoring tools

Independent static tooling for P02-A, P03-A/P04-A and P07-A. The root website package and
lockfile remain separate. Dependencies, sources and caches stay outside the
exported `games/` tree. There is no game test runner or gameplay execution.

## Setup and commands

Use Node **24.21.0** from the repository's `.nvmrc` and npm **12.1.0**. From the
repository root:

```bash
cd tools/pokemon-dungeon
npm ci
npm run vendor
npm run check
```

| Command | Responsibility |
| --- | --- |
| `npm run vendor` | Regenerate the exact reviewed Three.js browser module closure. |
| `npm run vendor -- --check` | Recompute in memory and compare every output byte; never writes files. |
| `npm run lint` | Parse/lint authored source and check local module boundaries. |
| `npm run typecheck` | Independent strict JSDoc checks; the compiler host maps exact local vendor paths to pinned Three.js declarations. |
| `npm run item-ai:export` | Export all240 qualified native item AI/category facts independently of frozen effects/save dependencies. |
| `npm run item-ai:check` | Compare every identity/category/action/stack/ordered AI triple with the pinned native snapshot and existing complete item corpus, then compare export bytes. |
| `npm run assets` | Validate asset metadata and local files without importing game modules. |
| `npm run art:export` | Run original authoring generators and export candidate GLBs/manifests outside the game tree. |
| `npm run content` | Validate the four authoring catalogs, exact identities, source locators, blockers and relationships; no game execution. |
| `npm run content:coverage` | Validate inventories and regenerate `plan/CONTENT-COVERAGE.csv` with one row per actual authoring record. |
| `npm run check` | Run lint, strict types, content/coverage, assets and vendor comparison in sequence. |

Network access is needed for `npm ci`; vendoring uses only locked installed
packages. In environments with an explicit HTTP(S) proxy, Node 24's
`NODE_USE_ENV_PROXY=1` enables that proxy for compatible Node requests.

## Pinned vendor export

`scripts/vendor.mjs` reads `three@0.186.1` from this package's `node_modules`,
verifies the npm lock integrity and exact upstream SHA-256 hashes, parses
imports with `acorn@8.19.0`, and minifies using pure-JavaScript `terser@5.51.2`.
The settings are ES2022 modules, two compression passes, mangling and retained
license/preserve comments. No downloaded native minifier is required.

Output directory: `games/pokemon-dungeon-reimagined/vendor/three/`.

| Output | Bytes | Required local imports |
| --- | ---: | --- |
| `three.module.min.js` | 375,140 | `./three.core.min.js` |
| `three.core.min.js` | 389,067 | None |
| `GLTFLoader.min.js` | 45,343 | `./three.module.min.js`, `./BufferGeometryUtils.min.js`, `./SkeletonUtils.min.js` |
| `BufferGeometryUtils.min.js` | 13,518 | `./three.module.min.js` |
| `SkeletonUtils.min.js` | 4,172 | `./three.module.min.js` |
| `LICENSE` | Upstream bytes preserved | Full Three.js MIT notice |
| `provenance.json` | Generated measured record | Version, archive integrity, input/output hashes, sizes, paths and tool settings |

The two engine modules total **764,207 bytes**, below the 1 MiB target. The
five modules total **827,240 bytes**. Each output, including provenance and
license, must be at most **1,048,576 bytes**. GLTFLoader in this exact release
requires both utilities; none may be omitted. No decoder package is included.

Runtime imports resolve from the importing file to
`vendor/three/three.module.min.js` and `vendor/three/GLTFLoader.min.js` within
the game directory. There are no CDN, bare-package or dynamic module imports.
The upstream loaders remain general-purpose; callers and static asset checks
must enforce the project's local-resource policy for supplied asset URLs.

The vendoring command rejects changed upstream hashes, unexpected imports,
unsupported arguments, nonlocal generated imports, excessive file size and
unrecognized files in its output directory. Check mode also rejects absent or
modified output. Regeneration is deterministic and carries no timestamp.
Review source/version pins, lockfile, output and provenance together for an
intentional future upgrade; do not update dependencies during ordinary builds.

## Asset and release boundaries

Read [ASSET-CONTRACT.md](../../games/pokemon-dungeon-reimagined/plan/ASSET-CONTRACT.md)
and `schemas/asset-manifest.schema.json`. Every local asset path resolves from
the directory containing its manifest. Candidate exports and review captures
belong under this tooling directory or the approved durable artifact store;
only reviewed portable outputs may enter the runtime asset directory.

This vendor export is engine infrastructure, not a playable game, an accepted
P06 art slice, or completion of P01/P03/P04 in full. It runs no game source.
Intermediate runtime remains on development branches; P36 exposure and P37
merge/deployment approvals are required before public release.

## Candidate art inspection

`art/characters/` and `art/environment/` contain original procedural authoring
sources. `npm run art:export` exports three detail levels, derives measured
manifest metadata and records hashes. It imports authoring code only. Changed
asset bytes increment the candidate revision and discard stale capture links;
no command grants human review or promotes an asset into the game.

`npm run assets` uses pinned Khronos `gltf-validator@2.0.0-dev.3.10` for static
glTF/accessor validity in addition to the local path/hash/schema checks. Errors
fail; warnings remain visible for review. These checks do not render, animate
or establish visual quality.

The static measurement gate reads actual accessor bytes and node transforms to
compare each LOD's triangles, node/mesh/material/joint counts and neutral bounds
with its manifest. It also compares node/mesh/material inventories, material
channels and texture dimensions, animation durations and socket parents. Bounds
allow 10 micrometers absolute plus one part per million relative float export
error. The current gate supports rigid triangle meshes; skin/morph deformation
must receive a reviewed measurement implementation before those assets pass.
Decoded work is bounded to 16 MiB per accessor, 64 MiB per model and 4,194,304
transformed vertex instances. These are inspection limits, not scene/FPS budgets.

Serve the repository root with a local static server, for example
`python -m http.server 4177 --bind 127.0.0.1`, then open
`http://127.0.0.1:4177/tools/pokemon-dungeon/art-preview/`. The disposable harness
loads only local vendor modules and candidate GLBs. It imports no game modules
and contains no movement commands, combat, campaign or saves. Subject, clip,
view, quality and held-pose controls inspect art. Cavern sound is original
procedural mood synthesis triggered by its button, not a game audio system.

All captures must retain the visible **P06 art preview; not gameplay** label.
Software-rendered screenshots establish rendered appearance only; they do not
establish performance or compatibility on a phone, tablet or discrete GPU.

## Content and state foundations

`content/` contains normalized authoring inventories with explicit source and
blocker references. They are not runtime catalogs and must not be requested by
the browser. The schema rejects undeclared fields; the checker validates exact
identity membership, local evidence locators, form links, location structure
and bounded local files. It checks source presence, not factual truth or
complete original-game mechanics. Individual records remain unstarted/pending.

`npm run content:coverage` emits the fine-grained coverage document. CI compares
the committed CSV byte for byte after validating its source catalogs. Existing
parent package and family evidence remains in `plan/COVERAGE.csv`.

P07-A adds independent runtime primitives under `src/domain/`: catalog/instance
IDs, bounded plain-data copies and frozen snapshots, and versioned explicit
random state. See `plan/STATE-FOUNDATION.md` for accepted scope and the retained
PRNG notice. These modules are statically checked only and are not wired into
the startup shell. Complete state validation, campaign creation, gameplay and
save persistence still require their source-backed package contracts.

The first town shop tables can be compared to the pinned original-Red research
checkout with `python scripts/export-town-shop-facts.py --source-root PATH --check`.
The script reads C/JSON as source data without importing or executing game code.
Omit `--check` only for an intentional researched re-export. Numerical provenance
and current service boundaries are in the game's `plan/TOWN-JOBS.md`.

### Early ordinary-job facts

`python scripts/export-early-job-facts.py --source-root /path/to/pinned/pmd-red --check`
compares two early route item masks, ten finite source-qualified species,
floor/rank facts and four reward items. It also proves that native pair and
favorite-item transformations have no eligible rows in this slice. It reads
source/data only; it neither imports nor executes the game. The pinned reference
is original Red comparative6bcbec4f, not Blue binary proof.
