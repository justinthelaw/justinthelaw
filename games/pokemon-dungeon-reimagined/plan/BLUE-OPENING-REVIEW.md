# Opening implementation and review

## Checkpoint — 2026-10-10

The selected runtime is now the opening through Caterpie's rescue, on
`feat/pokemon-campaign-recovery` for PR #397. Historical campaign source and
saves remain recoverable; the distribution excludes later chapters, the old
Three.js runtime, plans and art studies.

| Area | Implemented |
| --- | --- |
| Presentation | Two 256 × 192 canvases, post-office/interior/town opening, animated title, quiz and name entry, external portraits, field staging, forest dungeon and menus |
| Characters | All 16 quiz outcomes; sourced partner pool/type exclusions; partner naming before awakening and hero naming afterward |
| Rules | Three Tiny Woods floors, level-5 starting profiles, moves/PP, original damage helpers, early statuses, partner/enemy behavior, held items, stairs, growth, loss/retry and reunion rewards |
| Browser | Keyboard/touch input, interruption ownership, bounded sprite cache, no WebGL, startup cancellation, accessible menu mirrors and help, isolated alternating save checkpoints |
| Export | Parsed module closure plus explicit asset manifest; approximately 2.84 MB instead of the retained 84 MB historical tree |

## Current candidate readiness — 2026-10-11

The candidate checkpoint recorded in
`tools/pokemon-dungeon/.work/blue-ready-20261011/candidate-4-snapshot.json`
passes the complete Node 24 authoring check: 103 lint inputs, 67 strict source
files, factual/geometry/provenance checks and a 149-file, 2,804,625-byte static
distribution. These checks do not import or execute game modules.

- Charm and Screech now use source-qualified physical Q8 multipliers with
  backward-compatible zero-or-four-field save admission. Psych Up copies the
  four multiplier slots, damage consumes the appropriate physical/special slot,
  and floor/retry reset restores neutral values. Screech's native travel effect
  52 is present in the initial battle bank; independent static rereview found no
  remaining ownership or trajectory regression. These are late-retry paths and
  have not been manually cast in this candidate checkpoint.
- Three input-locked, pause-aware ground gates restore source/video ordering:
  Butterfree arrives before the partner replies, both rescuers leave before B1F,
  and both settle beside Caterpie before the clearing reply. Historical
  `help-choice:0` and `enter:0/1` checkpoints are admitted and normalized without
  restoring the removed rescue choice. Reduced motion keeps the intervals with
  settled actors. Original Blue footage corroborates the visible ordering, not
  exact DS frame duration.
- Hero naming and its confirmation now retain the Tiny Woods ground/map; partner
  naming retains the personality-test aura. A separate fresh browser review
  corroborated the partner aura, hero naming and confirmation backdrops,
  Butterfree's completed approach before the partner question, and direct B1F
  entry without a rescue choice. The embedded screenshot action
  now creates its temporary download link in the same-origin parent document,
  with a cross-origin fallback to the game document.
- Root manual review admitted a legacy `enter:1` save and automatically reached
  B1F with the saved level-five pair at full HP. The same iframe review confirmed
  the screenshot download and continued through B2F combat: Scratch dealt 25,
  consumed one PP and awarded 16 EXP to each teammate. It then completed B3F,
  showed Caterpie's cry before the silent approach, settled both rescuers before
  Brook's reply, completed the Butterfree reunion and displayed the Oran, Pecha
  and Rawst Berry reward. The completion screen exposed only Adventure Log and
  Return to top menu; Continue from that menu restored the completed rescue.
  The bounded ledger is
  `tools/pokemon-dungeon/.work/blue-ready-20261011/old-entry-migration/manual.json`;
  its reward capture has SHA-256
  `b085c7f577de7d6a3e7564d1e01943b4dae7b4f26f03b7e0d4a6e0deabb58f13`.

For ordinary first-attempt Tiny Woods, every reachable learned move has a
handler. Repeated losses retain EXP and can reach 18 rejected move IDs across 23
learnset rows; those paths remain visibly unavailable and are outside normal
first-attempt acceptance. Exact parity also remains blocked by authored dialogue
and effects, unresolved Blue-specific title/menu layers and timing, unverified
Blue binary AI/RNG/call order, and late-retry move paths outside the completed
first-attempt rescue acceptance.
Background music is an intentional scope waiver, not a remaining blocker. The
current evidence supports a scoped browser adaptation, not literal perfect
replication.

## Review evidence

- The second checkpoint replaces the authored character/scenery/font substitutes
  with pinned native images, every source sprite direction/pose, 213 portraits,
  original opening scenery and aura layers, native window tiles and battle HUD.
  Exact Blue pixel checks cover the recorded samples; comparative Red data is
  qualified separately. All resources remain local, with no runtime CDN calls.
- The first signed checkpoint `087c252` passed hosted Game Static Checks and
  Playwright Tests. Lint found smart quotes in three runtime files; those have
  been corrected without changing the pinned checks or security settings.
- The native checkpoint passed the complete local authoring `npm run check`
  under Node 24.21.0, including retained historical audits and the new native
  pixel/provenance checks. All 184 selected changed files passed the applicable
  pre-commit checks using the required pre-commit 4.6.2. The distribution contains
  112 resources totaling 2,615,396 bytes; each contribution remains below 1 MiB.
