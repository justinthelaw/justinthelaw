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
- Runtime facts retain complete growth and learnsets for all 16 playable
  species because failed rescues preserve experience. Four wild species retain
  level-one moves and the next-level EXP validation threshold. The runtime has
  three floors and 101 actions; the reviewed authoring source keeps all 22
  profiles and 115 actions, alongside quiz data and independent rule facts.
- Native art inputs, reconstruction code, source hashes and pixel evidence
  remain under `tools/pokemon-dungeon/art/blue/`. The raster writer and RNG
  attribution notice are retained. Current Blue reference notes remain.
- The selected authored score has 11 themes, 9 effects and 657 notes. Native
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
playback owners remain. That checkpoint has 10 authored effects and 659 notes.
The later native miss route removes its two-note authored substitute, leaving
nine effects and 657 notes at that checkpoint. Ground-pickup admission later
removes the two-note authored money cue, leaving eight effects and 655 notes.

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

## Runtime fact projection

A further pass removes 41,760 runtime bytes: 39,241 from unused combat facts
and 2,519 from 14 unreachable motion records. Caterpie and Butterfree keep their
story sprites, portraits and names; their unused combat profiles are removed.
Unused identifiers, hit-count metadata and duplicated starting profiles leave
the runtime projection while the reviewed authoring source stays unchanged.

All 16 full playable growth tables and learnsets, four wild level-one loadouts,
101 retained move/motion records and 60 timers remain exact. The wild tables
keep two growth rows because save admission uses the second EXP threshold.
The save validator, actor creation, learning and other runtime algorithms are
unchanged. Independent review also checked native item and evolution exceptions.

The composed data and regular/miss audio revision passes the full Node 24.21
check with 102 lint inputs and 66 strict sources. Its 148 runtime files total
3,026,451 bytes, leaving 119,277 bytes below the cap. The ignored source proof
is `tools/pokemon-dungeon/.work/blue-runtime-facts-prune-20261011-0601/`.

Unused generated-score metadata removes another 1,466 runtime bytes, including
an explicit author-credit addition to the retained source header. All 657 note
tokens, 20 cue playback bodies and nine instrument definitions remain exact;
the complete editable attribution and shipped NOTICE are unchanged. The full
scoped check passes with 148 files totaling 3,024,985 bytes and 120,743 bytes
below the cap. No playback owner or browser dependency changes.

Startup also stops preloading three default playable species before they are
chosen, removing 112 runtime bytes and deferring four to six asset requests.
The initial Pelipper and random client remain; every play and Continue
transition still awaits its selected species assets. The unused Delivery menu
illustration is retained because the original game has multiple in-scope
file-menu backgrounds. The composed Hypnosis attachment and North American
file-menu revision passes the full scoped check with 149 runtime files totaling
3,038,939 bytes, leaving 106,789 bytes below the cap.

The transient geometry pass removes inert shop, house, door, reward and
secondary-structure fields and their constant guards. It saves 1,041 runtime
bytes and 488 type-only bytes, avoiding 14,336 cell-property initializations
per generated layout. Two independent AST projections preserve all 40 RNG
call sites and their control flow, exact three-profile admission, retry and
save projection. The full scoped check passes at 149 files and 3,037,898 bytes.
This proves equivalence to the selected browser generator, not cartridge RNG
identity or a measured heap/time improvement.

## Selected motion and mechanics tables

Two further passes remove 1,349 runtime bytes without changing the file count.
The first removes three unused mechanics entries and 30 Pelipper battle-motion
properties, saving 541 bytes. Pelipper's opening sprites remain. Saved confusion
and special-defense fields, shared hit-count logic and direct-damage ownership
also remain; the Poké throw path needs the direct-damage helper.

The second removes 52 motion properties for 26 species/action pairs outside
the admitted learnsets, saving 808 bytes. All 233 reachable pairs preserve their
animation and attachment results. Full learnsets remain, including later levels
reachable through retries. Regular attack, Struggle and Bide release remain
universal; saved Bide status is not species-restricted. The exporter requires
widening this selection before enabling copied moves such as Assist or Mirror
Move. Their current handlers are unavailable, so they cannot bypass the filter.

