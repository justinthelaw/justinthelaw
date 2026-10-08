# Onboarding content implementation report

Status: complete sourced content and immutable lookup responsibility for later
P19 integration. No quiz application, campaign creation, P19/P22 acceptance or
playable opening is claimed. Manuscript human acceptance remains pending.

## Owned files and scope

Exactly 24 new owned files: 11 authoring files under
`tools/pokemon-dungeon/content/onboarding-runtime/` (eight exportable JSON
resources, original `text.json`, optional independent normalizer and schema
builder), nine runtime JSON files under `content/onboarding/`,
`content/onboarding.js`, two tool scripts and `plan/ONBOARDING-CATALOG.md`.
Largest individual file: 81,084 bytes. Every resource remains below 1,024 KiB.
No package/shared configuration, existing content/state/scenes, README or shared
progress file was edited. Controller was notified to add onboarding export/check
aliases and check-chain wiring separately.

## Coverage and schema

- All 56 questions, 140 ordered option score maps, 55 selectable indices and
  14 source categories; Brave's conditional question remains index 55.
- All 13 natures, 26 male/female outcomes and original English descriptions.
- Exact 10-species partner order and all 129 explicit permitted ordered pairs,
  each with its deduplicated Friend Area ownership union.
- All 16 starters as distinct `rosterCreation` level-one facts and `firstPlayable`
  level-five loadouts. All original stats/EXP/order/PP and move flags are retained.
- Structured source sampler, uint16 mapper and bucket sizes, strict-greater
  circular tie rule, zero scores, category bookkeeping and follow-up behavior.
- Empty inventory/storage, zero carried/banked money, original IQ/tactic symbols,
  role/leader facts, no held items, starting Friend Area ownership and original
  opening/reunion/team-name/first-mail-kit ordering.
- Exact source origin symbols were read from `CreateLeaderPartnerData`:
  `DUNGEON_JOIN_LOCATION_LEADER` and `DUNGEON_JOIN_LOCATION_PARTNER`.

Version-one factual documents declare `original-blue-onboarding` and
`blue-rescue-team-qualified-facts`. One checked-in closed schema is consumed by
both the static Ajv gate and the browser's restricted schema interpreter. Every
nested record field is required, including nullable fields; extra fields reject.
Only the 13 sparse nature-score keys are optional. The limited declared vocabulary
covers type/properties/required/additionalProperties/items, sizes, numeric bounds,
text lengths and scalar constants. No schema reference or expression executes.
The static checker audits vocabulary and closed-key requirements separately.

## Original authored text

`text.json` contains 56 new prompts, 140 new option labels, 13 new short nature
result descriptions and a gender prompt/labels. These were authored from the
independent semantic summaries, preserving each option's intent and source order.
No commercial question wording, distinctive personality paragraph, dialogue,
artwork or source implementation was copied. Each runtime question/result has
`project-original-en-v1` manuscript provenance, separately from factual evidence.
The source manifest records `humanNarrativeAcceptance: pending`; static success
is not manuscript acceptance.

Custom hero/partner names are optional; canonical campaign name policy remains
unjoined. Hero naming stays in the awakening plan scene, partner nickname
confirmation follows selection, and team naming follows the first successful
rescue. No prematurely named team or initial story kit is synthesized.

## Exact public API

`loadOnboardingCatalog({ signal } = {})` returns an immutable catalog exposing:

- `getQuestion(questionId)`
- `getSelectableQuestion(index)` for integer indices 0-54 only
- `getOption(optionId)`
- `getCategory(categoryId)`
- `getAlgorithm()`
- `getNatureResult(natureId)`
- `getGenderFacts()`
- `getGenderOutcome(natureId, 'male' | 'female')`
- `getPartners(heroSpeciesId)` in original menu order
- `getPair(heroSpeciesId, partnerSpeciesId)`
- `getStartingProfile(speciesId)`
- `getInitialization()`
- `getEvidence(evidenceId)` and `getSource(sourceId)`
- Frozen `natureIds`, `partnerPool` and narrowly scoped `capabilities`
- Idempotent `dispose()`; subsequent lookup calls reject

Lookup does not apply scores, select questions, draw RNG, create domain state or
advance any scene. The loader names all nine relative resource URLs explicitly,
checks header/resource order/size/SHA-256/schema/ID references, validates partner
completeness/order and loads atomically. Cancellation and failures abort pending
requests and retain underlying error causes. Deeply frozen snapshots and private
maps prevent mutation; unknown IDs/pairs/columns/indices reject without defaults.
The script is strict-JSDoc typed and uses local resources plus browser Web Crypto.

## Source qualifications and integration joins

The independent corpus provides all 56 UPC-confirmed questions/140 mappings and
shared-original gender/partner facts. Exact sampler, tie ordering, uint16 mapping,
partner order and initialization internals retain pinned Red comparative labels.
No identified Blue binary or native correlated RNG/seed/frame parity is claimed.
Source revision, Git blobs where available, source lines, UPC locators, independent
research file hashes and existing species input hashes are retained.

Twelve starter EXP profiles inherit shared-original UPC/Red corroboration and
four inherit explicit comparative-only EXP evidence from the species catalog.
Stats/learning and all starting PP values retain the Blue-reported/Red agreement.
The static checker rejoins PP to the current effects catalog and all profile,
level, learnset, move and area references to the existing species catalog.

