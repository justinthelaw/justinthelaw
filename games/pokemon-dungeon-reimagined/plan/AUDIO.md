# Original score and presentation audio

## Scope and current status

P18 audio package v1 authors local synthesized music/effects and an isolated
WebAudio transport. The live composition now connects trusted iframe controls,
canonical preference transactions, title/quiz drafts and qualified current
presentation requests. This does not complete P18, human audio acceptance, the
campaign or release. The existing saved `options.audio` structure remains exact;
no new save field/history/offset is added. Original audio is a presentation
adaptation, not a reconstruction of the commercial soundtrack.

## Original authorship and provenance

- Author: Codex for this project, 2026-10-08.
- Source: editable note/envelope records in
  `tools/pokemon-dungeon/audio/original-score.json`.
- Output: `src/audio/catalog-data.js`; no sampled recordings, commercial melodies,
  commercial sound banks, extracted song sequences, CDN or audio downloads.
- The 85 themes have separately authored melodic contours, register, mode, tempo
  and instrument choices; shared accompaniment/envelope rules keep a coherent
  score. The 28 short effects are new oscillator gestures.
- Source names/IDs identify factual presentation roles only. No source song or
  voice/sample bytes were inspected or used to compose this score.
- Human composition, originality comparison, loop/mix/device audition and
  accessibility acceptance remain pending. Authored coverage is not acceptance.

## Runtime API and lifetime

Import `createAudioBus` from `src/audio/index.js`. Pass the owning iframe
`document`; construction installs visibility/blur/pagehide listeners but creates
no AudioContext and produces no sound.

| Method | Responsibility |
| --- | --- |
| `beginEpoch(uniqueBindingEpoch)` | Explicit binding-owner reset; clears all old voices, cues, revisions and event IDs. A retained `present` frame cannot rebind the bus. Use a fresh unique string whenever the save/adventure binding changes. |
| `setPreferences(record)` | Detached finite 0–1 volumes, quiet fallback for invalid fields, muted true fallback. Does not persist, resume or dispatch. |
| `present({epoch,revision,musicCue,effects})` | Current committed presentation only; nonnegative monotone revision, stable ascending effect IDs. Unknown cues/invalid/old frames return false. No caller objects are retained. |
| `activate(actualEvent)` | Synchronous call inside the iframe sound button handler. Requires a trusted active in-document click/key/pointerup/touchend; synthetic bridge keys and retained events are refused. Returns a caught boolean promise. Repeated ready activation does not restart music. |
| `pause()` | Stops/disconnects voices and cancels the pump before async suspend; retains the music position but no old effect queue. Requires a new trusted activation to resume. |
| `status()` | Detached capability/locked/ready/paused/denied/disposed state and active voice count. Display failures without breaking gameplay. |
| `dispose()` | Idempotent immediate listeners/timer/nodes/graph cleanup, then caught async context close. Late promises cannot restart sound. |

Silence is the default. Independently routed music/effects gains feed master
through a compressor. Hidden/lost-focus/pagehide stops audio immediately. Returning
to focus does not spontaneously resume. Music resumes at its retained position
without replaying elapsed notes; a fresh music cue starts at beat zero. Effects
presented while locked/muted/hidden are consumed without being replayed later.
Every validated frame commits its complete effect-ID high-water mark before
WebAudio scheduling; a caught playback failure cannot defer later IDs for replay.
Completed nonloop music does not restart on resume.

A generation guard invalidates pending resume and timer work after pause, epoch
change or disposal. A pending resume invalidated by an epoch switch stays silent
and requires a new gesture. Audio rejection is caught and exposed through status.
Unsupported WebAudio stays silent. There is no game-state import, mutation, RNG
stream, persistence call, audio-to-game callback or clock-driven game dispatch.

## Budgets and deterministic overload

| Resource | Bound |
| --- | --- |
| AudioContext | One live owner |
| Scheduling pump | One 80ms timer, 250ms lookahead |
| Voices | 32 total; 16 music + 16 effects reservations |
| Nodes | Two per voice + four persistent bus/compressor nodes; 68 maximum, excluding browser destination |
| Voice duration | Static bank maximum below 4 seconds, including release |
| Music scheduling | At most 64 note admissions per pump; delayed pumps skip elapsed notes |
| Presentation | At most 64 ordered effect IDs per frame, four new effect cues scheduled; remaining IDs consumed silently |
| Effect queue | None; later frames never replay discarded overload |
| Runtime bank | 436,872 bytes, 6,034 notes; no binary samples |

