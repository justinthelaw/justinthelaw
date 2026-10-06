# Original onboarding content catalog

This catalog supplies original quiz mappings, newly authored English, partner
choices and starter loadouts for later P19 integration. It contains 56 questions,
140 answer score maps, 55 selectable indices, 14 categories, 13 nature results,
26 gender outcomes, 10 ordered partner candidates, 129 valid ordered pairs and
16 two-stage starter profiles. It does not run a quiz or create a playable
campaign. Accepted P17/P18/P22 dependencies and P19 integration remain required.

## Source and manuscript boundaries

All 56 question identities and 140 score maps were reconciled against Peter O.'s
explicitly shared-original Red/Blue quiz research and pinned Red data. The
nature/gender results and same-type partner exclusion have shared-original
corroboration. Exact sampling, circular tie order, integer mapping, partner menu
order and new-game initialization internals are pinned Red comparative evidence,
not identified Blue binary traces. Sources retain the Red revision
`6bcbec4f906938c0243aa2026bcbd41b577bab85`, source paths/Git blobs where available,
question source lines, UPC rendered locators, research hashes and species catalog
input hashes. No Blue region/revision/hash parity is claimed.

`tools/pokemon-dungeon/content/onboarding-runtime/text.json` is original English
written from independent semantic summaries. Each question preserves the number,
order, meaning, score map and follow-up identity of its source options. The 13
result descriptions are new short descriptions, not copied commercial personality
paragraphs. Source wording, dialogue, scripts and artwork are not distributed.
Public sources grant no blanket commercial-content license. Human narrative
acceptance remains pending and is distinct from successful static checks.

The optional data-only `normalize-corpus.py` accepts the independently reconciled
research JSON as an argument. It joins current canonical profiles/levels/learning
records and the original project wording to create the durable authoring records.
`build-schema.py` produces their closed structural schema. Normal export/check
commands use checked-in data and need no network, ROM or research cache.

## Documents and strict schema

Each document uses schema version 1 and catalog ID `original-blue-onboarding`.
Factual documents also declare `edition: "blue-rescue-team-qualified-facts"`.

| File | Contents |
| --- | --- |
| `questions.json` | 56 questions with ordered options, sparse scores, explicit follow-up, source locators and separate manuscript provenance |
| `algorithm.json` | Nature order, zero scores, category membership, sampling rules, uint16 buckets and circular tie rules |
| `results.json` | 13 male/female result pairs, original English descriptions and gender-column facts |
| `partners.json` | Exact 10-species pool order and all 129 explicit ordered pairs with the deduplicated starting Friend Area union |
| `profiles.json` | 16 canonical species profiles, each separating `rosterCreation` from `firstPlayable` |
| `initialization.json` | Selection/opening order, consumed entry boost, member/move/economy/party defaults, naming timing and unresolved canonical joins |
| `sources.json` | Source/evidence records, research and catalog hashes, independent factual fingerprints, manuscript attribution and narrow capability boundary |
| `schema.json` | Seven closed document schemas shared by the static and browser validators |
| `manifest.json` | Exact ordered resource names, bytes and SHA-256 values |

The schema supports only `type`, `properties`, `required`,
`additionalProperties`, `items`, `minItems`, `maxItems`, `minimum`, `maximum`,
`minLength`, `maxLength` and `const`. Every nested object is closed and all its
fields are required. The only optional object keys are the 13 sparse nature
scores; positive values are 1-4 and the Brave branching option has an empty map.
Nullable fields remain present. Static Ajv and the browser's limited schema
interpreter use the same checked-in contract; neither follows schema references
or accepts executable expressions. The static checker also audits the schema
vocabulary and required-key closure. Gender source values, the result-column flag,
score/override flags and evidence qualification are fixed schema constants;
the loader independently checks those facts before exposing `getGenderFacts()`.
Both validators traverse all documents to join nested evidence IDs (including
profile evidence maps), source IDs and manuscript IDs. The static gate also
compares the gender prompt and both labels to the original `text.json` manuscript.

