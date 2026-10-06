# State catalog joins: supported boundary

`content/state.js` supplies independently usable joins for P07-B. It is **not a
complete CampaignContent** and cannot admit a campaign, create a save, or start
Adventure. No sixteen-policy facade, content revision, initial scene or starter
tactic is supplied while their accepted definitions are absent.

## Implemented API

| Export | Contract |
| --- | --- |
| `createCatalogIdentityJoins({species,dungeons,effects})` | Frozen identity lookup over already validated factual catalogs |
| `joinStartingPair({onboarding,species,effects},natureId,column,partnerSpeciesId)` | Exact male/female result and permitted pair, with independent species/growth/EXP/learnset/move/PP/area joins |
| `validateCampaignOptions(options)` | Concrete semantic options policy, after exact CampaignOptions shape validation |
| `OPTION_BOUNDS` | Frozen application preference bounds; no defaults or load-time clamping |

Catalog dependencies are trusted local results of the existing loaders, not
save-supplied membership functions. Loaders retain ownership and disposal.
These helpers neither fetch nor dispose borrowed catalogs. Lookup failures
propagate; only a catalog's unknown-row `RangeError` becomes absent membership.
All new result objects are frozen and retained catalog records are already
deeply immutable. The helpers import no DOM, rendering, storage or simulation.

Supported `has` namespaces are `species`, `form`, `move`, `item`, `dungeon`,
`section`, `floor`, `friend-area` and `ability`. Form IDs must be actual non-null
profile form IDs; default species profile IDs are not form IDs. Explicit normal
Castform/Deoxys identities cannot omit their form. Persistent context excludes
temporary profiles; session context admits catalog forms but does not approve a
particular temporary transformation. The actor policy must do that.

`permitsFloor` checks dungeon membership, section ownership, floor ownership and
membership in an explicit section variant. It does not choose that variant's
campaign predicate. `permitsSection` checks both directions of ownership.
Fixed rooms and campaign ground-map source identities are not silently converted
to accepted `map-definition` records. Factual scene responsibilities are not
accepted executable scenes. Unsupported namespaces throw; the canonical validator
therefore records `campaign-identity-lookup:<kind>` as unresolved.

Move membership comes from the complete effects catalog (356 moves), not the
species learnset identity list (355 referenced moves). Item membership includes
the catalog's internal identities and makes no obtainability promise. Ability
and Friend Area membership uses the species identity inventory after checking
that the borrowed species catalog remains live through its known Bulbasaur row.
That row is only a lifecycle check, never a fallback identity.

The starting pair keeps `rosterCreation` and `firstPlayable` separate. The former
is level one/zero EXP and native stored PP zero; the latter is the one-time
Tiny Woods entry boost. Neither is silently selected as a new campaign template.
The join checks both records' numerical profiles and resources, move crosswalks,
learnset level entries, first-playable full PP, and exact ordered Friend Area
union. It retains all evidence qualifications and initialization joins. It draws
no RNG and creates no instance IDs or progression history.

Options use application-defined volume `[0,1]`, camera sensitivity `[0.1,4]`,
text scale `[0.75,2]`, and camera zoom `[4.5,12]` (renderer contract units).
Booleans and enum preferences remain the exact structural schema's responsibility.
These are browser UI bounds, not attributed original-game facts. UI and renderer
consumers must apply the same bounds when they are integrated.

## Blocking joins for a concrete CampaignContent

The following are missing consumer implementations or accepted state mappings,
not a blanket rejection of qualified original Red facts. Existing factual values
remain usable within their documented scope.

| Required policy | Exact missing responsibility |
| --- | --- |
| `profile` | Canonical quiz revision/outcome encoding, name rules and timing, original-selection integrity through evolution; source pair lookup is available |
| `pokemon` | IQ/tactic identity and unlock behavior, permanent growth/inheritance/evolution and accommodation/capacity rules, recruitability; numerical profiles alone are insufficient |
| `actor` | Role/reset/override/copy/Hidden Power rules, effective HP/PP/Belly/gains limits and imported team projections |
| `item` | Payload/variant joins, obtainability and origin, stack/held/sticky/scope rules; item-ID membership alone is insufficient |
| `economy` | Account/storage/area capacities and sourced grant/entry restrictions |
| `floor` | Accepted map/terrain/weather/trap identity joins, occupancy and authored geometry, exits/events, shop arithmetic and applicable variants |
| `conditions` | Canonical duration policy IDs and status payload/lifetime/source mapping to qualified effect contracts, stage/multiplier bounds and effect-specific unresolved subfields |
| `scheduler` | Concrete schedule policy/effect-program registry and legal saved PC/target/random-decision semantics supplied by the fifteen real TurnHooks |
| `expeditionEntry` | Complete baseline projection, retention rules and every departure/rescue outcome-policy definition |
| `progress` | Lossless native scenario/counter/flag/scalar projections, ordering and once-only callback/grant semantics |
| `job` | Concrete goal/floor/reward/difficulty generation or authored definitions, capacity/phase/mail rules |
| `scene` | Authored script/cursor/roles/choices/prerequisites and continuation definitions; 207 factual responsibilities are not scripts |
| `result` | Outcome classification, committed gain verification and permitted choices/continuations |
| `rescue` | Accepted exchange/digest/replay/lifecycle/reservation/restoration/imported-team rules |
| `town` | Accepted ground maps/coordinates/placements, service stock and source day/population rules |
| `options` | Implemented here; presentation consumers remain unconnected |

`onboarding/initialization.json` explicitly keeps runtime scene IDs, IQ/tactic
IDs, boost guard, inventory predicate, name policy, RNG stream and reward/kit
grants null. An accepted initial profile additionally needs initial town/day,
placements, scene cursor/bindings/awaiting/continuation, branch/milestone and
recruitment-history decisions. The input contract currently requires a team-name
string before the opening; source naming happens after the first rescue.
No semantic policy defines an unnamed value yet. An explicit deferred-name
representation or accepted input/staging adaptation is required, rather than
an invented team name or an undocumented empty-string convention.

[PROGRESSION-STATE.md](PROGRESSION-STATE.md) now defines the required
`ProgressState.native` representation, bounded source projections and pure
scenario/counter/flag operations. Its schema and initialization contract preserve
the eleven pairs, distinct counters, pending/persistent flags and scalar arrays.
The remaining progress policy must join these native facts to authored story,
branch, scene and map state and commit reward receipts and milestones once.
The helper cannot replace that transaction owner or supply missing opening data.

There is no complete accepted content revision yet. A future concrete adapter
must bind its reviewed semantic/state/presentation definitions and factual
catalog revisions together, instead of relabeling a single catalog schema number
as the revision of a playable campaign.

## Static review boundary

Run the independent game lint/type checks plus species, effects, onboarding and
dungeon authoring validators. They parse source/data without importing or
executing game modules. No automated gameplay, full policy acceptance, manual
campaign evidence or full-game completion is implied by these joins.
