# Arcade preview provenance

`blue-rescue-team-preview.png` is a 256×192 edited card preview from
2026-10-14: Roux in Tiny Woods B3F with Torchic as his companion, the HUD and
touch toolbar. Display it uncropped at 4:3.

- Base capture: the 2026-10-10 Psyduck/Charmander screenshot, frozen 112-file,
  22:43 UTC build recorded in
  [BLUE-OPENING-REVIEW.md](../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING-REVIEW.md).
  Its SHA-256 is
  `07f600a20c738f84f6afd7bf41528316eea867b2edbcf57c068241df8bf9a865`.
- References: shipped `assets/roux/pokemon-roux.png` and
  `assets/blue/pokemon-255.png` under `games/pokemon-dungeon-reimagined/`, at
  source revision `2e7c1036ba22f56db9d90b24411d1dc1b0addb51`.
  Preserve their `assets/roux/NOTICE.txt`, `assets/blue/NOTICE.txt` and
  `tools/pokemon-dungeon/art/` source records.
- Method: built-in `image_gen` edited the base capture using both sprite atlases
  as references, replacing the characters and dialogue. The 1448×1086 output
  was resized to 256×192 with Sharp nearest-neighbor sampling, without cropping.
  Generated-source SHA-256:
  `dd27e8ff09feea63693530bc69d06d5ca52cc451137e1975ed48546c85b79099`.
- Limits: this authored image edit is not a new observed gameplay capture or
  an exact reproduction of the shipped sprites. It establishes neither
  original-game fidelity nor release approval. No game modules or automated
  playthroughs were executed to produce it.
- SHA-256: `ddb0a219707b14e27b36098546f266b254b8d680e2972b2418d996f5396a52ba`.
