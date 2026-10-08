# Recovered P11 navigation and generation boundary

This freezes the consumer boundary of the recovered source on 2026-10-06.
It does not mark full P11 review, integration or manual acceptance complete.
Types in `src/domain/navigation/types.js`, `src/domain/generation/types.js` and
`content/navigation-types.js` are authoritative; canonical records remain in
`src/contracts/campaign.js`.

## Public APIs

Use `src/domain/navigation.js` and `src/domain/generation.js`. Parameters below
use the named types from those files; booleans are geometric permission only.

| API | Result / consumer responsibility |
| --- | --- |
| `canEnter(actor, map, target, context)` | Position-only terrain permission; no occupancy or diagonal context |
| `canStep(actor, map, from, to, occupancy, context)` | One-step terrain, diagonal and destination-occupancy permission |
| `canMeleeAttack(actor, map, target, context)` | Adjacent melee geometry; affiliation/status/hit rules belong to combat |
| `canTargetPosition(actor, map, target, context)` | Position targeting helper; not a complete move-range or target policy |
| `canAiStep(actor, map, to, occupancy, context, preferences)` | Shared step permission plus supplied House/Trap/Lava Avoider preferences |
| `traceProjectile(map, origin, direction, {range,piercing}, context)` | Frozen ordered positions; no target selection, hits or item consumption |
| `findPath(actor, map, goal, occupancy, context, {allowOccupiedGoal,maxSteps})` | `found` / `unreachable` with frozen path; no movement or RNG |
| `checkSwap(map, first, second, context, confirmUnsafe)` | `allowed` proposal, `blocked` or `confirmation-required`; caller owns atomic exchange and timing |
| `isActuallyInSight`, `isExtendedTargetInSight`, `canSeeActor`, `visibleTiles` | Purpose-specific sight predicates/matrix; exact argument types remain on exported functions |
| `projectVisibility(input)` | Immutable `presentation/types.js` VisibilityView; caller separately commits explored memory |
| `openKeyDoor(map, position, context)` | `blocked` / `opened` with detached floor proposal; key consumption and turn cost remain external |
| `applyTerrainStep(map, actor, context, status)` | Detached floor and wall/Belly/thaw/Burn requests; effect owner applies them |
| `layoutFamily(raw)` | Low-nibble family: 0-11, with 12-15 routing to family 0 |
| `generateFloor(input, dependencies)` | `ready` with frozen blueprint and updated streams, or `blocked` with requirement IDs; invalid requests/dependency failures can throw |
| `materializeFloor(blueprint, input, navigation)` | Frozen canonical floor, next ID sequence, remaining placements, party positions and shop plans |

`DIRECTIONS` is ordered S, SE, E, NE, N, NW, W, SW. `NavigationActor.identity`
is the actual species/form, not Transform appearance. The caller supplies current
usable mobility items, enabled IQ, statuses, occupants, tileset and visibility.
Status action gates and native AI movement eligibility remain consumer rules.

## Catalog and concrete dependencies

`loadNavigationCatalog(dependencies, {signal}?)` in `content/navigation.js`
requires `isSpeciesForm` and `isItemId`, plus optional `fetchResource`. It loads
only local manifest/facts resources, bounds streamed bytes below 1 MiB before
parsing, checks pinned SHA-256/closed records/source and membership, and returns
immutable lookups. Abort during loading rejects; `dispose()` invalidates lookups.

| Required owner | Supplied facts / behavior |
| --- | --- |
| Reviewed navigation/dungeon catalogs | Mobility/terrain/fixed definitions, exact floor/scene generation profile, pools and section identities |
| Encounter policy | `isEncounterEligible(row, 'initial' \| 'arrival')`; current initial generator calls the `initial` route |
| Campaign/mission owner | `GenerationContext`: floor classification, House suppression, party/limit, required placement roles, first/retry/post fixed encounter plan and real received/special populations |
| Item/shop/actor owners | Construct canonical quantities/payloads, actors, keepers, lots, jobs and deferred rewards from placement requests |
| Expedition owner | Concrete FloorLocation, map definition, weather/wind, exit destination/lock and trap-kind membership for materialization |
| CampaignContent | Register returned terrain/map identities and validate canonical floor/actor/entry semantics before commit |

Missing fixed/received/special population plans or exhausted placement/connectivity
bounds return explicit requirements. A supplied `FixedEncounterPlan.callbackId`
is metadata; P11 does not execute a campaign callback or resolve boss progression.
Materialization allocates map/room/shop/trap/exit IDs only, not actors or items.

## Ownership, RNG and bounds

| Boundary | Fixed contract |
| --- | --- |
| Maps | 56 by 32 logical tiles; generated proposals have no separate saved authority |
| Generation attempts | Ten outer attempts, up to ten inner geometry attempts each, then one final recovery; grid draw bounded at 32 attempts |
| Random streams | Layout/features use supplied `layout`; counts/selection/placement use `encountersItems`; return both cursors only with `ready` |
| Draw semantics | Browser xoshiro words scaled through u16; half-open ranges, equal endpoints draw nothing, bound zero still draws; source random swaps remain distinct from uniform shuffle |
| Draw/selection budgets | At most 2,000,000 draws per local cursor and 1,024 candidate selections per ordinary enemy request |
| Placement capacity | Party 1-4, enemy limit 0-124, at most 64 required placements |
| Navigation budgets | Path/sight maps at most 4,096 cells; path maxSteps 0-4,096; projectile range 0-128; sight range 0-64 |
| Commit | One Adventure transaction installs floor, actors/items/shops, next IDs, streams and knowledge together; rejected proposals never advance live RNG/IDs |

Ordinary entry, stairs and required roles are selected in the reachable component;
protected reward chambers preserve their key/liquid/wall access requirements.
Fixed 0 is procedural sentinel, 1-49 floorwide, 50-66 embedded, 67+ unused;
48 is noncanonical, and Ninetales 6 is a separate scene identity. The current
independently authored fixed geometry still needs complete source/route review.

## Evidence and acceptance limits

Behavior uses retained `tools/pokemon-dungeon/content/research/`
`pokemon-navigation-generation-corpus.json`, SHA-256
`b074413fce5840f7159c2a34cb89ebe9814caf64128312cf824aadfa07989882`, qualified
against original Red commit `6bcbec4f906938c0243aa2026bcbd41b577bab85`.
Browser RNG, bounded actual-neighbor dead-end repair, independently authored fixed
geometry and ordinary required-target connectivity are explicit adaptations.
No original commercial tile grids or native seed-identical maps are claimed.

The recovery source audit corrected secondary-room Monster House admission and
final recovery's nonempty House flag. Static source/types and factual export
checks establish parsing, identity/provenance and resource consistency, not
generator-seed execution or route playability. Complete adversarial source review,
P12/actor/item integration, fixed/reward/mission route inspection, visibility and
device acceptance remain open. No automated game-source execution is permitted.