The one-time boost consumes its fresh-entry guard before the Tiny Woods check;
retry/resume must not add levels again. Native roster PP zero remains separate
from playable full PP. Leader identity is explicit, never inferred from array
position. The clearing after three floors is source map 179, not another
generated floor, and rescue acknowledgement is required before reunion/rewards.

Future accepted canonical joins remain explicit nulls with source symbols/plan
references: IQ/tactic IDs, starter origins, source entry guard, inventory unlock,
name policy, named RNG stream, runtime scene/map IDs and reward/kit grants. A ready
`initialCampaign` profile, exact scene cursor/coordinates and Hidden Power
conversion policy remain the P17/P19/P22 integration obligations. No starting
loadout knows Hidden Power. These joins do not block established factual lookup.

## Verification

- `normalize-corpus.py` and `build-schema.py` regenerated identical JSON bytes.
- `node scripts/export-onboarding.mjs --check`: passed all nine resources.
- `node scripts/check-onboarding.mjs`: passed complete membership, shared closed
  schemas, independent source factual fingerprints, uint16 bucket arithmetic,
  partner exclusion/order/area unions, and canonical species/level/learning/PP/
  dungeon-floor/plan-scene joins.
- Isolated authoring JSON fixtures at
  `/tmp/onboarding-static-review-gl5yel0s`: all 29 malformed records rejected and
  the valid catalog accepted before/after. Cases include missing/extra nested
  fields, wrong source IDs, altered score maps, follow-up/sampling/tie changes,
  wrong partner/area records, conflated roster level, roster/playable PP errors,
  premature naming/economy grants, invented canonical scene IDs and false source
  claims. Every mutation was re-exported, so rejection was not a stale export.
- Scoped ESLint over onboarding loader/export/check scripts: passed.
- Strict static typecheck: passed, 58 authored source files in the current tree.
- Scoped pre-commit/pre-push hooks and `git diff --check`: passed.
- Whole-tree lint was also attempted during concurrent renderer/art edits. Its
  last remaining finding was unrelated environment-viewer `materials` prefer-const;
  onboarding sources pass the independent scoped lint. No unrelated edits were
  made to resolve another owner's in-progress source.
- No browser game module was imported or executed. Fixture work ran only the
  independent authoring scripts and read game source as text. No game test,
  playthrough, fake quiz screen or premature P19 consumer was created.

Commit: `5080312f4525f669047590a6cf5477c6cbdbe8d9` (`Add sourced original onboarding questions and starter profiles`).
Exactly 24 owned files were staged. The index is empty and released to the
controller; unrelated renderer/art/progress files were preserved.

## Review repair: complete nested provenance and gender contract

Addressed the P2 in `task-1-review.md` without altering any source facts,
original prose, result tables, profile records, source qualifications or public
lookup signatures. The shared schema now fixes both gender source values,
all three behavioral flags and the `shared-results` evidence qualification as
scalar constants. The schema generator uses explicit sourced constants rather
than inferring them from potentially malformed normalized input. The static
checker also requires the exact gender contract and reconciles the prompt and
both labels against `text.json`. The loader independently checks the literal
contract before returning any catalog API.

Both validators now traverse all seven validated factual documents and join
all declared `evidenceId`/`*EvidenceId`, `sourceId`/`sourceIds` and
`textProvenanceId` references, plus every named entry in profile evidence maps.
This covers 400 individual references: 178 evidence, 153 source and 69 manuscript
references. In particular, algorithm policies/source locators, all initialization
sections, partner eligibility/order evidence and gender evidence are checked.
Static inspection confirms the runtime pass runs after unique source/evidence
maps are populated and before lookups are published; the pass does not traverse
schema definitions or evaluate factual algorithm data.

Added `content/onboarding-runtime/check-fixtures.py` within the owned authoring
folder. It copies only static dependencies to a temporary tree, invokes the
independent export/check scripts, changes one JSON field per case, exports fresh
manifest hashes and requires rejection. It includes every reference occurrence,
all gender field/child deletions, false result-column and other altered flags,
reversed source values, wrong-but-existing evidence qualification, and each
altered gender manuscript string. Valid data must pass before and after. It can
run from any working directory and never imports browser modules.

Verification: valid export equality, complete static onboarding check,
loader syntax, scoped ESLint and strict static types (72 authored source files)
passed; scoped pre-commit/pre-push hooks and diff whitespace passed (the Markdown
hook normalized its own document once; the subsequent run passed). Both the
scratch sweep at `/tmp/onboarding-static-review-zx92mj90` and the checked-in
helper invoked with an absolute path from `/tmp` at
`/tmp/onboarding-static-review-sb74763s` rejected all 449 malformed authoring
fixtures, including all 400 reference mutations. Both valid baselines passed
before and after each sweep. Each rejection followed a fresh export.

The runtime schema and relation checks were inspected as source; the runtime
was never imported or executed. No game tests or playthroughs were created.
Only the eight owned implementation/schema/export/documentation/helper paths
changed; this report is coordination metadata. Changes remain unstaged pending
the controller's next index slot. Unrelated campaign/state/package/art changes
were preserved.

Repair committed as `4ae6745` (`Validate nested onboarding provenance and gender facts`).
Exactly eight owned files were staged. The report is untracked coordination
metadata and was not forced into Git. Index is empty and released; unrelated
package aliases and scheduler/campaign fields remain untouched.