Overload drops new presentation voices after the reserved cap. Essential gameplay
outcomes remain in text; sound never supplies missing information. The caller
validates and consumes every ID in the complete domain burst before audio work,
then selects at most four source-proven gestures by priority/source order and
assigns local audio IDs. It does not truncate the domain/text event list, replay
unselected sounds, or mix domain and UI IDs in one canonical number space.

## Live composition and exact admission

`src/shell/application.js:createApplication` owns the adapter in
`src/application/audio.js`, beside view/input/renderer/saves. Save binding identity
and `adventureEpoch` explicitly retire prior sound before `refresh` can return on
a null snapshot. Title/quiz have unique application draft epochs, not saved game
history. `refresh(events,before)` admits the complete committed event stream
synchronously with its projection; idle/readiness calls have no reconstructed
effects. Late asset promises never present/unlock audio. Error, graphics loss,
save replacement, hidden/lost focus and disposal pause/clear sound; focus and
save completion do not unlock automatically.

Visible **Enable sound**, **Pause sound** and **Sound settings** controls live
inside the active panel/HUD owner. Independent labeled master/music/effects
ranges and mute preserve quiz DOM and unsubmitted scene-name text across
preference repaints. Native Enter/Space on Enable prevent duplicate default
click/game-confirm dispatch. The direct owning click/key listener receives the
actual trusted Event. If muted, it synchronously commits the existing record,
presents its current binding/preferences, then calls `activate(event)` before
await/RAF/storage callbacks. Synthetic `.click()` and bridge keys show a direct
tap hint and cannot unmute or unlock. Master zero has an explicit raise-volume
reason. Promise status updates require the current lifetime/control/binding.

Before binding, a once-initialized complete options draft uses real
`initialOptions()` defaults. Changes are explicitly "Saved with your new
adventure"; `startOnboarding` carries a detached current draft into actual
`createCampaign` validation and the existing durable/memory replacement preview.
Canceled/replaced quizzes lose authority. Loaded campaigns use their own
validated `snapshot.options.audio`.
The draft seals as soon as a concrete new-adventure preview is prepared, so later
controls cannot claim to modify that immutable candidate. Starting a new quiz or
returning to title explicitly opens a new draft owner; resuming an already bound
campaign retires a canceled draft and presents that campaign's own preferences.

`setAudioPreferences` is a real current domain handler. Exact four own fields,
finite 0–1 volumes and boolean mute are required; invalid saved input is rejected.
The only write replaces detached `context.state.options.audio`. Equality is an
unchanged command; a real change uses only the ordinary transaction ID/revision,
emits zero events and never resumes a turn, alters RNG, native PC, scene cursor,
resources or receipts. Existing autosave owns persistence; memory/denied storage
keeps canonical/export preferences without a false durable success claim.

Ordinary opening/story scenes admit settings without leader/graphics readiness.
Durable changes are blocked during `continuing`, `learning-continuing`, a
`move-learn-choice`, and the exact pre-read window
`browser-morning-request` cursor0. That sole temporary mail guard preserves the
frozen first-morning proof requiring the actual read receipt at
`entryRevision+1`; an extra transaction before its first ACK would strand it.
Cursor1/refusal cursor2 remain legal after the real receipt commits. The UI says
"Finish opening mail before changing saved sound settings." Already-unmuted
trusted unlock and presentation pause remain available in those windows. No
scene entry/receipt, historical authentication or saved offset is rewritten.

The inline Sound settings drawer replaces only its owned controls before a
binding; after a real domain change the shell repaints the scene with current
revision tokens. Retained town/friends/work/reward and game menus register an
explicit view-owned rebuild of their current submenu against the admitted
snapshot. Nested menus share one read-only snapshot model; old buttons retain
their old token, while dispatch still checks the exact newly shown snapshot and
binding. Nickname/quantity drafts, sound focus and text selection survive the
rebuild. Result ACKs are reconstructed by their real result owner at the new
revision, never by retagging an old intent. Asset readiness renews action
enablement in that same retained model. Focus excludes hidden/inert/disabled controls. Scene-name drafts
key on binding/instance/cursor/canonical prefill, so a preferences-only revision
does not discard typed text. Sound controls never use `act()` or change gameplay
cadence, dismiss the current dialog, or advance a saved scene/result.

## Current music and effects coverage

