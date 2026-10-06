# Campaign progression fact catalog

This catalog supplies qualified original-game predicates, ordered actions and
source/canonical identity crosswalks. It does not evaluate a campaign, stage a
scene, supply dialogue, or satisfy a playable-game completion gate. Original Blue
is the target; pinned original Red facts remain explicitly comparative.

## Public boundary

`content/campaign.js` exports
`loadCampaignCatalog(dependencies, {signal}?) -> Promise<CampaignCatalog>`.
`content/campaign-types.js` contains generated readonly document types.

The required synchronous membership adapters are `isSpeciesForm`, `isDungeonId`,
`isSection(dungeonId, sectionId)`, `isFixedRoomId`, `isItemId`, and `isFriendAreaId`.
They must use the reviewed species, dungeon, effects-item and Friend Area
catalogs; missing callbacks or anything other than exact `true` rejects the join.
Species predicates with no form test current species ownership; a concrete form
is checked when a record supplies one. These are membership attestations, not
permission to bypass recruitment or entry rules.

The loader uses fixed local URLs, rejects redirects and resources of 1 MiB or
larger, checks the pinned manifest digest and every declared byte count/hash,
validates exact headers and all nested shapes against the shared closed schema,
checks foreign keys, hook order, predicate cycles and required sourced counts,
then freezes the entire returned data graph. Cancellation aborts pending loads;
`dispose()` clears indexes and makes all access methods reject. No consumer sees
partially loaded records.

| API | Returned factual surface |
| --- | --- |
| `getModel()` | Counter units/reset rules, scenario comparisons, flag lifecycle, ordering |
| `getContracts()` | Return selection, exceptional bosses, ambient hooks, scenario domains |
| `getPredicate(id)` | Closed declarative predicate; no evaluation |
| `getTransition(id)`, `getTransitionsForHook(id)` | Immutable actions in explicit order |
| `getRoute(id)`, `getRouteBySourceIndex(index)`, `getRoutes()` | 83 native routing identities and canonical joins |
| `getReturn(id)` | Ordinary/job/Dojo/fugitive/rescue day policy |
| `getBoss(id)`, `getBosses()` | 26 first/retry/revisit fixed-room dispatch records |
| `getRecruitment(id)`, `getRecruitmentRules()` | 18 persistent recruitment flag requirements |
| `getRematch(id)`, `getRematches()` | Current-ownership gates and original level increments |
| `getIdentity(id)`, `getIdentities()` | Newly authored stable keys, native namespace and source crosswalk |
| `getCallback(id)` | Required consumer responsibility and source operation identity |
| `getEvidence(id)`, `getSource(id)` | Qualified locator and pinned file fingerprint |
| `getRemainingCapabilities()` | Bounded presentation/exchange/scene-production work |

## Exact behavior preserved

- Six positive main-story gates use completed-job rewards: 2, 3, 2, 3, 4, 2.
  Each eligible reward increments `CLEAR_COUNT` separately after reward creation
  succeeds, capped at 100. MAIN pair changes and the explicit initialization hook
  reset it. Reassigning the same pair preserves it. Days and outings are different
  quantities. The special pre-wait Meanies branch is separately represented.
- Ordered day hooks preserve the MAIN15,7 early stop, Wish/Gengar waiting steps,
  and Meteor-before-Western-before-Latios introductions. `next-day-2` omits those
  introductions. Continuing a save, Dojo return, fugitive segment continuation,
  ordinary town movement and rescue suspension do not manufacture a normal day.
- The 21 unlock-refresh rules retain exact AND/OR structure, scenario comparisons,
  HM Toolbox/storage scopes, Friend Areas and current roster ownership. Gengar
  directly requires Stormy Sea completion and the completed Medicham rescue.
- Talk/day edges are distinct. Gardevoir refusal or full capacity leaves the
  invitation available. Freeze escort failure preserves its step; Murky return
  raises an active attempt to step 54,4 before success/failure routing.
- Square, Pond, Post Office and base populations use map-specific arbitration.
  Square's Buried population selection precedes the explicit `EVENT_LOCAL`
  reset; it alone does not retain that bit to suppress Munchlax. Other composed
  groups after the reset do. Munchlax cooldown and Smeargle flag refresh have
  their specific boundaries, not every town movement.
- Nonstory mission, completed flag, reached flag, then first encounter is the
  boss selection order. Reads use persistent flags, temporary writes use pending
  flags and flush ORs/clears pending state. Regi setup writes pending flags and
  clears both scopes when required; corresponding-Part pickup writes persistent
  state. Current roster ownership is never an ever-recruited achievement.