Only three art-manifest scalars change with each motion export. No sprite,
portrait, effect atlas, source archive or save schema is removed. The ignored
proof packets are `blue-selected-table-prune-20261011-0808` and
`blue-motion-learnset-prune-20261011-0815` under `tools/pokemon-dungeon/.work/`.

## Compact runtime metadata

Four further reductions remove 85,778 runtime bytes before the Synthesis
correction and attribution updates:

- Cinematic metadata removes 30 unused pose entries and zero frame tails.
  All 59 frame draw records and both PNGs remain exact; runtime saving is
  1,024 bytes.
- Battle metadata removes zero shadow/flag tails and duplicated pose bounds.
  All 599 frame prefixes, 546 pose unions and 595 layers retain their values.
  Deriving the same extent checks gives a net saving of 16,508 bytes.
- The unused 39,565-byte main asset manifest stays in the repository for build
  inventory/provenance checks and leaves the browser distribution. All 13 fetch
  sites were reviewed; NOTICE and the live scenery manifest remain.
- Scenery metadata retains the 2,352-entry terrain lookup and all 65 aura palette
  frames. The remaining provenance and inventory move into the offline
  `tools/pokemon-dungeon/art/blue/native-scenery-metadata.json`, without duplicating
  those arrays. Reassembly is exact and all 14 PNGs remain unchanged; runtime
  saving is 28,681 bytes.

The source exporters reject nonzero discarded frame fields. Actor animation
flags, source archives, save schemas and runtime asset limits remain intact.
Synthesis's separately reviewed mechanics/artwork and corrected NOTICE bring
the net reduction to 83,106 bytes. The full scoped check passes at 149 files /
2,994,305 bytes, with 151,423 bytes below the 3 MiB cap. The ignored composition
ledger is `tools/pokemon-dungeon/.work/blue-pruning-composition-20261011-0913/`.

## Character and sprite descriptors

Three further projections remove 105,014 runtime bytes before the separate
Rapid Spin correction and documentation changes:

- Character creation keeps all 56 questions, 140 options, scores, follow-ups,
  nature results and 129 ordered partner pairs. Source evidence, redundant
  indices and later-game Friend Area metadata stay in the complete authoring
  catalogs. Compact runtime JSON and unused type/comment removal save 98,255
  bytes; the quiz and story executable ASTs are identical.
- Battle effects keep every drawing and timing field while source names,
  file/animation IDs, palettes and wait flags stay in the existing source
  records and evidence. Full checks precede schema 3 emission; runtime saving
  is 3,919 bytes without a new ledger or changed playback method.
- Actor schema 3 omits only repeated direction, attachment-order and edition
  descriptors, saving 2,840 bytes. All 23 PNGs, 29,589 seven-field animation
  frames, attachment pools, clips and species identities remain exact. The
  full authoring record checks the omitted descriptors before projection.

Existing source hashes, factual checks, image bounds and save guards remain.
The composition ledger is
`tools/pokemon-dungeon/.work/blue-pruning-composition-20261011-1000/`.

## Opening portrait selection

The atlas now retains 89 portraits and omits 124 unused non-normal emotions.
The original opening/retry/rescue scripts and current browser calls require
88 records; retaining Pelipper normal also preserves every existing normal
fallback. All 213 source images, their archive and both Blue pixel comparisons
stay offline. The source exporter and independent coverage check require this
exact selection before publication.

The two runtime assets shrink by 110,782 bytes, and nominal decoded RGBA falls
by 768,000 bytes. Every retained crop is identical; runtime portrait lookup,
aliases, lifecycle and other JavaScript are unchanged. The ignored design and
implementation packets are `blue-portrait-scope-audit-20261011-1015` and
`blue-portrait-implementation-20261011-1023` under the authoring `.work/` directory.

The combined export, including the separately reviewed Rapid Spin mechanics,
target artwork and finite Rapid Spin/Synthesis sounds, contains 149 files and
2,808,109 bytes. That is 186,196 bytes below checkpoint `25a4cce` and leaves
337,619 bytes under the 3 MiB cap. The full Node 24.21 static check passes with
103 lint inputs and 67 strict sources. The final composition receipt is
`blue-pruning-composition-20261011-1000/release-1045.json`; the matching frozen
browser snapshot is `blue-opening-review-20261011-1045`, both under `.work/`.