- Signed checkpoint `b7bfc5e78b6961500051757f1c0404cf153d2034` was pushed
  to the PR branch and verified against the remote head. Its hosted
  [Lint](https://github.com/justinthelaw/justinthelaw/actions/runs/38092986752),
  [Game Static Checks](https://github.com/justinthelaw/justinthelaw/actions/runs/38092986754),
  [Playwright Tests](https://github.com/justinthelaw/justinthelaw/actions/runs/38092986701)
  and [CodeQL](https://github.com/justinthelaw/justinthelaw/actions/runs/38092984939)
  all completed successfully. No merge or deployment was performed.
- Signed checkpoint `049af6e219f10c54bb50fe648c34c6ff77eb6e64` was pushed
  and verified against the remote head. Its hosted
  [Lint](https://github.com/justinthelaw/justinthelaw/actions/runs/38096310407),
  [Game Static Checks](https://github.com/justinthelaw/justinthelaw/actions/runs/38096310455),
  [Playwright Tests](https://github.com/justinthelaw/justinthelaw/actions/runs/38096310392)
  and [CodeQL](https://github.com/justinthelaw/justinthelaw/actions/runs/38096307813)
  all completed successfully. The pipeline watcher reached terminal success;
  no requested or active Codex review was present.
- Signed checkpoint `7eab2dd885edcd56b103f3456b0a71ffdc67e6c3` likewise
  matched local HEAD, upstream and the actual PR branch after publication.
  [Lint](https://github.com/justinthelaw/justinthelaw/actions/runs/38098996494),
  [Game Static Checks](https://github.com/justinthelaw/justinthelaw/actions/runs/38098996523),
  [Playwright Tests](https://github.com/justinthelaw/justinthelaw/actions/runs/38098996595)
  and [CodeQL](https://github.com/justinthelaw/justinthelaw/actions/runs/38098994660)
  all passed. The watcher completed with exit zero and no requested review;
  exact-head run/check results are retained in `.work/ci-7eab2dd/result.json`.
- Independent prepared-turn review fixed missing partner swap upkeep/end effects,
  pointer releases suppressed during locked phases and dropped held movement
  across slow scheduling gaps. Sleep wake-up, Bide completion, prepared saves,
  stairs, deaths, wind/arrival accounting and paused clocks were statically traced.

- Specialist work covered visual references/rendering, audio, original mechanics,
  Pokémon data, browser input/performance, application/save flow, release
  integrity, mobile/accessibility, Tiny Woods completion boundaries and original
  asset permissions. All available concurrent worker slots were used.
- Independent review fixed readonly-input delivery, quick tap/diagonal loss,
  stale choice callbacks, save/resume line reset, live progress after denied
  storage, confirmation cancellation, depleted-move behavior, status accuracy,
  residual timing, ranged targeting, source spawn/wind order, warning thresholds
  and regeneration reset.
- Inert website export fixtures passed selected-resource copying, repeat export,
  content integrity, stale-resource rejection, path traversal rejection and
  source-symlink rejection. These checks do not execute game source.
- All nine retained native-source authentication audits passed against
  `6bcbec4f906938c0243aa2026bcbd41b577bab85`; historical P06 provenance was repaired
  by retaining the exact original lock snapshot, four v002 models and 24 captures.
- Current game source passed strict types and static lint at intermediate
  checkpoints. The full static suite reached the new art check after all legacy
  checks passed. Node 26 versus pinned Node 24 PNG encoding differed; regenerating
  under Node 24.21.0 preserved every decoded RGBA pixel across all 28 PNGs. Final
  checks remain separate from manual visual and gameplay acceptance.
- Root website dependency installation failed with Socket Security Policy E403
  for recently published pinned packages. No versions, security policy or checks
  were weakened. Full local website lint/build/Playwright remain unverified.

## Manual browser observations so far

The in-app browser loaded the real game without WebGL. Title/menu, trusted sound
activation, dialogue advancement and the eight-category personality test worked.
The alien-invasion answer entered the conditional follow-up without consuming an
extra main question. Reloading recovered that exact question. This run produced
relaxed/male Psyduck, excluded Water partners, selected Charmander and accepted
the nickname Ember through native text entry and Enter confirmation.

A frozen 66-file runtime snapshot, with per-file hashes, was used to avoid mixing
in-flight source edits during review. Its copied PNGs remain pixel-identical to
the pinned-toolchain outputs. A live partner-menu overlap was found and repaired
after that snapshot. That initial snapshot did not establish dungeon/reunion
acceptance. Physical devices and final-head website integration remain open.

The 22:43 UTC native review snapshot contains 112 resources with individual
hashes. It played the native opening/title, restored the existing Psyduck/Charmander
B3F save, opened Moves through the native touch toolbar, cancelled back to play,
and left the held berry unchanged when Throw was pressed without a Toolbox.
Manual movement reached the final stairs, then Caterpie's clearing, Butterfree's
reunion, the three-berry reward and the scoped completion screen. The browser
reported no console warnings or errors during this run. The arcade preview is an unchanged 256×192
capture from this run. The later held-direction fix across slow beats is a
documented source delta from that frozen snapshot and passed static review;
this run does not establish its manual status-effect behavior.

The same frozen native build was manually inspected at 390×844 and 844×390
browser viewports. Both screens and the expanded directional/A/B/Menu/Map touch
controls fit in portrait and landscape. The viewport override was then reset.
These observations do not establish physical iOS or Android acceptance.

## Native interface checkpoint

This pass adds the source-derived 81-key naming editor, original menu
illustrations and Team hearts, the English retail upper-team layout, original
status symbols with per-pose head attachments, and four short comparative Red
menu sound effects. The naming editor retains a native browser text alternative
and handles IME ownership, insertion/overwrite, caret movement and confirmation
cancellation. Combat-log messages now expire on a pause-aware presentation clock.
Ability activation announcements retain native evaluation order and optional
persisted deduplication bits without changing numerical effects or RNG draws.
The source-derived Team camera waits four nominal frames, follows the selected
member through submenus and restores the leader on exit. Tiny Woods world
lighting is separated from minimap discovery; AI and targeting remain unchanged.
Independent reviewers checked those ownership and numerical boundaries.

The complete authoring `npm run check` passed under Node 24.21.0, including
597-file static lint, 463-file strict types, all retained audits and the new
asset checks. All 112 changed files passed applicable pre-commit checks with
pre-commit 4.6.2. The distribution has 128 resources totaling 2,808,504 bytes.
An independent release audit verified all 81 imports across 48 runtime modules,
106 source/runtime hashes and local-only fetch paths. No game module was
executed by these checks.

The native species cache's 8 MiB cap applies after a scene finishes loading.
Preserving the previous scene during loading can temporarily retain up to
11,657,216 decoded species bytes in the current catalog. Other image sheets
and browser decoder overhead are additional; no measured total-memory claim
is made.

Direct inspection of the original Blue opening at 0:24, 0:25 and 0:27 in
[this footage](https://www.youtube.com/watch?v=4iTyZkVX9DI) confirms daylight
through the aerial shot's white fade. The comparative Red sunset palette cycle
is therefore excluded. Nintendo's English manual and the retail Moby capture
support the selected upper-team text positions; the earlier press capture is
retained as a separately observed layout. These video observations are not
pixel or frame-timing proof. Four original Blue boot cards now precede the
cinematic; their source-derived 8.9-second prefix remains timing-qualified.

The 23:26 UTC frozen build completed a fresh eight-question quiz and produced
calm/female Bulbasaur with the expected seven non-Grass partners. Pikachu was
selected and named Spark. Manual checks covered empty-name rejection, the
60-pixel name-width limit, caret movement, overwrite, insertion, deletion,
B backspace and cancellation from name confirmation. The thin comparative
Red naming border and wide-letter hitbox discrepancy found during this pass
were corrected before the next snapshot.

The 23:41 UTC frozen build contains the 128-file distribution and per-file
hashes at 2,808,127 bytes. A later 377-byte NOTICE attribution addition changes
no game behavior. Startup reached the company card, cinematic and title. Continue restored
Spark, insertion mode, the selected key and the saved caret: insertion still
occurred before the final character. Repeated Enter activation retained naming
key focus, and a click on W's rightmost stroke selected W. Start selected END
without accepting the name; A then entered confirmation. The corrected naming
screen is preserved as `native-naming.png` in that review directory, SHA-256
`fcaa876344851bfc777e3931b5df44cc33f6171dc5c01f2ca0039f96b88da0e3`.
The hero-name editor normalized decomposed `Cafe\u0301` to Café; the run then
continued with Bulbasaur named Ivy and Pikachu named Spark. Declining Butterfree's
request returned to the rescue decision. Accepting it entered Tiny Woods.

This frozen run reached B3F through ordinary manual movement and combat. Team
selection shifted the camera to Spark, retained it through the member submenu,
and restored Ivy on exit. Setting Tackle did not consume PP; the L+A shortcut
later used that move. The run collected 22 Poké and an Oran Berry, displayed
their first-use tutorials, and showed the native stat-down arrow on Sunkern
after Growl. Facing left without moving retained actor positions and HP. Spark
grew to level six after the final observed Sunkern defeat. The B3F status capture
is `native-status.png`, SHA-256
`e4cab4ba1db9b5a00bbc203b02ca3cc393ef6320503e0e2d2d09aefa5872767f`.
Browser logs contained no warnings or errors at the end of this segment.
The old SELECT control exposed duplicate upper/lower maps; the subsequent map
implementation corrects that observed mismatch. This run continued to completion
on the later map snapshot described below.

One raw browser-debugger reload call stalled for roughly 16 minutes. Ordinary
browser controls resumed, and the page reported no JavaScript errors. This is
not a measured game-engine freeze or performance result.

## Map and title follow-up

The seven original DS display combinations A-G now separate upper Team/Log/Map
selection from the lower map's off/clear/shaded setting. Fresh preferences use
B; explicit earlier Team/Log/Map preferences migrate to A/D/G. SELECT preserves
the upper display and temporarily presents the lower map after ten nominal
frames. A toggles all monster dots, while B or SELECT closes it after two display
frames. G leaves SELECT inactive. Native 4×4 map patterns distinguish clear,
shaded and upper-screen maps; 60 opaque marker pixels match the Blue reference.
The independent static review checked interruption timing, accessibility text,
leader blink resets, migration and absence of turn/RNG/discovery mutations.

The title's ocean now scrolls using a reconstructed Blue-only 312×28 strip.
All 8,736 texels have agreeing native-color observations, with zero conflicts
or unobserved colors. Initial phase, scroll cadence and the missing capture
column's placement retain explicit qualifications. Upper clouds remain fixed:
the available flattened captures do not provide enough uncontaminated pixels
to reconstruct that layer. Red's orange title artwork is excluded.

The 00:20 UTC review snapshot contains 131 resources totaling 2,831,738 bytes,
with individual hashes. The scoped source, native image exports, provenance
and distribution checks passed under Node 24.21.0 before it was copied.
This snapshot also contains the independently reviewed two-pass Bonemerang
correction; ordinary Tiny Woods play does not cover that level-25 move.

Manual inspection of that snapshot restored Ivy and Spark on B3F with their
levels, HP and held berry intact. B showed Team above a clear lower map; C used
the native shaded pattern. SELECT retained Team above its black-backed lower
map, A hid both team markers, and Help preserved that hidden-marker state.
B closed the map, cleared its accessibility announcement and restored the same
actor positions and HP. G displayed the map only above, and SELECT was inactive.
The manual observations do not measure the ten-frame/two-frame timing constants.

Ordinary movement explored two dead-end branches, returned through the room
junction and found the final stairs. Partner Growl and Thundershock defeated
another Wurmple during this route. Proceed entered Caterpie's clearing, followed
by the Butterfree reunion, Oran/Pecha/Rawst reward and scoped completion screen.
No later chapter opened. Browser logs contained no warnings or errors. The
native-resolution captures in the snapshot directory are:

| Capture | SHA-256 |
| --- | --- |
| `native-reunion.png` | `1c57b85cc66d236c81d3cc88b72fd5e3452dbfee3ad1708225d746b634cdb513` |
| `native-complete.png` | `33d46a816e62eb62c5a322e40911b28fcb5ed428cc6242f2cb2d8a3146027e3a` |

The subsequent 00:32 UTC snapshot contains 131 resources totaling 2,837,297
bytes. Its five changed runtime files add the manually measured two-row upper
map footer, failure-path Help focus cleanup, audio resume cursor seeking and
six reviewed later-level move handlers. It is 5,559 bytes larger than the played
00:20 snapshot; these later changes are static-review evidence, not part of that
completed dungeon run. The footer removes the unsupported Belly/Money row;
half-size manual text measurements and its female palette remain qualified.

Seismic Toss, Dragon Rage, Endeavor, Take Down, Submission and Double-Edge now
retain their source direct-HP/recoil rules. Independent review corrected recoil
before deferred EXP/level-up healing and verified unchanged older handlers by
AST comparison. Twenty-six rejected learned move IDs across 36 species/level
entries remain in the prolonged-retry inventory. The audio-only binary seek
avoids spending its 64-note scheduling limit on elapsed notes after resume;
voice limits, activation ownership and the authored score are unchanged.

The complete authoring `npm run check` passed under Node 24.21.0 after these
changes: 602-file static lint, 465-file strict types, retained historical audits
and all selected native asset/distribution checks. No game source was executed.
All 45 changed paths passed their applicable pre-commit checks. Manual startup,
opening skip, title/menu and Continue on the 00:32 snapshot restored the completed
Ivy/Spark rescue. This confirms that save boundary, not the newly added late moves.

## Battle presentation follow-up

The next revision separates committed mechanics from their visible sequence.
Detached event snapshots carry movement, casts, target visits, HP changes,
stat/status attempts, item changes and faints. Independent source review and
AST normalization against the preserved spawn baseline found no gameplay or
random-draw changes in the instrumentation. A separate reviewed correction
displays nominal damage before the HP clamp; an explicit MISS flag prevents
large damage values from being mistaken for the native miss marker.

The selected native bank contains 15 effects, including Scratch, Ember,
Thundershock, Growl, shared damage impacts and selected status applications.
Its image is 21,890 encoded bytes and 1,089,536 decoded bytes. Per-pose
attachments and separate depth layers preserve the original composition.
The foreground presentation clock owns source waits, numeric overlays and
remaining animation tails. Saves contain only the completed mechanics state;
scene changes and reduced-motion transitions cannot replay an action or sound.
These comparative Red source timings still require direct Blue corroboration.

Pay Day and Covet now retain their reviewed held-item and drop order. The
prolonged-retry inventory has 24 unsupported move IDs across 34 learnset
entries. Target selection now preserves source facing order, room self-last
ordering and relation filtering without changing the AI's existing intent.
Wild actors reuse vacant slots, and newly generated actors use the four
verified initial-sleep chances. Existing saves keep their recorded slot order.
Movement flushes own proximity wake-up, including adjacency around corners;
the existing compact wake-facing policy remains qualified.

The two large runtime manifests use compact JSON. The scenery manifest's parsed
data is identical to the previous checkpoint. The 3 MiB distribution cap and
per-image memory limits remain unchanged. Manual evidence for this revision
will be recorded separately from the completed Ivy/Spark run above.

The 01:22 UTC frozen snapshot contains 141 resources totaling 2,947,217 bytes,
with per-file hashes. Full authoring checks passed under Node 24.21.0:
615-file static lint, 473-file strict types, retained historical audits and
all selected asset/provenance/distribution checks. No game module was executed
by those checks. Manual startup and Continue restored Cinder and Volt at the
same Butterfree request before the first floor was generated.

Manual B1F play in that snapshot confirmed Growl's directional effect and the
Pidgey's lowered-attack symbol. Setting Scratch retained all 22 PP and did not
advance the enemies. An enemy attack reduced Cinder from 30 to 28 HP. Scratch
then displayed its slash, a nominal 18-damage number and the wild actor's removal;
the following prepared opportunity restored Cinder to 29 HP. Browser logs had
no warnings or errors. A raw debugger frame-capture request stalled for about
136 minutes despite its requested timeout; the ordinary browser controls
remained usable afterward. That tool stall is not a game-performance measurement.

The 03:54 UTC frozen snapshot has 141 resources totaling 2,957,823 bytes. It adds
the independently reviewed shared hit-pass owner, whole-move EXP, Water Sport
accuracy draw, retained-partner terminal learning, empty adjacent Ember and
same-heading face evidence. Separate save-journal receipt guards reject a stale
tab's changed-data write; they do not provide atomic cross-process locking.
Quicksave in the earlier build and Continue in this snapshot restored the same
B1F positions, Cinder at 29/30 HP, Volt at 25/25 HP and the remaining Pidgey's
lowered-attack status. Scratch remained set with 21/22 PP. Help paused the
restored screen for its native capture:
`native-battle-continue.png`, SHA-256
`ea13e308cad5df3539e5bba2992276bd7a78baf4981d1fdb3a90420a6f00fa63`.
This startup/save observation does not exercise the later-level move branches.
The snapshot differs from 01:22 in eight runtime modules and adds 10,606 bytes;
every copied runtime hash matches the candidate working tree.
The full authoring check passed again for this candidate, including 615-file
lint, 473-file strict types and all selected resource checks. Applicable hooks
passed across the 72 changed paths. Website `flight-check` remains unavailable
locally because its dependencies are absent after the previously recorded
package-policy installation failure; exact-commit hosted checks remain required.

## Initial battle bank and raw-zero follow-up

The signed `882cdd14c25b7d79445a637f3dcd97d2c92f0c35` checkpoint passed
all four exact-head hosted workflows: lint, game static checks, Playwright and
CodeQL. Its CI ledger is preserved under `.work/ci-882cdd14/`.

Further manual play in the frozen 03:54 snapshot completed the B2F Sunkern
encounter, its held-money drop and Volt's level-six Tail Whip learning. The
leader's first money pickup displayed its tutorial. On B3F, Exeggcute's initial
sleep symbol persisted during the adjacent walk, then disappeared before the
next action. Its following Hypnosis caused blocked leader turns; the message
log showed two three-damage attacks and Cinder's wake-up at 24/30 HP. Subsequent
Scratch commands removed Exeggcute, and Cinder reached level six at 28/33 HP.
These observations establish this manually played route, not exact DS timing.
The native initial-sleep capture has SHA-256
`c51c7a5917166a1ac41cafb35cb5a9779349eb4f0efe897f8f3925192c3c697b`.

The next local revision adds ten initial effects in a separate bounded bank.
Its 512 × 771 image and metadata total 72,440 encoded bytes; the existing
15-effect bank remains byte-identical. Both banks total 2,668,544 decoded bytes
under the 4 MiB aggregate effect limit. Source-pinned Ember travel now samples
the actual post-launch actor pose, retains signed coordinate recurrence and
keeps its separate depth position. A corrected Cyndaquil southwest idle age
prevents a stale attachment pose at that launch boundary.

False Swipe now retains nominal damage and its post-subtraction survival clamp.
Bide joins direct-damage contact before EXP; a successful zero-energy release
retains accuracy 1 without marking EXP. Mud-Slap and Dynamic Punch explicitly
retain the native zero-chance secondary sentinel. No additional late move is
admitted. Raw zero damage carries one captured source/target message receipt:
visible pairs select native sound 342/343 by target team, while other pairs
wait 30 frames. There is no damage number, MISS, hit reaction or HP patch.
Independent source/AST review accepted the audio and consume-once join; no
browser audition or exact Blue audio claim is made.

The complete authoring check passed for the 04:22 UTC export: 143 selected
resources totaling 3,041,696 bytes, 617-file static lint, 473-source strict types,
all retained historical audits and the selected factual/art/audio checks.
No game module was executed by those checks.

A matching 04:28 UTC frozen snapshot records every runtime hash. Quicksave in
the 03:54 build returned to its title menu before navigation. Startup and
Continue in the new snapshot restored the same B3F corridor, party positions
and level-six HP: Cinder 33/33, Volt 28/28. Browser warning/error logs were
empty. Its built-in native-resolution capture, `native-initial-bank-continue.png`,
has SHA-256 `51d3354d949019e8f611f592f91bb246c77a58557c945f49bf48ccd853b831e4`.
This verifies startup, save restoration and resource loading; it does not
establish full animation or auditory parity.

## Scoped code removal — 2026-10-11

Justin explicitly requested further code removal to the opening/menu/character
creation/Tiny Woods boundary. The [pruning record](BLUE-PRUNING.md) lists the
retained graph, removed cohorts and recovery evidence. The actual tree now has
62 typed game sources, compared with 473 before retirement; 96 authored files
remain in lint. The selected export is 143 resources totaling 3,034,160 bytes.

The full pruned `npm run check` passed under Node 24.21.0, including source lint,
strict types, all selected export comparisons, independently pinned quiz and
factual invariants, native provenance, geometry and memory budgets. The old
full-campaign checks are removed with their owning code. The root README and
browser storage were unchanged. The matching browser startup/save check is recorded below; exact-head hosted
checks remain separate publication evidence.

A frozen 04:52 UTC snapshot matches every selected runtime hash. Manual startup,
opening skip, title and Continue restored Butterfree's first reunion line with
Caterpie, Cinder and Volt, matching the earlier 04:28 saved scene. The browser
warning/error log was empty. Only after confirming that match was the older
test tab closed. Help and the built-in screen capture retained the restored
scene in `native-pruned-reunion.png`, SHA-256
`4dfe3e4d77c834b0bcda2764433e449bcce3d051f746e1a5d5a34bb7633e077c`.
This confirms pruned startup/save/resource loading; the preceding three-floor
manual route used earlier frozen builds, and this scene does not exercise the
new later-level or healing branches.

The pruned build then completed the reunion, showed the Oran/Pecha/Rawst Berry
reward, and reached the rescue-complete screen after Butterfree and Caterpie
left. No later chapter was entered. Its native completion capture is
`native-pruned-complete.png`, SHA-256 `ea9865572402b1435bdf2f6afdb7de13af9267c10d3211d193cb71eed1968277`.

The same local revision includes the independently reviewed Metal Claw user
secondary gate. Its native history is transient and omitted by native quicksave:
new actors, floor entry and Continue reset it; ordinary browser autosave retains
live identities. The correction changes no save schema. Healing now presents HP
before effect 7, refreshes its low-HP warning afterward, then emits one result
message before the positive number. Full-HP recovery still plays the application.
Successful infatuation adds its separate generic 15 entry with a fixed attachment.
These two application effects retain their final held frame before handle
removal. Source-derived timing remains qualified for direct Blue corroboration;
the subsequent PCM admission is recorded below.

The signed pruning checkpoint `ac3967bddf7ddeea624c7dc1b5b316f69820f935`
passed Game Static Checks, Lint, Playwright and CodeQL on its exact head.
The later LOOK/SELF camera change has passed independent source/lifecycle
review and hash admission. Its shared camera counter, captured-position
discovery, input return and preference migration preserve the adventure save
schema and numerical turn owners. The isolated review covered 62 strict sources,
14 lint inputs, 79 unchanged functions and 12 metadata-only changes. The combined
LOOK and specialized Tiny Woods generator passed the full scoped check under
Node 24.21.0: 96 lint inputs, 62 strict sources and all factual/asset/export
checks. Its 143 resources total 3,034,606 bytes. Manual camera acceptance remains
pending at this entry.

The next integrated check adds source-derived healing and heart PCM cues and
the five-function cleanup. It passes under Node 24.21.0 with 99 lint inputs,
64 strict sources and all scoped factual/asset/export checks. The distribution
contains 145 resources totaling 3,057,848 bytes. Independent review verified
24 native source pins, three samples, 18 notes, 210 stereo rows, 27 pitch rows,
SE5 replacement/release-tail ownership and the shared 32-voice limit. Fresh
displayed effects own the cues; canonical mechanics, saves and visual waits
are unchanged. Playback remains dry and comparative; native global mixing,
reverb, Blue sample identity and manual listening remain unverified.

Further pruning removes six authored cues shadowed by native players, five
unrequested audio roles and an uncalled volume wrapper. Retained music and note
tokens remain exact. That scoped check passes with 99 lint inputs,
64 strict sources and 145 runtime files totaling 3,054,255 bytes. The authored
bank at that checkpoint has 11 themes, 10 effects and 659 notes. A separate source correction
applies the driver's fixed-type pitch rounding to menu voices 60/64; ordinary
no-damage voice 61 remains unchanged. Manual Static activation exposed an
authored wording bug, now corrected through a status-message table with the
same admitted status keys and unchanged numerical/effect ordering.

The next integrated revision adds the selected Hypnosis background: 13 native
patterns, a bounded 53,248-byte decoded bank, DS channel blending and the BG0
left-edge guard. Its one-frame raw preload hold pauses the source clock;
the existing effect drain owns completion. Notice clearing, HUD suppression,
resource disposal and empty-target travel receipts passed independent source
review. The full Node 24.21.0 check passes with 102 lint inputs, 66 strict
sources and 148 runtime files totaling 3,067,402 bytes, leaving 78,326 bytes
under the distribution limit. Blue framing/preload phase, travel attachment,
sound 769 and intermediate canvas colors remain qualified. This check executes
neither game source nor native game code.

The 05:13 frozen manual run completed the eight-question quiz and its invasion
follow-up, produced hasty/female Skitty, selected Pikachu and named the partner
Flash before naming the hero Mochi during awakening. Its native scene capture
`native-mochi-awakening.png` has SHA-256
`b57e37257f34655321c8537f9e47da7368d7b31f27747a713ef91bc8b5241e46`.
B1F generated with level-five HP 30/30 and 25/25. Quicksave and Continue into
the 05:27 audio snapshot restored the same room and party; SELF persisted and
was manually switched back to LOOK. Team focus showed Flash's cyan HP bar and
returned to the leader. Ordinary combat exercised Absorb recovery, a full-HP
recovery request, misses, Static and a front-line swap. Mochi defeated both
Sunkern with Tackle, explored a dead-end corridor and returned with the run
control. A later Pidgey defeat raised Flash to level six and taught Tail Whip;
the visible party HP was 22/30 and 24/28. The offscreen automatic LOOK shift,
Cute Charm heart and direct audio audition remain unverified.

The signed checkpoint `f65427b0153aedb3b8aff317d30013c5c86a187d` passed
Game Static Checks, Lint, Playwright and CodeQL on its exact head. The 05:57
frozen build restored the same B1F room, party positions, stats and tactic;
the browser warning/error log was empty. Its native Continue capture has
SHA-256 `d185affcf86cb4bb233ea369f9ce58e70d2dd0eec08696b3c8c8031fca9e1e29`.
Further manual play observed Cute Charm's infatuation message, both Poké
pickups, the money tutorial, running stops before items/stairs, Mochi reaching
level six, and the B2F transition with HP 27/33 and 28/28. The transient heart
frames and audio were not sampled.

The next composed check adds native comparative regular-attack 351 and distinct
accuracy-miss sound routing while removing the authored miss cue. It also
removes 41,760 bytes of unreachable runtime facts and motion records. Full
playable growth/learnsets and existing save/runtime algorithms remain exact;
wild data retains the level-two EXP rejection boundary. The full Node 24.21.0
check passes with 102 lint inputs, 66 strict sources and 148 runtime files
totaling 3,026,451 bytes. The authored score has nine effects and 657 notes.

Before admitting that pruning, an older derived play note naming Pidgey's Gust
was checked against the original CUA images and accessibility text. Those
captures show eight damage but do not name the move. The unsupported move-name
inference was corrected with provenance; it is not replaced by an observed
Tackle claim. Independent frozen-source review confirms that level-one Pidgey
cannot obtain Gust in this runtime. The original captures remain in the ignored
`blue-gust-note-review-20261011-0611` evidence packet.

The 06:16 snapshot restored the older B2F save with the same corridor, party
positions, Go after foes tactic and level-six HP 28/33 and 25/28. Its browser
warning/error log was empty. The native capture has SHA-256
`a0045f201c62636751f35263950963e87c8322337d06a849473af4d1807ad397`.
The subsequent metadata-only audio cleanup passes the full scoped check with
the same 102 lint inputs and 66 strict sources; 148 runtime files now total
3,024,985 bytes. Playback tokens, native players and source attribution remain
unchanged. This establishes saved-run compatibility for the observed state,
not exhaustive save or audio parity.

Further manual B2F play with that snapshot directly captured automatic LOOK:
while the hero ran north, the camera followed Flash using Thundershock beside
the stairs, showing Flash's cyan HP 27/28. It then returned to Mochi and restored
input. The ordinary browser capture has SHA-256
`bab21af18588dff78f229516dfa0ac131171207e8e25b7cdb57cf5eb46d90beb`.
This verifies one automatic camera sequence, not exact native clock parity.
The run was quicksaved beside the B2F stairs with both level-six members at
full HP, 33/33 and 28/28, and Go after foes retained.

The next static-passing composition adds the source-derived adjacent Exeggcute
Hypnosis attachment and depth, removes unused startup species preloads, and
matches the North American file-menu logo and fresh-menu geometry. New Game's
help caption is directly transcribed from the reference. All 102 lint inputs,
66 strict sources and factual/asset/export checks pass; 149 runtime files total
3,038,939 bytes. The missing third menu illustration and its Blue selection
behavior remain qualified. The 06:50 frozen snapshot preserves this composition
for separate manual review.

The 06:50 build passed fresh-origin menu inspection and restored the existing
B2F save. The fresh lower-screen capture has SHA-256
`d96f85bdf0b835bc48574060b79cbe5cad648c5d9d5f19ec8fc3aed61b635f67`.
Manual play then entered B3F, showed its recovery tutorial, and encountered
Exeggcute. A directly captured Hypnosis frame shows the background blending the
world and actors with the bottom HUD/map/message hidden; the next observation
shows the normal HUD restored and Mochi awake. That ordinary browser frame has
SHA-256 `3dde8e556a67a5bde0118277ebcdc248a957015b1cb84d1010112e5522f6ddf2`.
It does not capture the complete effect225 trajectory, exact sleep duration or
audio. The run was quicksaved beside an uncollected berry with Mochi at 31/33 HP
and Flash newly level seven at 31/31. Browser warning/error logs remained empty.

The integrated geometry and ground-pickup revision passes the full Node 24
scoped check: 102 lint inputs, 66 strict sources, 149 runtime files and
3,043,310 bytes, leaving 102,418 bytes below the cap. Ground pickups use explicit
330/331/332 receipts while berry results retain their prior authored cue. The
per-result twelve-actor bound supports a separate twelve-pickup delivery cap;
other private cues retain four per batch and all owners share 32 live voices.
The authored money cue is removed, leaving eight effects and 655 notes.

Manual review of the 07:03 composition restored the B3F save, picked up an Oran
Berry after walking, displayed its first-use tutorial and held-item update,
then ate it through the item menu. HP rose from 31/33 to 33/33, the held slot
cleared and normal controls returned. Browser warning/error logs were empty.
This checks the observed item flow and presentation lifecycle, not audio output.

A fresh 06:50-build quiz completed eight main questions and selected hardy/Boy
Charmander. Choosing Mudkip and naming the partner Ripple reached the awakening
with both selected sprites loaded after the default preloads were removed.
The native capture has SHA-256 `edae0c4da08e9987a45f37c12f3c152055c6622a22dd56ffb6d7edb9df9ad4f7`.
Browser warning/error logs were empty. This check ends at awakening; the
earlier Mochi run covers hero naming and the full creation sequence.

The signed checkpoint `c90514bdca4e5d8edbd477d85fbaafe3e4e5fd4a` publishes
that 149-file composition. Its signature, actual remote/upstream SHA and clean
worktree were verified; both publication hook stages pass. Game Static Checks, Lint, Playwright and
CodeQL all pass on that exact head.

A subsequent four-file correction restores moved-nonleader pickup at the
existing flush/wake boundary while retaining the early empty-held-slot AI gate.
It shares the existing helper, adds only the source's full-slot arrival message,
and preserves the twelve-actor result bound, RNG calls, saves and audio owners.
The full scoped check passes at 149 files / 3,044,051 bytes. Blue identity,
existing hero mutation order and wrapper presentation timing remain qualified
in the mechanics reference. The 07:16 frozen build records this revision for
manual continuation from the saved B3F exit.

Manual 07:16-build continuation restored the same B3F exit state. The hero used
the ordinary run modifier to step over an Oran Berry without collecting it,
then moved away once. Flash walked onto that tile and acquired the berry at
walking completion, before any further player turn. The ground item vanished,
Flash's held slot updated, no leader tutorial appeared and controls returned.
The ordinary browser frame has SHA-256
`1711fe741a6c242151aea06dce263ce92f47b678c5fc567f17096bbcf6439db2`.
Browser warning/error logs were empty. Full-slot partner money and enemy
arrivals remain source-reviewed rather than manually sampled in this run.

The same run then completed the three-floor rescue: Caterpie's clearing,
Butterfree's reunion, the Oran/Pecha/Rawst reward and their departure. The final
screen offers Adventure Log and Return to top menu, with no town or team
formation transition. Reunion capture SHA-256 is
`50bbcc64abe43abdaf59703e8c85da28b95b1120dcbce63f1b4358155b95fa45`;
completion capture is `cdeb40e26518cf12e008b6d0d4e765a4bd971dab4f4f6673bdea60d79b13c306`.
The ordinary browser warning/error log remained empty.

Adventure Log correctly paginated the completed team/reward record and the
214-turn total. Return to top menu followed by Continue restored completion
directly, without replaying the reunion/reward or opening another dungeon floor.

The Blue touch THROW shortcut now follows the original manual's no-set-item
regular-attack fallback. It uses the existing combat owner through a distinct
transient action, preserving A's free partner Talk branch and all input guards.
Independent source/AST review admits the three-source change; the full scoped
check passes with 149 runtime files totaling 3,044,194 bytes. Exact original
Blue partner-facing footage remains unverified. The 07:43 snapshot freezes this
revision for manual toolbar and fresh-floor checks.

Manual continuation of the 07:43 build entered a fresh B1F with Flint
(Charmander) and Ripple (Mudkip). A while facing Ripple opened partner Talk;
THROW in the same direction performed a regular attack with no target.
Facing an adjacent Pidgey and clicking THROW dealt nine damage. Growl stayed
at 20/20 PP and Scratch at 22/22. The ordinary browser capture has SHA-256
`928286bc2a3143a6fc1fa141338d641a6f19408bb10c738f865a3ad87423a621`.
Quicksave returned to the file menu, and Continue restored the combat position.
Browser warning/error logs were empty. This is manual behavior evidence;
ground-Poké throwing and audio output were not tested in this snapshot.

Ground Poké now uses its original no-Toolbox Throw path: whole-pile flight,
catch eligibility, one-HP uncaught hits, wall/range landing and caught partner
Use. It shares the existing damage, EXP and drop owners. The review also fixes
the shared visible-KO pose, blinking body, hidden shadow and retained status
icons, and corrects equal-depth projectile ordering. The final retained KO
image, absolute blink phase and direct Blue clipping remain qualified in the
mechanics reference.

Finite spin/loss audio joins the existing players with a separate two-request
allowance, preserving other cue budgets. Two further table-pruning passes remove
1,349 runtime bytes. The full composed Node 24.21 check passes: 103 lint inputs,
67 strict sources and all factual, asset, provenance and export checks. The
distribution has 150 files totaling 3,077,411 bytes, leaving 68,317 bytes below
the cap. The 08:21 snapshot freezes those exact runtime bytes.

Manual review threw 26 Poké into a wall and recovered the intact pile, then
threw it to Pidgey. The catch log records the full amount; its native capture
has SHA-256 `425e2310f4db4c5600913c9f73b2271a599895a9cddf04fe2a8b68bc016488e5`.
Pidgey's subsequent KO awarded EXP and dropped the same pile. Ripple caught it,
offered Use/Info, had second thoughts on Use and retained all 26 Poké across
Quicksave/Continue and the B2F transition.

On B2F, throwing another 22 Poké at Ripple's occupied slot dealt exactly one
HP (30/30 to 29/30) while preserving its original 26 Poké. The ordinary browser
capture has SHA-256 `23f7abcbdc24c1ba10ce88689d53e546da392cd2195b69f0c1889edad1023d04`.
Normal controls and Quicksave returned; browser warning/error logs were empty.
Random misses, failed placement, exact frame phases and audio output remain
source-reviewed rather than manually established by this run.

The signed checkpoint `5b8ab3caa12a5edfde215dd9d5c9e86cf8863b04` passes Game
Static Checks, Lint, Playwright and CodeQL. Manual continuation of its frozen
08:21 runtime completed B2F and B3F, Caterpie's clearing, Butterfree's reunion,
the three berry rewards and departure. Adventure Log records Flint and Ripple
with 137 dungeon turns. Return to top menu followed by Continue restores the
completed ending directly. Browser warning/error logs remained empty. Reunion
capture SHA-256 is `8724515ef273f3ac7cfa074fd878e02342cd7a69cf99cf23ec62c78c42feab11`;
completed-save capture is `336c5390b9e8ecd69033d52aaa22962339fc16f1c2d846c5effae6ab8039b0e0`.

The next pruning composition removes unused cinematic pose entries and frame
fields, duplicated battle bounds, unused effect-frame fields, the shipped build
manifest and scenery provenance that belongs in the authoring tools. Complete
source records and attribution remain. All retained frame/layer values and
terrain/quiz data are independently compared; full scenery metadata reassembles
exactly from the compact runtime and offline record.

Synthesis now heals 50 HP on the admitted clear-weather Tiny Woods floors,
using the existing HP owner. Its source-derived effect 271 joins the existing
bank and retains the final source frame before healing's drain. No save field,
weather system, audio player or later campaign path is added. This corrects one
move reachable after prolonged retries; 23 learned move IDs remain unavailable.
Sound 809, native autonomous self-move selection and original Blue timing remain
qualified. No higher-level manual acceptance is claimed.

The composed Node 24.21 check passes with 103 lint inputs, 67 strict sources and
all factual, asset, provenance and export checks. Its 149 runtime files total
2,994,305 bytes, 83,106 bytes below the preceding checkpoint and 151,423 bytes
below the cap. The 09:19 snapshot freezes these bytes for manual browser review.

Manual review of the 09:19 export reached the fresh menu, completed eight quiz
questions, selected calm/Girl Bulbasaur and Charmander, and named the partner
Ember before naming the hero Fern during awakening. It entered B1F with both
characters at level 5 and 30/30 HP. Growl completed with no target, spent one PP
(20 to 19), and returned controls; Tackle remained 22/22. Movement and
Quicksave/Continue restored the same first-floor position. Browser warning/error
logs were empty. The native post-Continue capture has SHA-256
`d564c6175b2dcc844d847effca1bacedc42de72ea7f7144216bf889a669e140c`.
This targeted check covers compact asset loading and ordinary play. Higher-level
Synthesis has source review only; full animation/audio identity remains unverified.

The next composition removes runtime-only provenance, redundant actor
descriptors, character-creation source metadata and 124 unused portrait
expressions. All quiz choices/results and partner pairs remain; every retained
portrait crop matches its source. The full 213-portrait archive and source
evidence stay in the authoring package. The runtime atlas has 89 portraits.

Rapid Spin now uses the reviewed successful-damage cure path and shared faint
unlinking before deferred EXP. Its source-derived target effect retains the
terminator frame. Finite sounds 678/809 join Rapid Spin/Synthesis at the fresh
effect's first update, preserving the existing PCM player and all earlier sound
tuples. The separate two-request limit preserves earlier cue budgets; the
existing other-private quota can still suppress a later healing sound in an
instant batch. Original Blue audio identity and high-level manual casting remain
unverified. There are 22 unavailable learned move IDs across 31 entries.

The full Node 24.21 check passes with 103 lint inputs, 67 strict sources and all
factual, provenance, asset and export checks. The final 149-file distribution is
2,808,109 bytes: 186,196 bytes smaller than `25a4cce`, with 337,619 bytes below
the cap. The 10:45 snapshot freezes these exact bytes.

Manual review started from the preceding 10:11 composition, completed the title
and eight quiz questions, selected hardy/Boy Charmander and partner Squirtle,
named Brook before awakening and Coal during awakening, and entered Tiny Woods.
Both were level 5 with 30/30 HP. Quicksave returned to the file menu. Loading the
final 10:45 snapshot on the same origin and choosing Continue restored the same
B1F position and party values.

On the final snapshot, movement and Scratch completed normally. The message
log records 16 damage, Sunkern's defeat and 16 EXP for each teammate. Scratch
fell from 22 to 21 PP; Growl stayed 20/20. Controls returned and browser warning
and error logs were empty. Native combat capture SHA-256 is
`6e3aaaad760f8677295bc889df84a541d543955b6ddd96cf1b3fe3dba4ac31e8`.
This is targeted loading, combat and save-continuity evidence; the earlier full
Caterpie/reunion run remains separately identified above.

Signed checkpoint `0fb50c5d51bbd8742a8e42f9b513208ed249d343` passes Game Static
Checks, Lint, Playwright and CodeQL. Its exact runtime matches the frozen 10:45
snapshot. The subsequent manual continuation completed B2F and B3F, Caterpie's
clearing, Butterfree's reunion, all three berry rewards and the departure.
Caterpie's crying, normal and inspired portraits, Butterfree normal and Coal's
happy expression rendered from the reduced atlas. Adventure Log records Coal
and Brook with 76 dungeon turns. Return to top menu followed by Continue restores
the completed ending directly. Browser warning/error logs were empty.
Reunion capture SHA-256 is
`19a3382726c2cbf9ebd61ea1b2ba0dc9ea99b30b56ea58d03e7c4519ad591995`;
completed-save capture is
`7e0978298ab98ca1570c6fc6b045c30299fe481802b1dca8f8e191399fde9d30`.

The following local composition removes dormant form/item/weather numerical
branches and unused red Team HP glyphs while preserving all live calculations,
save acceptance, retained icon pixels and source archives. Common effect 22 now
requests its finite source-derived sound for 35 admitted move routes, including
Confusion's cast. A separate twelve-request allowance preserves earlier audio
budgets. Only the 34 all-STOP direct-cast routes suppress their authored cast
cue; Cross Chop's distinct native 351 route remains qualified. Playback owners,
existing samples/cues and the inherited private-four limitation are unchanged.

Its full Node 24.21 check passes with 103 lint inputs, 67 strict sources and all
factual, numerical, asset, provenance and export checks. The 149-file runtime is
2,815,590 bytes, with 330,138 bytes below the cap. The 11:11 snapshot freezes this
composition for separate manual review. No final-faint publication change is
included; that known timing qualification remains.

Manual review of the 11:11 snapshot resumed the existing Fern/Ember save from
the 09:19 build. Both Team-menu yellow hearts and the leader/set-move markers
rendered correctly. Growl completed without a target, spent one PP from 19 to
18, and returned control with no browser warnings or errors. The B2F transition
preserved the party; a regular enemy attack dealt one damage to Fern, and the
selected Tackle shortcut dealt 19 damage and defeated Pidgey. The log awards
12 EXP to each teammate. Quicksave/Continue restored B2F, Fern's 29/30 HP, Ember's
30/30 HP, selected Tackle at 21/22 PP and Growl at 18/20 PP. Browser logs stayed
empty. Native post-Continue capture SHA-256 is
`272e92cb5efb112c9439aae69847f33f7c2401c81773bc6eaedf0627d5ead15c`.
These are play and save observations, not acoustic or frame-accurate acceptance.

The 12:06 UTC composition adds the reviewed ability/render pruning
and final-faint publication. Its frozen 149-file runtime totals 2,826,906 bytes;
the full Node 24.21 static check exited zero with 103 lint inputs and 67 strict
sources. These checks and observations belong to the frozen local build;
hosted workflow results remain separate evidence.

Manual review resumed Fern/Ember on B2F. Tackle dealt 15 damage, defeated Pidgey
and awarded 12 EXP to each teammate; its PP decreased once from 21 to 20.
Quicksave/Continue preserved the resulting position and move values. Growl
interrupted by Help consumed one PP, from 18 to 17, and returned controls.
Another Growl across a separate-tab operation consumed one PP, from 17 to 16;
a definite hidden/blurred interval or pending-faint interruption was not
established. Natural partner KO showed 0 HP with the status icon retained,
then reached the normal defeat menu; Try again restored B1F with both teammates
at 30/30 HP. Natural leader KO showed 0 HP with the status icon and damage
number retained, then reached the normal loss menu. Return to top menu followed
by Continue restored that defeated state; choosing Try again restored both to
30/30 HP on B1F. Normal partner move and IQ settings were restored afterward.
Browser warning/error logs were empty. The observation ledger
and six captures with exact hashes are retained under
`.work/blue-opening-review-20261011-1206/` in the authoring package.

These observations do not measure the precise final frame, physical paint,
audio output or exact Blue parity. Reduced-motion manual checks have not been
performed through the available ordinary browser controls. Earlier
completed rescue runs remain separate from this local composition.

## Published rescue completion, 2026-10-11 12:59 UTC

The same 149-file snapshot matches every published runtime blob in `c62e846`.
Ordinary manual play took Fern and Ember through all three floors, Caterpie's
clearing, the Butterfree reunion, all three berry rewards and the departure.
Adventure Log displayed 211 dungeon turns on the save also used for the earlier
defeat/retry checks. Return to top menu followed by Continue restored the
completed rescue with Adventure Log and Return to top menu as its only choices.
Browser warning/error logs were empty. The 17 observations and three additional
native captures are in `published-playthrough.json` beside the earlier evidence.
Game Static, Lint, Playwright and CodeQL all succeeded for this published commit;
the sole normal CI watcher exited successfully after its discovery window.

These observations retain the timing, sound and reduced-motion qualifications
above; they do not establish exact cartridge parity.

## Renderer-pruning review, 2026-10-11 13:56 UTC

The next pruning composition preserves every native character frame and image,
removes unused rendering options and aliases, and retains all timer/motion
records. Its final 149-file runtime totals 2,822,140 bytes. The full scoped check
passed with 103 lint inputs and 67 strict sources. Independent composition and
wording-addendum receipts are under
`.work/blue-pruning-composition-independent-20261011-1326/`.

Manual play on a fresh origin observed the unskipped opening reach the title,
eight quiz questions, a hasty Torchic result, Treecko selection, partner naming
as Sprig, awakening and hero naming as Flare. Normal, happy, worried and shocked
portraits and the sleeping hero rendered. B1F began with both at level five and
30/30 HP. A shared reference to paws was then removed from the authored script;
the fourteen-byte correction was source-reviewed, not replayed from startup.

After Quicksave and loading the corrected final snapshot, Continue preserved
the initial position and HP. Setting Scratch kept all 22 PP. Movement produced
a two-damage enemy response; Scratch then dealt 19 damage, defeated Sunkern and
awarded 16 EXP to each teammate. Scratch decreased once to 21/22, while Growl
remained 20/20. Post-combat Quicksave/Continue preserved the enemy removal,
positions, Flare's 29/30 HP, Sprig's 30/30 HP and the selected move's PP.
The separate completed Fern/Ember save also resumed at the rescue ending, with
only Adventure Log and Return to top menu. Browser warning/error logs were empty.

Both frozen snapshots, the two manual ledgers and six native captures remain in
`.work/blue-opening-review-20261011-1328/`. The initial snapshot covers character
creation; `snapshot-final.json` covers the corrected build's combat and save
checks. The specialist's unavailable browser attempt is separately marked
unverified. This was a bounded B1F review, not another full three-floor run;
the earlier published rescue completion and all fidelity qualifications remain.

## Published rescue and recovery review, 2026-10-11 17:52 UTC

Ordinary browser play continued the earlier Flare/Torchic and Sprig/Treecko
adventure on the immutable `d040e1160edc8c56f30f2aec25b820e21f595cd8`
distribution. A B1F Scratch KO awarded 16 EXP to each member; the pair then
crossed B2F, fought Pidgey, and reached B3F. Two touch-direction inputs and the
touch A control reached and confirmed the final stairs. The old preview server
had stopped, so loading Caterpie's artwork failed. Restarting that server,
choosing Try again, and using Continue restored the rescue scene without
editing or replacing the save.

The run completed Caterpie's rescue, Butterfree's reunion, the Oran/Pecha/Rawst
reward and departure. Adventure Log reported 12 dungeon turns. Return to top
menu and Continue restored the completed ending, with only Adventure Log and
Return to top menu available. The console retained the diagnosed server-outage
error; no new error appeared after recovery. This is functional evidence,
not an exact audio, frame-timing, RNG or exhaustive-mechanics comparison.

The action ledger and unmodified native screenshots are retained in
`tools/pokemon-dungeon/.work/blue-parity-20261011/playthrough/`.
`native-flare-reunion.png` has SHA-256
`61dd7cf4b0d51039a85ac825e50333e83b8077076b46900638e4009830fc4562`;
`native-flare-complete-continued.png` has SHA-256
`546a3083a64e32d14a89ce54e345dbbfea50d0c4c83e05e7b5e39db11c94e96b`.

## Music removal and stat moves, 2026-10-11 18:33 UTC

Justin requested removing all background music while retaining gameplay/UI
effects. The music catalog, scheduler, gain node, theme data and phase mapping
are gone. The retained authored effect bank has eight cues, 26 notes and six
patches, totaling 3,008 runtime bytes; existing menu and PCM facts are unchanged.
Only the dungeon/general-menu distinction remains for sound-effect throttling.
Retired score files have a hash/restore ledger in
`.work/blue-parity-20261011/stat-audio/` and are recoverable from macOS Trash.

[Foresight and Psych Up](../../../tools/pokemon-dungeon/reference/blue-stat-moves.md)
now have bounded handlers for retry-reachable learnsets, leaving 20 unsupported
learned IDs across 28 rows. They add no saved fields. Full helper tracing caught
the non-Ghost Foresight route: effect 14 is required, not the Ghost-only 122.
The appended 14/205 artwork preserves the existing effect/pose records and
pixels; source, image, voice and distribution budget limits remain unchanged.

The final candidate has 149 runtime files totaling 2,778,317 bytes. The complete
static check passed under Node 24.21.0. Manual browser review exercised eight
main quiz prompts plus the conditional alien-invasion follow-up, the female
Hardy/Pikachu result, nine eligible partners, Squirtle selection, partner name
Shell before awakening, hero name Volt afterward, and the rescue-refusal loop.
The first candidate's dungeon entry exposed an outdated runtime effect
allowlist; adding exactly IDs 14/205 fixed it. Its error is retained in the
ledger rather than counted as a pass.

Continue on the corrected immutable build recovered B1F, then movement picked
up 26 Poké and displayed its tutorial. Setting Thundershock preserved 17/17 PP;
using it once while muted with no target reduced it to 16/17. Re-enabling sound,
Quicksave and Continue preserved the selected move and PP. The final candidate
also restored the earlier completed Flare/Sprig rescue save with only the two
ending actions. No new browser error appeared after the correction. The native
PP capture has SHA-256
`bae0c4eb7002eda75eaf9a2290812a77f8cb99cbc503fbd29e6df67fedefdb97`;
the completed-save capture has SHA-256
`18e359027abf686af1ec41d20e7ffcd396b950fe619aab38df392a86a15d98a5`.
Ledgers, snapshot hashes and images remain in
`tools/pokemon-dungeon/.work/blue-parity-20261011/`. The new late-level moves
have source/art review, not manual casts or exact sound/timing acceptance.

## Give Up ownership review, 2026-10-11 18:52 UTC

Codex reported a Give Up soft lock on `d0963a3`. Independent source review and
ordinary browser play disproved that report: the rejected wait still created a
zero-length presentation, which immediately settled into the defeat screen.
The native capture and the source trace remain in the review ledger.

Give Up now delegates directly to the app's phase owner. It saves defeated
status and the defeat phase together, clears transient presentation state, and
avoids a synthetic wait/presentation. No turn, PP, combat or retry rule changes.
On an immutable candidate, No returned to the submenu; Yes opened defeat;
reload and Continue restored defeat; Return to top menu and Continue also
restored it. Try again returned Volt and Shell to B1F, with selected
Thundershock restored to 17/17 and Growl at 20/20. Browser warnings/errors were
empty. The restored-defeat PNG has SHA-256
`d986e0c3af4c6f20f9f2a28cbfe91c830d9876b8e19d8f5277be823348d4581a`.

Node 24 static checks passed: 103 lint inputs, 67 strict source files, factual,
asset, provenance and distribution checks. The runtime has 149 files totaling
2,778,635 bytes. Evidence is under
`tools/pokemon-dungeon/.work/blue-parity-20261011/give-up/`; the test tab and
server are closed, and both disposable runtime copies and duplicate downloads
were moved to Trash with verified hashes and restore paths.

## Fidelity limits

- Dialogue and some sound effects remain authored substitutes. Background music
  is intentionally absent at Justin's request on 2026-10-11. Native image reconstruction
  and selected exact Blue pixel checks do not establish complete animation,
  script or soundtrack identity. The source manifest records asset attribution
  without asserting a rights-holder reuse grant.
- Native AI/speed scheduling, cartridge RNG/call order and Blue binary parity
  remain qualified. Source arithmetic and sampled visual references are not
  proof of complete behavioral identity.
- All moves attainable within the conservative first-attempt Tiny Woods EXP
  ceiling have handlers. Repeated failed rescues retain EXP and can reach later
  learned moves with unsupported effects; these remain visibly unavailable
  without consuming a turn or PP rather than silently executing another effect.
- The title save menu and browser save/controls are scoped adaptations; later
  communication modes are not part of this opening.
- No automated game-source tests or playthroughs were created or executed.
  Static review and manual browser evidence remain separate.

## Source records

- [Visual evidence](../../../tools/pokemon-dungeon/reference/blue-visual.md)
- [Audio evidence](../../../tools/pokemon-dungeon/reference/blue-audio.md)
- [Mechanics evidence](../../../tools/pokemon-dungeon/reference/blue-mechanics.md)
- [Boot-card evidence](../../../tools/pokemon-dungeon/reference/blue-boot-cards.md)
- [Status artwork evidence](../../../tools/pokemon-dungeon/reference/blue-status-effects.md)
- [Battle event evidence](../../../tools/pokemon-dungeon/reference/blue-battle-events.md)
- [Battle visual evidence](../../../tools/pokemon-dungeon/reference/blue-battle-visuals.md)
- [Move execution evidence](../../../tools/pokemon-dungeon/reference/blue-move-execution.md)
- [Ground-scene ordering evidence](../../../tools/pokemon-dungeon/reference/blue-ground-scenes.md)
- [Charm and Screech multiplier evidence](../../../tools/pokemon-dungeon/reference/blue-stat-multipliers.md)
- [Save journal evidence](../../../tools/pokemon-dungeon/reference/blue-save-journal.md)
- [Target selection evidence](../../../tools/pokemon-dungeon/reference/blue-targeting.md)
- [Wild spawn evidence](../../../tools/pokemon-dungeon/reference/blue-wild-spawns.md)
- [Original Blue introduction video](https://www.youtube.com/watch?v=RrglH3dOqrg)
- [Current scope](BLUE-OPENING.md)