- Birds add 20 levels on eligible revisits; Groudon/Rayquaza add 10. These are
  increments capped at level 100 with valid-actor/unlocked-experience guards.
  Celebi invitation, named Eon recruitment, Jirachi stone choice, Regi Parts and
  nonrepeat story encounters have separate contracts.

## Identity and return decisions

The catalog defines 410 new factual identities: 207 scene responsibilities,
71 invocation hooks, 48 milestones, 34 native cutscene flags, 15 ground-map
identities, 15 scalar projections, 11 scenario pairs and 9 independent branches.
These are explicitly marked `authoringOrigin: campaign-catalog-v1`; they do not
pretend to be completed presentation scripts. Scene definitions join their source
symbol and their uses in routing/transition records. Milestone/domain records
state which scenario chapter they describe. New IDs must be mapped deliberately
by the later scene/state adapter, not silently coerced into an existing save key.

Native map, script-dungeon, rescue-dungeon and procedural-dungeon namespaces are
separate. Ground-map definitions carry numeric source indices. Scalar projections
identify native arrays/reductions: previous map is `GROUND_GETOUT`, Munchlax uses
`EVENT_GONBE[0]`, and the Buried conversation gate sums `EVENT_S07E01`.

All 83 routing rows are retained, including repeat-story entries and wrappers.
Native row0 is `SCRIPT_DUNGEON_TINY_WOODS`, not the enum count sentinel. Native
script76/procedural96 is an excluded source slot with an explicit exchange
capability boundary, not a fabricated 23rd Blue Dojo maze. Script77 joins the
reviewed Rescue Team Maze. Wrapper81 resolves `DUNGEON_ENTER_INDEX`; wrappers
80/82 stay distinct. Null native destination sentinels preserve caller context.
Alternate Freeze summit joins the reviewed alternate-visit section variant.

41 return hooks contain 488 finite decision rows. Each row is an entry-state
predicate conjunction and an ordered factual action list. Complementary branches
are explicit `not` predicates. Exactly the applicable decision is selected;
then actions run in order. Read-only job-presence queries are memoized for that
dispatch. The authoring transformation rejects a later scenario condition that
would require reading a state it had already changed. No labels, bytecode program
counters, commercial command arrays or 1,483-script interpreter are shipped.

## Required consumers

The catalog's actions describe operations; they do not perform them. Campaign
state owns MAIN/SUB/SELECT projections, counter resets, once-only grant history,
transaction validation and day commits. Scene content owns fresh dialogue,
staging and acknowledgment boundaries. Town owns population recomputation and
source-ground-map adjustment for the base. Expedition owns settlement before
return routing, section continuation, entry validation and rescue lifecycle.

Jobs own reward eligibility, reward-loop termination and the read-only native
callback 11 count query. Recruitment owns current roster checks, Friend Area/body
capacity, named invitations and decline/retry behavior. Inventory owns the
Wish Stone grant and Regi Part operations. Wishes own their choice/reward
transaction. Town UI owns map/dungeon/Dojo choices and cancellation. Town RNG owns
the declared Munchlax draw and its two presentation variants. Every required
callback blocks its affected operation when missing; no automatic success or
universal failure fallback exists. Native menu opcodes 3/4/6/7 are distinguished
from callback IDs invoked through opcode 59.

`queue-scene` transfers a factual scene responsibility to that consumer;
`replace-root` and `stop` terminate the current hook. Ordinary `continue` runs
the next rule in order. Required callback success precedes later actions; a failed
or cancelled invitation/grant does not apply later scenario mutations. The future
engine must commit these operations atomically with existing state/result/scene
contracts and prevent repeating acknowledged rewards or day boundaries.

## Validation and remaining work

`tools/pokemon-dungeon/scripts/check-campaign.mjs` independently validates nested
JSON with Ajv, source-reference facts, all catalog joins, native identity rows,
ordered hooks, hash parity, required counts and representative progression
contracts. `export-campaign.mjs --check` verifies exact checked-in runtime bytes.
Strict JSDoc and lint parse source only. Automated game imports, evaluation and
playthroughs remain prohibited.

Current data: 1,011 predicates, 586 transitions, 83 routes, 26 boss dispatches,
18 recruitment flags, 14 rematch records, 20 required callbacks, and 64 pinned
source fingerprints with 356 locators. Largest runtime JSON is below 1 MiB.

Blue display-label fidelity, D04 version/dual-slot exchange adapters and authored
scene presentation remain separately bounded capabilities. No campaign execution,
full-game completion, Blue instruction parity, manual playthrough or visual
acceptance is claimed by this package.