## Quiz and partner facts

Initialize the 13 nature totals to zero. For each of eight main slots, draw a
question index from 0-54, reject it if its category was already used, and mark
its entire category used before presenting the accepted question. The 13 nature
categories contain four questions each; miscellaneous has three. This is question
sampling with category rejection, not uniform selection among categories.

Option `brave-q2a-a0` has menu value 99 and an empty score map. It leads directly
to `brave-q2b` at index 55. Apply the follow-up's selected scores without consuming
another main slot or category. Index 55 is never directly selectable. The gender
choice follows eight main questions and selects a result column without changing
scores. The inspected original flow does not supply a direct species override.

The exact comparative mapper takes the low 16 bits of `Rand32Bit` and computes
`floor(uint16 * maximumExclusive / 65536)`. All 55 question buckets and 13 tie-start
buckets are retained. These are marginal arithmetic facts for a uniform uint16
input; original correlated RNG sequence, seeds and frame timing are not promised.
The future browser consumer must bind an accepted named stream explicitly.

For ties, start at the random nature index and examine the next 12 in ascending
circular order, replacing the current winner only for a strictly greater score.
This selects the first maximum encountered. It is not uniform selection among
tied maxima: a Hardy/Docile tie has ideal weights 12/13 and 1/13, or 60495/65536
and 5041/65536 under the recorded uint16 mapper.

Partner order is Charmander, Bulbasaur, Squirtle, Pikachu, Chikorita, Totodile,
Cyndaquil, Torchic, Treecko, Mudkip. Remove every candidate sharing any non-NONE
type with the hero, while retaining this order. Partner eligibility does not
inherit male/female hero-result restrictions. Each accepted pair stores the
ordered, deduplicated union of the two species' Friend Areas, with no unrelated
tutorial areas granted.

## Two distinct starting records

`rosterCreation` records level 1, EXP zero, source base stats and initial level-one
moves. Its `storedPP: 0` is a native roster storage convention. IQ starts at one;
both members exist, are on the team and are marked seen, with no held item.
The hero alone is leader. Initial Friend Area ownership costs nothing, although
the town service is not yet available. Explicit source origin symbols are
`DUNGEON_JOIN_LOCATION_LEADER` and `DUNGEON_JOIN_LOCATION_PARTNER`.

`firstPlayable` records the first Tiny Woods player turn, after the one-time
level 2-5 entry boost. The consumed guard changes before checking whether the
fresh entry is Tiny Woods; failure, retry and resume must not apply the gains
again. HP/stat caps are 999/255. Start with level-one moves, append level 2-5
entries in source order to free slots, and never replace occupied slots. There
are at most four moves. Actor conversion fills HP and PP, sets Belly/maxBelly to
100, leaves links/shortcuts off and enables AI move use with zero enhancement.
The catalog keeps these facts separate so roster PP zero or level one cannot be
mistaken for the first playable loadout.

Carried items and storage are empty; carried money and bank savings are zero.
Inventory-menu availability remains false until the source
`QUEST_SET_TEAM_NAME` predicate. The toolbox/first-mail kit is a later grant,
not an initial inventory. The party has two members and no escort. Caterpie is
the rescue target, not an initial teammate. Recruitment, leader changes and
evolution are initially unavailable. Native roster ordering is not guaranteed
to put the hero at array index zero; use explicit leader identity.

Custom character names are optional; this does not remove later canonical name
requirements from campaign state. Hero naming belongs to `opening-awakening`;
partner nickname confirmation follows partner choice and does not change scores.
The rescue team is not named before the first rescue. The plan order remains
awakening, Butterfree's request, Caterpie's clearing, reunion/reward, team naming
and the subsequent first-mail delivery/kit. The clearing is source map
`MAP_TINY_WOODS_END` (179), beyond three generated exploration floors, not a
fourth generated floor. Merely entering floor three does not complete the rescue.

## Typed browser lookup

