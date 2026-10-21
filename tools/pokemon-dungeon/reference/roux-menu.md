# Roux title and rescue-trail menu

The owner-requested menu reimagining uses two authored 256×192 scenes: a bright
coastal title with a cream/chocolate **ROUX'S ADVENTURE** ribbon, and a glade
overlooking the sea beside a rescue trail. The runtime adds Roux, choices and
helper text; those are not baked into the backgrounds. Source pixels and
composition instructions are recorded in the generated
[menu manifest](../../../games/pokemon-dungeon-reimagined/assets/roux/menu-manifest.json).

[`art/roux/menu.mjs`](../art/roux/menu.mjs) exports all three PNGs reproducibly using
the shared offline Raster/PNG tools. `--check` compares their bytes, the manifest
and separate attribution notice; it also verifies pinned source hashes, the
cropped logo against the normalized native menu capture, dimensions, opaque
backgrounds, binary avatar transparency, lossless PNG roundtrips and the image
budget. `--preview` writes ignored scene and avatar sampling comparisons beneath
`.work/roux-menu/`. No game module is loaded or executed.

The separate 64×56 `menu-roux.png` title avatar derives directly from the approved
high-resolution concept A front/rest cell `(0,0,198,222)` in
`concept-a-body-0.png`. The largest eight-connected subject with alpha≥192 has
source bounds `(31,52,145,147)`. One uniform scale `50/147` fits the subject to
49×50 pixels; it is horizontally centered with its opaque bottom at y51. A
small authored brown shadow stays within y49–54. The runtime draws this asset at
`(170,136)` at its native size, separate from the gameplay atlas. The accompanying
[character audit](roux-adventure.md#representation-audit-2026-10-21) documents the
body, portrait and attachment corrections.

Direct nearest and covered-area sampling were compared at native and enlarged
sizes. Nearest preserves distinct glossy eyes, the nose/muzzle outline, cream
blaze, paws and raised tail more clearly; area averaging softens the facial
detail. Both candidates use the existing chocolate/cream palette and project
both axes through the same scale. The source manifest and source PNG retain
their pinned hashes and original image_gen/owner-reference provenance.

The Pokémon and Mystery Dungeon tiers retain the existing North American English
Blue menu export's non-backdrop pixels from `(0,0,256,109)`. The original Blue
Rescue Team ribbon first appears at y109, so that row and everything below it
are excluded. The new ribbon covers the lowest Mystery Dungeon tips; this is a
deliberate adaptation. The native export's mask, palette and title-capture chain
remain in the [Blue source ledger](../art/blue/native-ui-sources.json) and
[pixel evidence](../art/blue/native-reference/panel-pixel-corroboration.json).
The original menu capture's provenance is incomplete on its hosting wiki.

The sky, clouds, sea, grass, trees, trail, flowers, pennant, ribbon and lettering
are new integer-grid composition. Their full scenes have no native pixel-parity
claim. Source attribution is preserved without claiming a publisher reuse grant.
Static checks and a disposable art inspection do not establish gameplay acceptance.
