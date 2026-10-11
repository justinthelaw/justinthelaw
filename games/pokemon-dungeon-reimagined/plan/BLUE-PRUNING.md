# Opening-only cleanup

On 2026-10-11, Justin explicitly requested removing unused code while narrowing
the game to startup, menus, character creation and Tiny Woods through Caterpie's
reunion. This cleanup removes the former campaign instead of retaining it as an
unselected runtime or validation dependency.

## Retained boundary

- `src/blue/` owns the selected browser game. Eight small shared numerical,
  generation, random-state and validation modules remain in `src/domain/`,
  with two scoped type files. The first retirement left 62 typed sources;
  the bounded PCM player/data and Hypnosis renderer/data bring the set to 66.
- `distribution.json` defines the playable resource closure. Historical
  campaign assets, catalogs, Three.js and authoring code are excluded and removed.
- The selected factual source retains complete growth and learnsets for its
  22 species because failed rescues preserve experience. Three Tiny Woods
  floors, 115 action records, quiz data and independent rule facts remain.
- Native art inputs, reconstruction code, source hashes and pixel evidence
  remain under `tools/pokemon-dungeon/art/blue/`. The raster writer and RNG
  attribution notice are retained. Current Blue reference notes remain.
- The selected authored score has 11 themes, 10 effects and 659 notes. Native
  short-effect inputs remain separate. No soundtrack-equivalence claim is made.

## Removed work

The retirement ledger contains 1,589 tracked files totaling 167,473,066 bytes:
old campaign/application/state/3D code, unused assets, full-game catalogs,
campaign validators, earlier art tools, schemas and superseded plans. Another
5,669 generated roster images bring the local retired total to 235,784,594 bytes.
Files were moved to macOS Trash, not permanently deleted. The ignored
`tools/pokemon-dungeon/.work/blue-pruning-audit-20261011-0437/trash-*-ledger.json`
records every original path, byte length, SHA-256 and Trash destination.

The former implementation is also recoverable from Git checkpoint
`882cdd14c25b7d79445a637f3dcd97d2c92f0c35`. Neither historical browser save
namespaces nor the opening's stored adventure data were deleted by this cleanup.

## Preservation evidence

Static review found 267 unnecessary source dependencies caused by broad JSDoc
imports. Local types sever that graph. Eleven unused declarations were removed;
all 72 retained shared-helper declarations remain AST-identical. Called floor
generation branches and random-draw order were unchanged in that first checkpoint.

Twenty-eight former factual donor files totaled 8,175,069 bytes. Their selected
unchanged records now occupy 386,335 bytes in `content/blue-source.json`.
Independent review verified every selected row and all donor hashes. The
projected gameplay data is deeply identical after excluding source-attribution
paths; the four playable quiz documents remain byte-identical. The scoped
factual checker retains independent reviewed fingerprints and joins.

The full-score donor was replaced with a selected editable source; music,
effects, instrument definitions and all note tokens are unchanged. The authoring
package now uses four direct dependencies and CI runs only selected static
checks. The obsolete Sinister Woods native-fetch/audit steps are removed.
The subsequent native SE2/SE5 admission makes six authored effect bodies
unreachable. Their removal retires 15 notes and saves 1,699 runtime bytes;
all retained score tokens and nine live patches remain unchanged. Explicit
native-menu catalog admission preserves all 24 accepted effect IDs.
Another closed-caller pass removes five unrequested roles and their 12 notes,
plus the private manager's unused volume wrapper. That saves 2,314 runtime bytes.
All 19 remaining requested roles, quiet defaults, live normalization and native
playback owners remain. The current authored bank has 10 effects and 659 notes.

Strict types passed against the actual 62-file pruned tree. The selected export
contains 143 resources totaling 3,034,160 bytes at this checkpoint. Static checks and the separate matching browser review are recorded in
[BLUE-OPENING-REVIEW.md](BLUE-OPENING-REVIEW.md). No game source or native game code
was executed by the static checks, and no automated playthrough was used.

## Tiny Woods generator specialization

The next pass removes another 11,419 source bytes across five files. Admission
now requires one of the three exact Tiny Woods profiles before any generation
draw or state reset. Other layout families, shops, monster houses, mazes and
secondary-terrain code are removed. The five extra hallway attempts remain.

Independent source review and AST comparisons preserve 49 function/class bodies
and prove the three specialized algorithms retain their reachable operations.
This includes discarded dimension draws, zero-bound draws, each room's rejected
secondary choice, rare room recovery, connection repairs and merge draws for
invalid grid slots. Geometry fields, placement, RNG and save data remain intact.
The proof establishes equivalence to the prior browser generator for admitted
profiles; native PRNG and Blue binary parity retain their existing qualifications.

The combined generator and LOOK camera revision passes the full Node 24.21
scoped check: 96 lint inputs, 62 strict sources and all factual/asset/export
checks. Its 143 selected resources total 3,034,606 bytes. The ignored proof
packet is `tools/pokemon-dungeon/.work/blue-generation-pruning-20261011-0503/`,
with the applied revision and root admission under `rebased-look/`.

A final reference-graph pass removes five unused functions and their sole
unused naming import from three Blue modules, saving another 995 bytes.
All 70 remaining statements are AST-identical. The active naming editor,
move-support predicate, save adapters and reachable move handlers remain.
Its ignored proof packet is `tools/pokemon-dungeon/.work/blue-dead-code-audit-20261011-0514/`.