Import `loadOnboardingCatalog` from `content/onboarding.js`. Pass an optional
`{ signal }` to cancel loading. It returns an immutable catalog with private maps.

| API | Return value |
| --- | --- |
| `getQuestion(questionId)` | Complete immutable question with ordered options and evidence |
| `getSelectableQuestion(index)` | Question at exact selectable index 0-54; index 55 rejects |
| `getOption(optionId)` | Immutable text, sparse score facts, menu value and follow-up |
| `getCategory(categoryId)` | Category membership and source marginal weights |
| `getAlgorithm()` | Structured sampling, mapper and tie facts; no scoring or RNG execution |
| `getNatureResult(natureId)` | Original description and male/female species mapping |
| `getGenderFacts()` | Prompt, labels and original result-column contract |
| `getGenderOutcome(natureId, column)` | Immutable `{ natureId, column, speciesId, formId }` lookup for `male` or `female` |
| `getPartners(heroSpeciesId)` | All permitted pairs for that hero in original menu order |
| `getPair(heroSpeciesId, partnerSpeciesId)` | Exact permitted pair and initial Friend Area union; invalid pairs reject |
| `getStartingProfile(speciesId)` | Separated raw roster-creation and first-playable facts |
| `getInitialization()` | Initialization, naming, scene sequence and integration joins |
| `getEvidence(evidenceId)` / `getSource(sourceId)` | Immutable qualification and source metadata |
| `natureIds`, `partnerPool`, `capabilities` | Frozen discovery lists and precise supported capabilities |
| `dispose()` | Idempotently clears lookup maps; later calls reject |

The loader names all nine JSON URLs explicitly relative to itself. It checks
manifest headers, exact resource order, sizes, SHA-256, the closed schema and
identity references before exposing a catalog. It uses HTTPS-host Web Crypto.
HTTP/JSON/schema/hash/reference failures reject atomically with the underlying
cause; pending requests are aborted and cancellation is checked after validation.
Source URLs are metadata, never fetched. Unknown IDs, invalid pairings, invalid
gender columns and noninteger/out-of-range selectable indices reject without a
fallback. Records remain frozen if callers retain them after disposal.

## Remaining integration joins

The numerical/textual facts are available now. They are not an accepted
`initialCampaign` profile. Fields requiring later accepted joins explicitly remain
`null`: runtime scene/map IDs, IQ/tactic IDs, starter origins, consumed guard,
inventory-unlock predicate, name policy, selected RNG stream and reward/kit grant
IDs. Plan scene names and source symbols remain available beside those gaps.
Actor-conversion Hidden Power parameters also need their own policy; none of
these 16 starting loadouts knows Hidden Power. No accepted scene cursor, map
coordinates, IQ/tactic behavior or campaign initializer is invented here.

## Static checks

From `tools/pokemon-dungeon/` with the pinned toolchain:

```sh
node scripts/export-onboarding.mjs
node scripts/check-onboarding.mjs
node scripts/export-onboarding.mjs --check
npm run lint
npm run typecheck
```

The checker validates exact membership, all closed nested schemas, source and
manuscript references, source factual fingerprints and deterministic export bytes.
It independently rejoins starting species/forms, full level-one/level-five stats,
EXP, ordered learning, PP, Friend Areas, valid partner types and existing Tiny
Woods floor/plan-scene IDs. It recomputes all uint16 bucket sizes and the tie
example arithmetically. These checks parse data/source only and do not import or
execute game modules, run a quiz or perform a playthrough. Narrative and P19
integration acceptance remain separate.

For data-only regression checks, run from the repository root:
`python tools/pokemon-dungeon/content/onboarding-runtime/check-fixtures.py`
The script copies the authoring documents and their static inputs
into an isolated temporary tree, mutates every declared evidence/source/manuscript
reference plus malformed gender facts/text/shapes, re-exports the manifest for
each case, and requires rejection. Valid input must pass before and after the
mutations. Only independent authoring scripts run; the browser module is read as
text, never imported or executed. The printed temporary tree remains available
for inspection.