Editable `tools/pokemon-dungeon/audio/current-requests.json` and its
`current-source-map.md` record **43 current scene IDs, 120 finite cursors, 54
complete requests, nine explicit map requests and 24 native source pins**.
`content/authored/audio-requests.js` is generated local data; every unknown row
replaces music with silence. Seventeen cursors deliberately request silence,
including Meanies departure/mail, boss-faint/return bridge and original collapsed
night/save staging. `browser-friends-rest` has two honest source-gap silent
cursors. Source table boundaries qualify browser staging; they do not reproduce
native clocks/fades, commercial dialogue or Blue exact parity.

Scene requests win over an attached session's soundtrack. Actual Skarmory fight
requires the story/battle/Steel9F owner for direct11; first/retry prebattle114,
poststory gap114, ordinary empty9F114 and defeated departure silence have separate
owners/guards. Exploration resolves actual floor → generation `bgMusic` → the
76-row dungeon index table. Qualified normal base1/Square/Post7 owners follow
three explicit completed-story quiet receipt combinations. Awakening meadow has
no guessed normal-map fallback. Ground chapter0–5 cannot trigger the source
quest12/calamity override; future chapter requests remain silent until the private
native start-mode bypass and actual quest ownership are proved. Dungeon commands
never receive ground-only modifiers.

Current game effects are committed real-leader displacement, visible attacker/
target miss, and the exact visible actor's `conditionChanged` immediately before
`reviver-seed-restored`. Actual view navigation/confirm/cancel owns local UI IDs.
All events are consumed even when silent/hidden/muted/unmapped/overloaded. Generic
hit includes status/self actions; generic item/condition invalidation proves no
pickup/heal/status/damage sound. Level-up/move-learned actor association, Pickup,
faint/objective/job/reward/source-result effects require exact transient producer
meaning/audience in their coordinated owners. No shared producer is edited here.

Friend Area normal joins, result fanfare owners, theft/shop/monster-house override
facts, later campaign/postgame source timing and Blue parity remain explicit
obligations. The complete authored bank below is available for those owners; its
presence is not a claim of reachable/full-game integration or human acceptance.
Root must reconcile the minimal registry/Intent/shell/current `learning-continuing`
seams with coherent v24; this port registers both static audio scripts in the
package/CI check chain. Independent whole-port review remains required.
This isolated patch preserves shared manifests/locks and frozen115/14/2.

## Comparative source joins and remaining obligations

