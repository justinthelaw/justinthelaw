# Public asset instructions

Files here are copied into the static website. Reference local assets through
the configured base path; keep game runtime assets under their game's declared
distribution instead.

- Preserve source attribution, licenses, capture provenance, and native aspect
  ratios. Use factual alternative text and meaningful filenames.
- Social link icons are configured in `src/pages/index.tsx`; existing icons
  use 48x48px PNGs. Preview metadata lives in `src/config/arcade.ts`.
- Display arcade captures uncropped with crisp scaling. The selected Tiny Woods
  capture is 256x192 (4:3); its evidence is in
  [arcade/PROVENANCE.md](arcade/PROVENANCE.md).
- Update a capture's date, build/evidence reference, scope limitations, and
  SHA-256 when replacing it. A screenshot records an observed scene; it does
  not establish exact original-game fidelity or approve a release.
- Keep authoring files and disposable previews outside `public/` and `games/`.
