# Campaign factual catalog authoring

This package independently normalizes curated original-game progression facts.
The target is original Blue Rescue Team. Pinned Red source is qualified comparative
evidence, not a claimed instruction-level Blue match. It contains no original
dialogue, command arrays, animation sequences, or runtime script interpreter.

`normalize.py` reads the reviewed scratch research corpus and pinned source enum
caches, plus the reviewed repository identity catalogs. It writes closed factual
records. Its selected return-table traversal is an authoring-only transformation:
41 referenced return handlers become 488 finite condition/action decision rows.
No original labels, program counters, or control-flow nodes are exported. The
other 1,442 source graphs are not serialized into this catalog.

`build-schema.py` authors the exact finite JSON Schema vocabulary and matching
strict JSDoc document projections. JSON schemas are shared by independent Ajv and
browser validators. Every object is closed; every string field has an explicit
finite vocabulary. Adding a fact requires regenerating schema/types and reviewing
that vocabulary change. Schema generation does not itself validate source truth.

`source-reference.json` is authoring-only curated evidence for static comparison
of the six job gates, 21 unlock rules, 83 native routes, 26 fixed-room dispatches
and 18 recruit flags. `sources.json` exports only qualified fingerprints and
source locators. Do not add the large research control graph to runtime resources.

From the repository root:

```sh
python tools/pokemon-dungeon/content/campaign-runtime/normalize.py
python tools/pokemon-dungeon/content/campaign-runtime/build-schema.py
node tools/pokemon-dungeon/scripts/export-campaign.mjs
node tools/pokemon-dungeon/scripts/export-campaign.mjs --check
node tools/pokemon-dungeon/scripts/check-campaign.mjs
```

Regeneration deliberately needs the separate research input. Ordinary export and
static verification use checked-in facts and require no cache or network. Neither
command imports or executes game code. All runtime JSON files remain below 1 MiB.

The exporter pins the manifest hash in `content/campaign-integrity.js`; the
manifest pins each resource's exact bytes. Export writes only the campaign
resources and that integrity module. The task does not wire package commands,
bootstrap, domain mutation, save schemas, or UI into the catalog.
