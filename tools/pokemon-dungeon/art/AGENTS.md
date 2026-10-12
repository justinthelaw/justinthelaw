# Offline artwork

- `blue/` owns source manifests/archives, bounded native decoders, exporters
  and pixel evidence; `pixel/raster.mjs` owns shared raster/PNG writing.
- Preserve original URLs, lengths, SHA-256 values, palettes, crop coordinates
  and edition qualifications. Public artwork is not a publisher reuse grant.
  Never fetch/read/include a ROM.
- Export to the selected game assets only through the authoring pipeline.
  Compare decoded pixels, geometry and metadata after repacking/PNG optimization.
- Blue comparisons establish only their observed regions. Red source is
  comparative; do not paint missing pixels or infer timing as proven parity.
- Keep captures, archives, analysis and disposable previews outside the game
  distribution. Runtime budgets and abort/bitmap ownership remain binding.
- Static image/source checks must not execute game/native modules or playthroughs.
