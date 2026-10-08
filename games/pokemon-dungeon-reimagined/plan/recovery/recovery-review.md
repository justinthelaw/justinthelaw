# Scoped independent recovery review — PR #392

Reviewed 2026-10-06 against the working tree and the specified `HEAD` diff.
No source edits, commits, game imports/execution, automated gameplay, or whole-game
acceptance review were performed. This report is the sole reviewer-authored file.

## Verdicts

| Responsibility | Specification verdict | Code-quality verdict |
| --- | --- | --- |
| New state catalog joins | Pass for the explicitly permitted independent responsibilities. Complete CampaignContent, initial construction and P07-B remain blocked, as reported. | Pass; no actionable implementation defect found in this scope. |
| Dungeon loader integrity fix | Pass; index fingerprint authenticates the schema and every exact shard before decoding. | Pass; deterministic reproduction and raw-byte integrity checks agree. |
| Recovered visual policy | Mostly corrected; one surviving contradictory production instruction requires correction. | Documentation change requested, P2 below. |

## Actionable finding

**P2 — Remove the surviving unconditional historical-B promotion instruction.**
`games/pokemon-dungeon-reimagined/plan/DECISIONS.md:37` still instructs an executor:
"After implementation is separately authorized, copy B unchanged into the future
local asset manifest." Implementation is already authorized, so the conditional
does not preserve an actual gate. This conflicts with the same document's D03
row at line 14 and B status at line 25, which supersede the old style and leave
loading use pending review. It also conflicts with `ASSET-PIPELINE.md:88` requiring
current review for loading use. Delete this imperative, or explicitly label it a
superseded historical instruction and require current visual approval before any
runtime promotion. This is an actionable planning inconsistency; the scoped code
does not itself promote that asset.

## State join evidence

- `content/state.js:1-8` exports only identity joins, starter joins and options;
  it does not provide a false CampaignContent facade, initialCampaign, revision,
  generic handler or always-true set of policies. This conforms to the brief's
  explicit exception for supported independent responsibilities when actual
  definitions are missing.
- `content/state/identities.js:12-15,30-49` converts only catalog `RangeError`
  absence to false. Unsupported namespaces throw. Species disposal raises Error
  (`content/species.js:349-354`), so it is not misclassified as an unknown save ID.
  Retained ability/area inventories first check the guaranteed Bulbasaur row.
  The canonical validator catches unavailable/unsupported lookup failures as
  unresolved requirements (`src/domain/state/validate.js:112-113`).
- `content/state/identities.js:54-77` checks explicit species/form identity and
  persistent/session scope, both directions of section ownership, and floor
  membership in a section variant. These checks do not claim variant eligibility
  or transformation behavior. Complete effects membership supplies moves/items.
- `content/state/starters.js:17-57` checks species/profile/form, area and resource
  crosswalks, both initialization stages' exact growth/EXP, learnset level/move
  joins, first-playable PP and ordered deduplicated pair areas. Frozen wrappers
  borrow immutable loader records. Neither stage is silently chosen as a campaign
  template, and initialization evidence/uncertainty remains available.
- `content/state/options.js:4-26` supplies finite inclusive bounds rather than
  clamping/defaults; exact shape, enum and boolean validation stays canonical.
  Zoom 4.5–12 agrees with `plan/RENDERER-CONTRACT.md:141`. Other ranges are openly
  identified application choices, not invented original-game facts.
- `plan/STATE-CATALOG-JOINS.md` accurately enumerates all sixteen obligations and
  leaves fifteen incomplete. The principal blocker is substantiated by the closed
  `ProgressState` (`src/contracts/campaign.js:1079-1104`) versus sourced reset/flag
  lifecycle and eleven scenario-pair responsibilities (`plan/CAMPAIGN-CATALOG.md:
  48-72,80-92`). Actual onboarding initialization retains null canonical joins and
  later team-name timing. The report does not disguise those gaps as accepted
  construction or require rejecting all qualified comparative Red facts.

## Dungeon integrity evidence

- Reviewed exactly `content/dungeons.js`, `content/dungeons-integrity.js`,
  `tools/pokemon-dungeon/scripts/export-dungeons.mjs` and `plan/DUNGEON-CATALOG.md`
  against HEAD. Existing factual validation is preserved.
- `content/dungeons.js:128-151` restricts local filenames/hash descriptors, rejects
  redirect/nonlocal response URLs, streams into a fixed 1 MiB buffer with strict
  less-than bounds, releases the reader, hashes raw bytes, then decodes fatal UTF-8
  and parses JSON. A syntactically/schema-valid changed shard cannot bypass SHA-256.
- `content/dungeons.js:153-160` authenticates the index with a generated code anchor,
  obtains the schema hash only from that authenticated index, requires the exact
  local resource sequence, and passes every authenticated shard descriptor's hash
  to the same byte reader. Coverage is included in authenticated index bytes.
- `export-dungeons.mjs:9-30,44-48` uses stable sorted authoring membership and compact
  JSON plus newline; its check mode compares exact emitted bytes and generated
  anchor text. No runtime/game module is imported by this exporter.
- Independent read-only Python JSON/byte inspection checked all 25 resources,
  index-to-schema and all 23 shard hashes, exact filenames and positive sizes below
  1 MiB. Largest resource: **726,562 bytes**; total: **7,119,169 bytes**.
  Manifest SHA-256: `b508ee769bd36619ac9eb07f22ad12455351323e7331f3568263b70a3cdcc44f`.
  Schema SHA-256: `a08bdc70290e00b2ec422dc691152c5075f6f3efe5dfce1915928b13d3ee9431`.

## Visual-policy evidence and verification

`FULL-GAME-GOAL.md:39-45` explicitly supersedes historical B/no-pixel guidance and
requires directional RGBA atlases on depth-tested billboards in actual 3D.
PLAN's authority, D03 and historical candidate sections, RENDERING's current atlas
pipeline, ASSET-PIPELINE's archive table, and PROGRESS's later correction consistently
retain old artwork as historical/rejected evidence and keep current art acceptance
open. The finding above is the surviving operative contradiction in these files.

From `tools/pokemon-dungeon/`: `node scripts/export-dungeons.mjs --check` passed
(25 deterministic resources), `npm run lint` passed (166 authored files), and
`npm run typecheck` passed (90 authored game sources). Reviewed lint checker uses
parsing/path resolution only; no game imports or execution occurred. `git diff
--check` passed for the tracked working-tree diff. These checks support this scoped
source review, not gameplay, complete adapter, visual acceptance or release.

## Scoped re-review — visual instruction correction

Rechecked only `plan/DECISIONS.md:37` after the controller's correction on
2026-10-06. The former B-promotion instruction is now explicitly superseded,
both illustrations remain historical evidence, and future loading artwork
requires review against the current visual direction. **P2 resolved; scoped
visual-policy verdict passes. No actionable findings remain in this review.**
The previous state-join and dungeon-integrity verdicts remain unchanged; complete
CampaignContent and full-game acceptance remain outside this re-review. No
additional source execution or broader review was performed.
