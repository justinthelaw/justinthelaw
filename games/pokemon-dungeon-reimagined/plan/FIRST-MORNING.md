# First morning and first request boundary

## Scope and source qualification

This bounded Task 5 continuation covers the first morning, bed save tutorial,
refreshed interior, partner outside, starter set, Pelipper delivery, Magnemite
letter and accepted-request base boundary. Its original checkpoint stopped
before departure; [THUNDERWAVE.md](THUNDERWAVE.md) records the subsequent route
implementation. No full main-story or human acceptance gate is complete.

Nintendo's original **Blue Rescue Team** manual, printed pages 16-19, supports
saving at the bed and the starter set's badge, toolbox and Pokemon News:
[original Blue manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf).
The parent reviewed that primary evidence. Detailed event order below is from
comparative original Red decomp commit
`6bcbec4f906938c0243aa2026bcbd41b577bab85`; it is not an independently established
Blue binary/script match. Existing factual catalogs and their qualifications
are unchanged. No commercial prose, map geometry or assets were copied.

| Comparative source | Finding consumed |
| --- | --- |
| `src/data/ground/ground_event_data.h`, EVENT_DIVIDE_FIRST and EVENT_M01E02A_L001/L001B/L001C/L002/L003 | MAIN (3,0) dispatches first morning at (3,1); awakening leaves (3,2); bed save uses (3,3); refreshed interior leaves (3,4); outside set/delivery leaves (3,5); actual departure reaches (3,6) |
| `src/data/ground/ground_data_b01p02a_station.h`, groups 15-17 | Initial hero awakens alone, remains groggy, must use the bed before leaving, then awakens refreshed and remembers the partner |
| `src/data/ground/ground_data_b01p01a_station.h`, group 18 | Partner waits outside; starter set contains badge/toolbox/news; previously awarded berries are retained; Pelipper then delivers a letter |
| `src/ground_script.c`, sub_80A14E8 case 7; `src/code_80958E8.c`, sub_8096488 | Starter-set helper resets the mailbox and installs news issue zero; it does not generate a consumable reward kit |
| `src/data/ground/ground_data_b01p01a_station.h`, group 20, station and lives0 | Letter comes from Magnemite's friend, who heard about the team from Caterpie; an electromagnetic wave joined two Magnemite, insufficient for a complete Magneton; declining returns to the partner's appeal; acceptance leads into departure |
| `src/code_80A26CC.c`, SCRIPT_DUNGEON_THUNDERWAVE_CAVE | Actual route owns base departure, interior return, M01E02A_L003/L005 and GETOUT_M01E02A; these consumers are next work |

## Authored canonical boundaries

All stages are ordinary Adventure transactions, except persistence preparation,
which is asynchronous application work and cannot itself advance a scene.
The renderer projects original open-roof 3D interior geometry, a bed/window and
the existing original courtyard. Pelipper appears only during delivery, without
creating a roster individual. The optional presentation elevation places the
sleep pose on the mattress; its default zero preserves all existing floor actors.
The projected bed pose changes no canonical town position or progression. Only the hero is placed indoors; the saved partner
role retains its original identity while the partner waits outside.

| Active stage | MAIN | Once-only completion facts |
| --- | --- | --- |
| Groggy awakening | (3,1) | First morning |
| Bed save gate | (3,2) | Save tutorial, only after current checkpoint success |
| Refreshed interior | (3,3) | Refreshed scene |
| Partner outside | (3,4) | Partner scene |
| Starter set | (3,4) | Badge/toolbox starter set and separate news receipt |
| Pelipper delivery | (3,4) | Delivered request letter |
| Read letter / refusal loop | (3,5) | Separate read-mail receipt before the choice |
| Accepted request at base | (3,5) | Accepted-request receipt; departure remains unavailable |

The accepted-request stop is an explicit browser development boundary before
native departure; it must not set (3,6), mark Thunderwave cleared, enable a
nonfunctional departure button, award a rescue, recruit, or unlock ordinary
jobs. The browser advances its authored day from zero to one on the deliberate
Begin first morning action; this is not a claim of a native calendar counter.
Other native reset/scalar fields remain the reviewed browser staging contract.
No new consumables are minted and existing reward/held item IDs are unchanged.
News is a separate receipt and read-only original browser-written first-issue
information, available after the set is received. Native news pages and future
mailbox services remain outside this slice.

## Saving and replacement safety

The bed panel performs a current-revision save through the existing persistence
service/repository. It checks the result and `isCurrentRevisionSaved()` before
acknowledgment. Quota, denied storage, conflict, crypto, stale, disposal and
replacement failures retain the gate. Input is busy through the operation;
completion also checks the exact frozen snapshot, binding epoch and owning
panel. A stale callback cannot advance a replaced campaign. Generic menu saves
never dispatch a story command.

Explicit memory-only mode presents Export & rest, prepares a validated file
checkpoint and records an exact session export receipt before allowing the
ordinary scene acknowledgment. It says browser saving has not occurred and
asks the player to retain the downloaded file and export later progress again.
The browser cannot verify that the download was retained; no disk-save claim
is made. The receipt is ephemeral and bound to the exact snapshot/epoch. An
imported memory checkpoint at the bed must pass this gate again. Later scene
receipts are normal canonical state and can be exported/imported without
replaying earlier grants.

## Predecessor save admission

The codec routes only the exact navigation-backed held-v2 or v3-team content
revision. Before conversion it validates the original predecessor body, original
envelope/state agreement, timestamp and SHA-256. It then applies one revision
and validates/encodes the current content. Preview reads do not overwrite slots;
replacement remains the repository's explicit confirmation flow. Unknown
revisions and invalid predecessor combinations are rejected.

V3-team uses the original six-scene authoring function and exact prior policy
bodies through a narrow shared composition branch. It changes only content
revision and transaction revision. Held-v2 retains its frozen modules and its
existing bounded pending/already-rewarded reunion conversion. Neither path
awards kit/news/mail or changes original individual IDs, RNG, stats, items,
turn continuation or naming candidates.

`tools/pokemon-dungeon/content/save-boundaries.json` independently pins 22
unchanged shared dependencies and six exact predecessor function bodies to
`98a37cf`. `npm run save-boundaries:check` parses source without importing it;
future edits to these shared admission sources require explicit qualification
and a reviewed compatibility decision. The v3 factory revision comparison
also independently pins the factual catalog hashes for both predecessors. The
shared catalog composition now authenticates species/onboarding manifest bytes
before loading them; independent pins include those manifests and their listed
resources. Catalog data and the original loader bodies remain unchanged.
The new morning policy wraps the prior formation prerequisite, independently
checking every projected field against exact new history, receipts, map/day,
placements and native stage. No copied full policy module or permissive fallback
was added.

## Verification and open acceptance

Independent lint, strict types, source pins, content/campaign/navigation and
environment audits validate this contribution. The full static chain,
website export, CI and publication belong to the parent execution session.
D05 prohibits importing/executing game source, game tests, browser boot and
playthrough automation; none were used here.

The historical 34 environment captures remain unchanged. Their archived
manifest is byte-identical; the current manifest adds only the declared mailbox,
five-part bed and four-part window relative to that archive. New interior,
Pelipper staging, UI/device saving and the campaign need human review. Static
checks provide no gameplay, visual or cartridge-fidelity acceptance. Continue
with sourced Thunderwave Cave consumers, not a claimed completed campaign.