Pinned comparative source: [pret/pmd-red at 6bcbec4](https://github.com/pret/pmd-red/tree/6bcbec4f906938c0243aa2026bcbd41b577bab85).
Exact source hashes are in the original score provenance. Primary source files:

- `include/constants/bg_music.h`: direct music-role IDs, including blank/unused
  IDs which remain unassigned.
- `src/dungeon_config.c:gDungeonMusic[76]` and `src/run_dungeon.c:305–323`:
  floor `bgMusic` is a table index before direct MusicID selection. Do not use it
  as a direct MusicID. All 76 index rows are preserved.
- `src/dungeon_music.c:18–43`: menu cursor 301, confirm 302, cancel 303, start/menu
  304; four explicit original SFX joins. Other native SFX remain unassigned.
- `src/dungeon_music.c:145–174`: boss/theft/monster-house/shop requests supersede
  ordinary music. The AudioBus accepts the chosen cue, not inferred game rules.

All numeric source joins are **Red comparative; exact Blue parity unverified**.
New postgame/browser themes have no guessed native IDs. Ground/story command
owners, source overrides, all remaining action SFX, and Blue verification must
be assigned during their coordinated gameplay/presentation packages. Blank50
and explicitly unused100/109 remain silent. A missing cue is never replaced by
a guessed generic soundtrack. This qualified inventory does not activate later
unimplemented gameplay.

## Complete authored theme inventory

| Cue suffix (`music-…`) | Original title | Comparative direct MusicID |
| --- | --- | --- |
| rescue-team-base | Daybreak Courtyard | 1 |
| friend-area-swamp | Reed Lanterns | 2 |
| friend-area-caves | Quartz Echoes | 3 |
| dream | A Window in Sleep | 4 |
| benevolent-spirit | Kind Light | 5 |
| legend-of-ninetales | Nine Ember Signs | 6 |
| pokemon-square | Market Paper Kites | 7 |
| file-select | Letters on the Shelf | 8 |
| rising-fear | Footprints behind Us | 9 |
| theres-trouble | The Alarm at Noon | 10 |
| boss-battle | Hold the Line | 11 |
| welcome-to-the-world-of-pokemon | The First Question | 12 |
| a-new-adventure | Beyond Old Maps | 13 |
| thunderwave-cave | Copper Sparks | 14 |
| sinister-woods | Branches Whisper | 15 |
| friend-area-pond | Ripples Round the Moon | 16 |
| kecleon-shop | Pockets and Petals | 17 |
| stop-thief | Runaway Receipt | 18 |
| world-calamity | A Shadow over Day | 19 |
| great-canyon | Wind-Carved Steps | 20 |
| stormy-sea | Waves under Thunder | 21 |
| sky-tower | Ladders in the Clouds | 22 |
| sky-tower-summit | Above the Weather | 23 |
| the-escape | Road without a Roof | 24 |
| mt-blaze | Red Stone Rhythm | 25 |
| rayquazas-domain | The Horizon Waits | 26 |
| friend-area-stratos-lookout | Watchtower Dawn | 27 |
| friend-area-rainbow-peak | Prism Trails | 28 |
| dream-eater | Deep in the Unsaid | 29 |
| friend-area-deepsea-current | Blue Beneath Blue | 30 |
| friend-area-seafloor-cave | Pearls in the Dark | 31 |
| battle-with-rayquaza | Answer the Sky | 32 |
| mt-blaze-peak | Cinder Crown | 33 |
| friend-area-volcanic-pit | Coal Lantern Garden | 34 |
| friend-area-cryptic-cave | Written in Stone | 35 |
| escape-through-the-snow | White Road, Warm Hands | 36 |
| the-other-side | Across the Quiet | 37 |
| the-mountain-of-fire | Heat beyond the Ridge | 38 |
| frosty-grotto | Ice-Chime Hollow | 39 |
| intro | Finding the Shore | 40 |
| aftermath | Stones Settling | 41 |
| farewell | The Space between Steps | 42 |
| title-screen | Our Names in the Wind | 43 |
| credits | Paths We Made | 44 |
| time-of-reunion | Two Footprints Again | 45 |
| opening-title | A Door into Morning | 46 |
| dungeon-fail | A Way Back | 51 |
| dungeon-complete | Work Well Done | 52 |
| heartwarming | Shared Hearth | 101 |
| lapis-cave | Blue Mineral Threads | 102 |
| a-successful-rescue | Hands Reached Home | 103 |
| frosty-forest | Evergreen under Snow | 104 |
| friend-area-steppe | Grass to the Edge | 105 |
| friend-area-oceanic | A Small Sail | 106 |
| friend-area-field | Clover Footpaths | 107 |
| magma-cavern | Pressure under Stone | 108 |
| makuhita-dojo | Practice Makes Courage | 110 |
| mt-thunder | Storm-Bell Ascent | 111 |
| friend-area-lab | Glass and Copper | 112 |
| silent-chasm | Listening to Depth | 113 |
| in-the-depths-of-the-pit | Beneath the Map | 114 |
| mt-freeze | Snowline March | 115 |
| friend-area-wilds | Open Amber Country | 116 |
| friend-area-legendary-island | Three Fires at Sea | 117 |
| friend-area-southern-island | Letters across Water | 118 |
| friend-area-enclosed-island | Island in a Ring | 119 |
| mt-steel | Iron Staircase | 120 |
| friend-area-forest | Sun through Leaves | 121 |
| friend-area-final-island | A Last Quiet Harbor | 122 |
| mt-freeze-peak | Still above the Snow | 123 |
| magma-cavern-pit | Stone Heart Awakens | 124 |
| tiny-woods | Dew on the Path | 125 |
| mt-thunder-peak | Clouds at Our Feet | 126 |
| friend-area-healing-forest | Green Shelter | 127 |
| monster-house | Doors All at Once | 128 |
| postgame-eon | Two Wings, One Letter | Unassigned; original presentation role |
| postgame-relic | Four Stones, One Secret | Unassigned; original presentation role |
| postgame-mirage | Island at the Edge of Sight | Unassigned; original presentation role |
| postgame-western-cave | Farther than Footsteps | Unassigned; original presentation role |
| postgame-lugia | The Sea Takes a Breath | Unassigned; original presentation role |
| postgame-deoxys | Signal beyond Starlight | Unassigned; original presentation role |
| postgame-wish | Small Stone, Large Sky | Unassigned; original presentation role |
| postgame-redemption | Carry the Morning | Unassigned; original presentation role |
| postgame-ultimate | Ninety-Nine Steps | Unassigned; original presentation role |
| browser-rescue | Across an Unseen Bridge | Unassigned; original presentation role |

## Complete authored effect inventory

| Cue suffix (`effect-…`) | Original gesture | Comparative direct SFXID |
| --- | --- | --- |
| ui-cursor | A small dry tick | 301 |
| ui-confirm | A rising choice | 302 |
| ui-cancel | A soft descending pair | 303 |
| ui-open | A page unfolded | 304 |
| ui-denied | A low double knock | Unassigned; explicit integration required |
| ui-save | A sealed envelope | Unassigned; explicit integration required |
| step | A quiet footfall | Unassigned; explicit integration required |
| attack | A brief swing | Unassigned; explicit integration required |
| hit | A blunt contact | Unassigned; explicit integration required |
| miss | A passing swish | Unassigned; explicit integration required |
| heal | A small green lift | Unassigned; explicit integration required |
| status | A wavering sign | Unassigned; explicit integration required |
| pickup | A light pocket chime | Unassigned; explicit integration required |
| money | A pair of bright coins | Unassigned; explicit integration required |
| stairs | Three upward stones | Unassigned; explicit integration required |
| floor-enter | An open doorway | Unassigned; explicit integration required |
| job-accepted | A folded request | Unassigned; explicit integration required |
| rescue-found | Hands meet | Unassigned; explicit integration required |
| reward | A ribbon tied | Unassigned; explicit integration required |
| level-up | A brighter step | Unassigned; explicit integration required |
| move-learned | A new idea | Unassigned; explicit integration required |
| revive | Returning breath | Unassigned; explicit integration required |
| faint | A falling leaf | Unassigned; explicit integration required |
| hunger | A low reminder | Unassigned; explicit integration required |
| mail | A letter lands | Unassigned; explicit integration required |
| friend-joined | Room for another | Unassigned; explicit integration required |
| story-spark | A turn in the story | Unassigned; explicit integration required |
| throw | A small arc | Unassigned; explicit integration required |

## Static validation and human gates

Run from `tools/pokemon-dungeon/`:

```sh
node scripts/check-audio.mjs
node scripts/check-audio.mjs --write
node scripts/check-audio.mjs --source-root /absolute/path/to/pinned/native-red-source
node scripts/check-audio-integration.mjs
node scripts/check-audio-integration.mjs --write
node scripts/check-audio-integration.mjs --source-root /absolute/path/to/pinned/native-red-source
npm run lint
npm run typecheck
```

The authoring audit parses runtime literal data, verifies exact output bytes,
bounds note/envelope/voice/timing inventories, and optionally verifies source
hashes and numeric joins. It never imports or evaluates game modules, creates
an AudioContext, compiles native code, or auditions sound. `--write` materializes
the local immutable bank from its editable source. Human audition and device
acceptance must record actual build, browser/device, cue and findings separately.
The integration authoring audit checks complete nonoverlapping finite requests,
exact generated bytes, native provenance and the actual preference/composition/
gesture/draft/event/disposal source seams with AST/text inspection. These static
checks do not execute the game or establish runtime/device mixing acceptance.

Platform references: [W3C Web Audio 1.0 Recommendation](https://www.w3.org/TR/webaudio-1.0/)
and [W3C Web Audio 1.1 draft](https://www.w3.org/TR/webaudio-1.1/) for lifecycle,
AudioParam scheduling and node lifetime; [Chrome autoplay guidance](https://developer.chrome.com/blog/web-audio-autoplay)
for trusted user activation. The implementation uses established AudioContext,
GainNode, OscillatorNode and DynamicsCompressorNode APIs, not experimental
AudioSession or autoplay-detection capabilities.

## Current v24 integration port

The reviewed foundation28a10e7 and composition0247d08 are ported with exact
new audio leaves and focused shared presenter/view/shell joins. The selected
`escort-commands.js` registers preferences; frozen `commands.js`, original save
chains, the current factory/turn composition and4096 event cap remain intact.
The new Caterpie morning/request uses the actual two/ten-stage source-qualified
mapping documented in `audio/current-source-map.md`. Real work-two, Caterpie
exit, resident/guest and saved scene-learning ownership remain selected.

The static authoring check chain includes both audio audits. This complete port
requires independent review and exact repository checks before publication.
Human audition, device/interruption, composition comparison, Blue binary parity
and campaign/release acceptance remain pending.
