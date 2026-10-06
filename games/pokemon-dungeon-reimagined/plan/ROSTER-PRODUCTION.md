# Whole-roster original pixel candidates

The tools-only roster package joins all **419 original Blue profiles / 386 species**.
The sixteen original starter sources and their 192 existing clip pages are reused
unchanged. All remaining 403 profiles have original editable geometry and twelve
new directional clip pages. This is a candidate art production package, not human
visual acceptance, runtime integration, or full-game completion.

| Deliverable | Path from repository root |
| --- | --- |
| Frozen format | `tools/pokemon-dungeon/art/production/CONTRACT.md` |
| Whole-roster index | `tools/pokemon-dungeon/art/roster/manifest.json` |
| Bounded character / page shards | `tools/pokemon-dungeon/art/roster/manifests/`, `indexes/` |
| Dedicated campaign anatomy | `tools/pokemon-dungeon/art/roster/campaign.mjs`, `refinements.mjs` |
| Editable anatomical species records | `tools/pokemon-dungeon/art/roster/records-{kanto,johto,hoenn}.mjs` |
| Original form geometry | `tools/pokemon-dungeon/art/roster/forms.mjs` |
| Tools-only 3D and pose inspector | `tools/pokemon-dungeon/art-preview/roster/index.html` |
| Eight-view / twelve-clip evidence | `tools/pokemon-dungeon/art/roster/evidence/` |

Each local PNG remains 384×768: four 96×96 frames by eight camera-relative
facing rows, with fixed `[48,92]` contact anchor and two transparent edge pixels.
Binary straight alpha has zero RGB underneath transparency. Nearest sampling,
sRGB and no character mipmaps preserve pixel edges. A fixed 0.92 authoring-space
scale on new rigs reserves pose overshoot; frames are never recentered, stretched,
rotated as finished images, or recolored to substitute for different anatomy.
`catalogFormId` retains the catalog's null/default distinction while asset `formId`
uses the frozen contract's `default` spelling where appropriate. Unown, Castform
and Deoxys use their exact canonical profile and form identifiers; there are no
extra arbitrary normal-form aliases.

The twelve shared pose curves drive independently specified limbs, appendages,
head placement and surfaces. Species records specify proportions and topology,
not only palette. Dedicated refinements replace initial mammal-like bird heads,
short wings and round boss silhouettes. Unown glyphs have individually drawn
appendage paths, Castform weather bodies have different crowns/silhouettes, and
Deoxys forms change head, torso and tentacle proportions. Motion is compact
four-frame presentation feedback; it never awards turns, damage or domain events.

The viewer loads one selected page or three visible composition pages and
disposes prior textures/materials/geometries before replacement. Its visible
character texels are 1.125 or 3.375 MiB. The 24 MiB character page ceiling permits
21 pages; browser image copies, terrain, canvases and driver allocations are
additional. Loading every roster page at once is forbidden. The index/manifest
is split into bounded local shards below 1 MiB. The small inspector index holds
metadata only. No game cache or mobile hardware performance is claimed.

## Review and provenance

All art is original code-native drawing using the preserved raster/painter
utilities. No commercial sprite/model/raster pixels were extracted, traced,
embedded, or used as drawing inputs. No ImageGen retry or API fallback was used.
The existing reviewed species catalog supplies identity/form coverage. Official
Pokédex pages were consulted for identity context; the pages returned an iframe
rather than directly inspectable artwork in this tool session. Reference search
also exposed official-art reproductions for Shiftry/Groudon; these were reference
context only and were not downloaded into the repository. Visual changes were
also based on controller review of the original candidate contact sheet.

Reference URLs (reference only, no copied assets or prose):

- <https://www.pokemon.com/us/pokedex/shiftry>
- <https://www.pokemon.com/us/pokedex/zapdos>
- <https://www.pokemon.com/us/pokedex/absol>
- <https://www.pokemon.com/us/pokedex/groudon>
- <https://www.pokemon.com/uk/pokedex/deoxys>
- <https://www.wikidex.net/wiki/Shiftry>
- <https://pokemondb.net/artwork/groudon>

The controller's second campaign-sheet review found material silhouette
improvement and authorized continued export; this does **not** accept the whole
roster. Faithfulness of every species/form, anatomy at every view, animation
appeal, world scale, final campaign camera composition and device performance
remain human review gates. In particular, the broad declarative wave includes
simplified small details and evolution-stage proportions that require individual
visual review. Structural coverage and unique hashes cannot certify recognition.

## Reproduction

Editable sources, exact hash manifests/shards and evidence identities are retained
in Git. Tools-only output/evidence PNGs are reproducible local artifacts excluded
from Git. `npm --prefix tools/pokemon-dungeon run roster:check` first materializes
missing PNGs while verifying existing raster bytes and every checked-in metadata
file against deterministic authoring. It never rewrites expected hashes. Use the
separate writing export only after reviewing an intentional source change.
Production assets under `games/` remain checked in independently.

From repository root, all commands operate on art/tooling only:

```sh
node tools/pokemon-dungeon/art/roster/export.mjs
node tools/pokemon-dungeon/scripts/check-roster-pixels.mjs
node tools/pokemon-dungeon/art/roster/export.mjs --check
PIXEL_CAPTURE_BROWSER=/path/to/chromium node tools/pokemon-dungeon/scripts/capture-roster-pixels.mjs
```

The independent checker reads JSON, PNG chunks/CRCs and source hashes. It does
not import the generator or game modules. The export comparison redraws art only.
Capture serves only `tools/pokemon-dungeon/`; game routes and source are excluded.
Raster symmetry and intentional pose holds are reported separately from malformed
cells so a symmetric organism is not forced to gain invented asymmetric details.
Runtime promotion remains a separate reviewed adapter responsibility.

## Provisional runtime adapter

The whole-roster delivery adapter now exists; see
[RUNTIME-PIXELS.md](RUNTIME-PIXELS.md). It preserves the192 starter PNG byte
sequences, packages all5,028 pages into bounded hash-pinned local bundles, and
loads only requested canonical species/form/clip pages. The art-only source
manifest retains its candidate/runtimeIntegrated:false declaration; the separate
runtime manifest explicitly declares provisional integration. Neither is visual
acceptance. Dedicated opening refinements in `opening.mjs` correct Sunkern's
limbless anatomy and improve the readability of Exeggcute's six shells.
