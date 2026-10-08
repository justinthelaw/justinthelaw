# Current audio source joins — source-only design input

Prepared 2026-10-08 for the live audio writer. Native source is pinned Red comparative evidence, not a Blue executable/music/clock parity claim. The browser dialogue, arrangement, geometry and scores are independently authored. No native commercial prose, sequences or samples are copied here. No game modules were imported or executed; no tests, browser, audio audition or native compile were performed.

Native revision: `6bcbec4f906938c0243aa2026bcbd41b577bab85`.
Browser read anchor HEAD: `93feb30a8b01133672e8b8befa256e895cfd6048`; the exact file hashes below identify the source bodies inspected while unrelated v24 work is active.

## Request semantics and completeness

A numeric value below is a **direct native `enum MusicID` source join**, passed to the original-score lookup. It is never a dungeon-floor-table index. `silence` is an explicit request that replaces prior music; `source-gap → silence` also replaces prior music, but records that the exact browser staging does not yet have a qualified native owner. Absence of a lookup must never mean "retain whichever song happened to play earlier."

The deterministic overlay table covers every cursor in the 43 current authored scene IDs assembled through `createSteelMeaniesContent`. v24 adds gameplay owners, not additional authored scene prose in the inspected bodies. A newly added/unknown scene ID, invalid cursor, unqualified map/context or unsupported source join receives **source-gap → silence**, never a guessed fallback. Table rows are current browser **collapsed staging choices** informed by the listed native command order. They do not assert that one browser cursor equals an exact native instruction pointer or that native frame waits/fades are reproduced.

The complete request must be selected afresh from current snapshot/context, with precedence: unbound title/quiz owner → exact pending scene/cursor → source-qualified result/presentation owner → actual session/dungeon state → explicitly qualified current ground owner → source-gap/silence. A scene row whose request is silence must win over a retained live session's floor/boss cue. Do not use visual projected events, actor sprite names, arbitrary substring matches, latest text, an inferred previous location, or a remembered native PC to select music.

## Numeric joins

| Direct MusicID | Native enum | Current use |
| --- | --- | --- |
| 1 | `MUS_RESCUE_TEAM_BASE` | Base scenes/qualified normal base owner |
| 4 | `MUS_DREAM` | First/third dream scenes |
| 7 | `MUS_POKEMON_SQUARE` | Square/Post Office scenes/qualified normal owner |
| 10 | `MUS_THERES_TROUBLE` | Butterfree trouble; Meanies confrontation |
| 11 | `MUS_BOSS_BATTLE` | Actual active Skarmory fight after prebattle scene |
| 12 | `MUS_WELCOME_TO_THE_WORLD_OF_POKEMON` | Native personality quiz owner |
| 14 | `MUS_THUNDERWAVE_CAVE` | Entrance/ordinary Thunderwave floors after table lookup |
| 19 | `MUS_WORLD_CALAMITY` | Guard override only at MAIN(16,2), outside current chapter |
| 43 | `MUS_TITLE_SCREEN` | Current authored title shell |
| 46 | `MUS_OPENING_TITLE` | Native opening montage only; no current browser owner |
| 50 | `MUS_BLANK_50` | Explicit native blank, not a playable original-score cue |
| 51 / 52 | `MUS_DUNGEON_FAIL` / `MUS_DUNGEON_COMPLETE` | Exact dungeon result owner only; see limitations below |
| 101 | `MUS_HEARTWARMING` | Awakening introduction |
| 103 | `MUS_A_SUCCESSFUL_RESCUE` | Reunion/thanks dialogues |
| 114 | `MUS_IN_THE_DEPTHS_OF_THE_PIT` | All three sourced early end rooms; prebattle summit |
| 120 | `MUS_MT_STEEL` | First/retry travel, ordinary Steel floor lookup |
| 125 | `MUS_TINY_WOODS` | Ordinary Tiny floor lookup; NOT Caterpie end room |
| 999 | `STOP_BGM` | Native sentinel → explicit silence |

`include/constants/bg_music.h` contains separate `MusicID` and `DungeonMusicID` enums. The 76-entry `gDungeonMusic` array in `src/dungeon_config.c:571–591` maps indexes0→114,1→125,2→14,3→120 (and all other entries), rather than passing the index directly. `run_dungeon.c:305,323` obtains `floorProperties.bgMusic`, then indexes `gDungeonMusic`. Scene commands below use MusicID values directly and require no floor-table conversion.

## Native current command chains

Paths in this table are `src/data/ground/ground_data_<name>_station.h` unless explicitly named otherwise. Command positions are source line numbers at the pin; `gN` is the declared group, not a browser cursor.

| Owner | Exact relevant command order / boundary |
| --- | --- |
| s01 g0/g1 | STOP12/20; silent introductory background lines; SWITCH12 at30; personality quiz SPECIAL_TEXT at32; FADEOUT30 at33 after it finishes |
| s02 g2 | SWITCH46 at46; FADEOUT30 at50; opening montage is a separate owner |
| s02 g3/g4 | SWITCH43 at62/148 for title/continue menu |
| d01p01 g1 | STOP39; silent prologue; FADEIN(60,101)62 after entities selected; lives0 introduction101; FADEOUT(60)193 then WAIT60 at194 before Butterfree; SWITCH10 at217; station waits actor CUE3 then FADEOUT30 at66 before NEXT_DUNGEON67 |
| d01p01 g2 | STOP361 on failed Tiny return; no invented meadow recovery BGM |
| d01p02 g1 | SWITCH114 at24; Caterpie end-room actor conversation; native direct join is114, not125 |
| d01p01 g3 | SWITCH103 at522; station AWAIT_CUE3 at524 then FADEOUT30 at525; actor final CUE3 ends conversation |
| b01p01a g17 | SWITCH1 at1401; station AWAIT_CUE3 at1403 then FADEOUT120 at1405. Offer/refusal/name/celebration are within actor script; actor final ALERT_CUE3 at1598 is after rename1573, MAIN(3,0)1576, final partner lines1583–1588 and departure. Refusal subscript FADEOUT5 at1649, then actor FADEIN(30,1)1531 before reoffering |
| b01p02a g15 | STOP1297; morning-title prologue; SWITCH1 at1305 before waking actor; AWAIT_CUE3 then CALL_STATION16 at1308 |
| b01p02a g16 bed | Prompt1367 precedes STOP1371; SAVE_START1372, MAIN(3,3)1373 and save text1374. Refreshed station s1 SWITCH1 at1391; ordinary g17 interior SWITCH1 at1420 |
| b01p01a g18 | SWITCH1 at1690; starter kit/Pelipper segment contains no replacement BGM |
| b01p01a g20 | Magnemite acceptance/refusal inherits sourced base1; refusal STOP2185 is followed by SWITCH1 at2189 before the plea/reoffer. Browser refusal cursor does not own the transient STOP |
| d02p01 g1/g2 | SWITCH14 at26/140, first/retry Thunderwave entrance |
| d02p02 g1 | SWITCH114 at26; AWAIT_CUE3 at28; FADEOUT120 at29 after joined-pair end-room conversation |
| d02p01 g3 | SWITCH103 at242; source entrance reward/thanks owner |
| b01p01a g23 | SWITCH1 at2448; AWAIT_CUE3 at2450; FADEOUT60 at2451 after final evening dialogue |
| d03p01 g1/g2 | SWITCH120 at24/141, first/retry Steel travel |
| dungeon_cutscene_skarmory.c | First/retry initialization SWITCH114 at45; first prebattle switches11 at138 only after all dialogue; retry switches11 at164 only after all dialogue. These are dungeon cutscene commands, separate from ground macros |
| dungeon_cutscene.c | HandleSkarmoryBossFaint is called535–537; once completion sets dungeon terminal state,637–638 requests STOP_BGM. Do not retain11 throughout departure scenes |
| d03p02 g1 | SWITCH114 at27; gap/Magnemite crossing actor script; final ALERT_CUE3 at125. This is the post-fight ground end room, not the native prebattle script |
| b01p01a g26/g27 | SWITCH1 at2685/2801 for first request/retry base owner |
| b01p01a g28 | SWITCH103 at2848; station waits CUE3 at2850 then FADEOUT90 at2851; actor final partner conversation completes with ALERT_CUE3 at3225 |
| b01p02a g21 | Steel-loss event dispatches this group; STOP1659 cold prologue then SWITCH1 at1666 before displayed wakeup |
| a01p01 g1/g3 | SWITCH4 at22/124 for first/third dreams; each waits actor CUE3 then FADEOUT60 at25/127 |
| b01p02a g19/g22 | SWITCH1 at1494/1703 for first/third dream awakening |
| t01p01 g0/g6 | SWITCH7 at332/1581 for ordinary Square and first tour |
| t01p01 g8/g9/g10 | Current Wigglytuff interaction retains known Square7: g8 proximity initiates g9 at1948; g9 preserves BGM and assigns MAIN(5,4)2109; g8s2 event initiates g10 at2099; g10 SWITCH7 at2396 for wind request |
| t01p03 g12 | SWITCH7 at1503 for Post Office tour; ordinary Post Office enter SWITCH7 at154 |
| b01p01a g29 | SWITCH1 at3517; final actor FADEOUT120 at3657 before final return-inside CUE3 at3663. This group is explicitly the friends morning base visit, not proof for arbitrary future "rest" prose |
| b01p02a g23/g24 | STOP1730/1766 cold prologues; SWITCH1 at1739/1775 before Meanies/Caterpie mornings |
| b01p01a g30 | SWITCH1 at3707; actor FADEOUT60 at3748 before arrival, SWITCH10 at3754 before confrontation; FADEOUT60 at3867 before departure. No BGM resume throughout missing-mail/Pelipper/op3b06 at3924/closing partner response3940–3942. Actor CUE3 at3946 then station FADEIN(60,1) at3710 |
| b01p01a g31 | SWITCH1 at4159; actor FADEOUT60 at4213 before Meanies entry; SWITCH10 at4253; FADEOUT60 at4331 before Caterpie/partner reassurance. Actor CUE3 at4366; station CALL_STATION32 at4163 then FADEIN(60,1)4164 |

Wrapper evidence in `src/data/ground/ground_event_data.h` is essential:1955–1957 explicitly executes interior2 → dream map162/g1 → interior19;2004 selects Steel-loss interior21;2017–2022 executes postfight map183/g1 → base28 → MAIN(5,0) → next save;2035–2037 executes interior2 → dream map162/g3 → interior22;2044 selects base29;2071 selects interior23;2079 selects Meanies base30;2087 selects interior24;2094 selects Caterpie/Sinister base31. This corrects any guessed morning-group numbering: third-dream g22, Meanies g23, Caterpie g24.

## Complete current authored scene/cursor overlay

`all` below explicitly means the finite cursor range in the adjacent column, not an unchecked numeric cursor. Browser native-clock collapse is qualified for every row; split night/departure rows are explicit original staging choices supported by the native fade/stop boundary, not assertions of frame-exact PCs. "Same native group" does not mean browser prose is native dialogue.

| Current scene ID | Valid cursors | Complete request by cursor | Source / qualification |
| --- | --- | --- | --- |
| browser-opening-awakening | 0–3 | 0–2→101;3→10 | d01p01 g1 introduction → Butterfree trouble; initial silent prologue is omitted by this browser scene |
| browser-caterpie-clearing | 0–1 | all→114 | d01p02 g1 direct end-room command |
| browser-butterfree-reunion | 0–1 | all→103 | d01p01 g3; fade after completed actor cue |
| browser-team-base-offer | 0–5 | all→1 | b01p01a g17; refusal cursor5 is after1 resumed, not the transient fade |
| browser-team-naming | 0–1 | all→1 | g17 naming input/confirmation before final cue |
| browser-team-name-celebration | 0–2 | 0–1→1;2→silence | g17 farewell then station fade; browser final night line deliberately collapses post-fade |
| browser-morning-awakening | 0–1 | all→1 | b01p02a g15 after cold-title STOP; those prologue PCs have no displayed cursor |
| browser-morning-bed-save | 0 | 0→1 | g16 prompt BEFORE STOP1371; saving itself has no saved current cursor |
| browser-morning-refreshed | 0–1 | all→1 | g16s1 SWITCH1 |
| browser-morning-partner | 0–1 | all→1 | b01p01a g18 |
| browser-morning-starter-set | 0–2 | all→1 | g18; no music replacement |
| browser-morning-pelipper | 0–1 | all→1 | g18; no music replacement |
| browser-morning-request | 0–2 | all→1 | g20; cursor2 refusal plea is after SWITCH1 |
| browser-magnemite-rescue | 0–1 | all→114 | d02p02 g1; reward is a separate next scene |
| browser-magnemite-thanks | 0–1 | all→103 | d02p01 g3 |
| browser-first-request-evening | 0–1 | 0→1;1→silence | b01p01a g23; final original sleep/bed line collapses completed fade |
| browser-town-dream | 0–1 | 0→4;1→1 | exact wrapper1955–1957: a01p01 g1 → b01p02a g19 |
| browser-town-mailbox | 0–1 | all→1 | known base enter1 b01p01a240 plus g24/g25 conversation; no Square map substitution just because continuation goes there |
| browser-square-tour | 0–2 | all→7 | t01p01 g6; source owner wins over final Post continuation map |
| browser-post-tour | 0–2 | all→7 | t01p03 g12 |
| browser-dugtrio-request | 0–2 | all→1 | b01p02a g20 reaches FADEIN1 before request dialogue; base26 also1 |
| browser-diglett-departure | 0–1 | all→1 | actual current base preparation before Steel travel; base26/normal enter1 |
| browser-steel-first-travel | 0–1 | all→120 | d03p01 g1 |
| browser-steel-retry-travel | 0 | 0→120 | d03p01 g2 |
| browser-steel-first-battle | 0–2 | all→114 | native first prebattle current owner;11 begins after scene is acknowledged |
| browser-steel-retry-battle | 0–1 | all→114 | native retry prebattle current owner;11 begins after scene is acknowledged |
| browser-steel-loss | 0–1 | all→1 | wrapper2004 → b01p02a g21 displayed wakeup after cold STOP |
| browser-steel-departure | 0–1 | all→silence | native boss-faint STOP638; independent browser departure staging |
| browser-steel-crossing | 0–3 | all→114 | wrapper2017 → d03p02 g1 |
| browser-steel-thanks | 0–1 | all→103 | wrapper2018 → b01p01a g28 |
| browser-steel-home | 0–1 | 0→103;1→silence | g28 final partner response then fade; browser final inside/save line collapses post-fade |
| browser-steel-return-bridge | 0 | 0→silence | explicit bridge after boss-faint STOP and before d03p02 request114 |
| browser-steel-quiet-summit | 0 | 0→114 | qualified retry after completion returning to postfight gap end-room owner; if producer cannot prove that owner, source-gap/silence |
| browser-friends-dream | 0–1 | 0→4;1→1 | wrapper2035–2037: a01p01 g3 → b01p02a g22 |
| browser-friends-morning | 0–1 | all→1 | wrapper2044 → b01p01a g29 initial conversation |
| browser-wigglytuff-welcome | 0–4 | all→7 | known Square7 → g8 proximity → g9; nickname prompt cursor3 retains7 |
| browser-square-wind-request | 0–4 | all→7 | t01p01 g10 |
| browser-friends-rest | 0–1 | all→source-gap → silence | independent browser rest inserted after native wind encounter; requested headers do not establish one native PC for its two prose cursors; do not substitute earlier g29 or remembered Square7 |
| browser-meanies-morning | 0–1 | all→1 | current v20 inside wakeup; wrapper2071 → b01p02a g23 |
| browser-meanies-mailbox | 0–10 | 0→1;1–5→10;6–10→silence | current v21 expanded g30 staging; base1 resumes only AFTER final scene ack, not on Pelipper/closing cursor |
| browser-caterpie-morning | 0–1 | all→1 | wrapper2087 → b01p02a g24; current v24 two-stage morning |
| browser-sinister-request | 0–9 | 0→1;1–2→silence;3–7→10;8–9→silence | current v24 g31 ten-stage greeting, arrival/request, confrontation, departure/reassurance |
| browser-steel-ordinary-empty-summit | 0–1 | all→114 | actual ordinary9F floor table0→114; POSTSTORY deletes fixed actors and does not request11. Require current ordinary Steel9F session owner; otherwise source-gap/silence |

Night-line splits are deliberately declared here so a reload directly into the browser night cursor can reconstruct silence, instead of replaying an earlier song from a remembered session. They must be documented as original staging in production provenance. A writer who chooses to preserve source music through every still-active native actor dialog may use1/103 through that last cursor and silence only at the exact completed scene owner; that is a **different explicit overlay decision**, not an inferred original native timing. Do not silently mix the two models.

## Ground/context joins after scenes

Current normal base exterior/inside can request1 when it has an independently qualified ordinary input owner (b01p01a normal enter240 / b01p02a normal enter78). Square/Post Office ordinary input can request7 (t01p01 enter332 / t01p03 enter154). A map name alone cannot erase a currently active scene/silent result owner or identify a collapsed native scene's continuation PC.

Explicit quiet continuation examples reconstruct from current saved owners: founded team MAIN(3,0) after `browser-team-name-celebration` completion before deliberate `beginMorning`; first-request-complete story MAIN(4,0) inside after the evening completion; Steel complete MAIN(5,0) inside after `browser-steel-home` completion before the next deliberate friends beginning. Their terminal browser pause preserves the native preceding station's completed fade, so request silence. Require the real current story/phase/scene completion receipt combination, not "latest seen scene" heuristics. Other current ordinary input stops that actually load normal enter can request their explicit normal owner1/7.

Awakening meadow free movement is original browser staging while native d01p01 would go directly from completed actor/fade to NEXT_DUNGEON. It has no independent normal-map music command: after awakening and on failed Tiny return request explicit silence/source-gap as applicable; never infer10/101 from meadow alone. Unbound title→43 and quiz→12 need actual composition-owned presentation tokens/draft state; neither is inferred from an unrelated dormant save. Native opening46 is not a fallback for the current title.

Friend Area normal owner joins and result scenes remain writer-owned source gaps unless tied to their exact existing manifest/native request. Do not guess from "forest", "boss", habitat prose, or the last selected song. `MUS_DUNGEON_FAIL/COMPLETE` are sourced exact dungeon-result functions at dungeon_music.c62–77, but an arbitrary pendingResult (move learning, reward choice or story ack) is not proof that those functions' owner is active.

For an actual ordinary dungeon, use the current validated generation `parameters.bgMusic` as a floor-table index, then convert through all76entries. Native override order is bossSongIndex != STOP_BGM → thief18 → triggered monsterhouse128 → shop17 → queued ordinary song (dungeon_music.c145–165). Match only fields actually represented/owned in the current producer. Active Steel fighting11, first/retry pending prebattle114, defeated departure silence, ordinary empty9F114 are separate complete-state owners, even when a session remains attached to a paused scene. No arbitrary "boss location means11" shortcut.

## Ground modifier qualification

Macros in `include/data_script.h:207–215` encode SWITCH/FADEIN/QUEUE with argByte0. Thus ground_script.c2185–2208 actually calls GroundScriptModifyBGM; STOP2210–2212 and FADEOUT2214–2216 do not bypass into a new direct song.

Exact modifier order at ground_script.c4261–4274:

1. `sub_8098F88()` true returns requested BGM unchanged.
2. Requested blank50 remains50.
3. Failed `QUEST_UNK12` returns STOP999.
4. `QUEST_IN_WORLD_CALAMITY` returns19.
5. Non1 request passes through;1 returns `MUS_RESCUE_TEAM_BASE` after an unused BASE_LEVEL read.

`event_flag.c845–848`: quest12 is false exactly MAIN(11,2)/(11,3); calamity is true exactly MAIN(16,2). All current MAIN chapters0–5 leave the direct scene joins unchanged irrespective of the bypass flag. Future chapter support requires its own explicit guard provenance rather than claiming current source mapping already covers it.

`ground_main.c666–669` returns private `sUnknown_20398B9`; this is not proven equal to browser `progress.native.scalars.scriptMode` / native `GetScriptMode`. Do not incorrectly join those two fields. At current chapters this distinction cannot change any row. Silence/blank/source-gap are not replaced by calamity or a normal-location fallback. Dungeon cutscene DungeonStartNewBGM is not a ground macro and must not receive invented ground-only guards.

## Source hashes

Reproduce by reading each blob with `git show 6bcbec4f906938c0243aa2026bcbd41b577bab85:<path>` and applying SHA-256 to the exact bytes. No build/native execution is needed.

| Native pinned file | SHA-256 |
| --- | --- |
| `src/data/ground/ground_data_s01_station.h` | `8c3aeab27c6105e6a7d16debf596d7c47fa50bf908585e2bd92e5228dbbd6e6c` |
| `src/data/ground/ground_data_s02_station.h` | `94c4e84d3c3a8b166cd55417aec5ee4381eb24689292985a75962493dfbdcff0` |
| `src/data/ground/ground_data_t01p01_station.h` | `a4364d126c9b837c787ca951a15a9ebf7ac4a9f700ba73d7b5fbd48c5604988c` |
| `src/data/ground/ground_data_d01p01_station.h` | `351bfc18160008658cbb67a4347c8a586e02b3e67efa64935dd80758470d4738` |
| `src/data/ground/ground_data_d02p01_station.h` | `0b6ad991c5d91f8bb11befca7d4334a6bfb9af87946352269c950d03542efcc1` |
| `src/data/ground/ground_data_d03p01_station.h` | `8b1b439bf7774de128ed7b17805f9b9b81e4a29a714893a0c31e965ac10e3c13` |
| `src/data/ground/ground_data_b01p01a_station.h` | `ff76c6663176eec864165e6d8c933f4de144f5415c1262535e2842d15632897f` |
| `src/data/ground/ground_data_b01p02a_station.h` | `9f4ea54ddc8ac4b6d7de7d6481b88b7d201f31fd61c1a350490908158409db35` |
| `src/data/ground/ground_data_d01p02_station.h` | `d6e8be002e0c1ad938fd2fcd3fe1d69a3ac0fac64b88fe6e61fcec829034e1cd` |
| `src/data/ground/ground_data_d02p02_station.h` | `80c73654bb7f403fa20bbc4aefd5452fc54c28095b2b2668ac1552a7e3c9e2fd` |
| `src/data/ground/ground_data_d03p02_station.h` | `e09c9e8ea74a262482c8ded065ccfa1783685997009b1d4c836dbed10c697017` |
| `src/data/ground/ground_data_a01p01_station.h` | `2c2fabeb7e6b86e7211c055765823a75bad09d722da7a4ff7bab4772fc3cee82` |
| `src/data/ground/ground_data_t01p03_station.h` | `ca12d04d0fca77cee7471fa6b3e9f5efb09621a4978fab6dd31cb5fb1e2a4b5f` |
| `src/data/ground/ground_event_data.h` | `fbc968f4d9c23c836f5047dd6e894515508d17eeec2c61b9a5e6ba7a9b56af62` |
| `include/data_script.h` | `54bbf45f8f29b3037ef8043d739f3243e33a84ea7788fc13bd7f122882b1b01c` |
| `include/constants/bg_music.h` | `ed93c5bf5c9e1cf7c0b4bec0e0a58acd243e448ab1288ec07315bc8c1ae218eb` |
| `src/ground_script.c` | `c457af6617ca0e9edc8efc59ffd0ec8df8e012ccafc4f3beffb97b066eb906f3` |
| `src/event_flag.c` | `1726f2e121b7f15a1ab4f2a30c2a0b45ebe088364cb37e01d9bbdbeae42c7f5e` |
| `src/ground_main.c` | `4f782dae4947be39c34b0230360382d0cc13540926570531231b96a37585b411` |
| `src/dungeon_cutscene.c` | `1ef9c15a9ddb6463404f962d18f5890f23e4845d97d043af9c614becad436252` |
| `src/dungeon_cutscene_skarmory.c` | `0aa469f6a3b258cbdc8fde22cbc4d87c1e247dc1c6699bd755ba8031ffdd0fe6` |
| `src/dungeon_config.c` | `e1d24abb5eab54a2223449c9e5b7e98aba55244e87fadb13c1dd1811b496c21b` |
| `src/run_dungeon.c` | `6cc792aa349add7f72cd04694d703c1612cacef8681ef7fae840f392908a5d90` |
| `src/dungeon_music.c` | `f95d69b029602aab24d3b29ff8f5e910a8a9b819539c450c051c0503ea1469e6` |

| Browser file (relative to games/pokemon-dungeon-reimagined) | SHA-256 of inspected bytes |
| --- | --- |
| `content/authored/opening.js` | `a618aed50a51c024d43b3ddbb5ebbfbb23635f0b836ec8095528f04932f2a44c` |
| `content/authored/team-formation.js` | `5b192ec8bee5825796fb22d3a533c4b5325fdcd38d363b01ef5e6a16681a90a4` |
| `content/authored/first-morning.js` | `c7ed5d0bde75bf122066c02bbbf67d9b07a29304e9013b7f249f75e171c0a08c` |
| `content/authored/thunderwave.js` | `a5d9b9c7620443ca68a06fffc2d253b21efb9e461c26d340186064781e24be62` |
| `content/authored/town.js` | `50765d7f5732d3eca5c9de2bc9f9e66f6d7b15dc8a6c85555a5a08ae3ebafa48` |
| `content/authored/early-work.js` | `98ea8f886c1c39d4a13ec1f531fbe75a34c3681e35a0186767dd7a603db57904` |
| `content/authored/mt-steel.js` | `207919e0c9c2fa7f780bdff6634da774f37dc31a294210071eba2d4b44f7d140` |
| `content/authored/friends.js` | `1e4c68deb2477145be83d037b14d3eee4738cf6d8cf753fa8fbfb20e84d472fd` |
| `content/authored/chapter-work.js` | `c638a694bb80fc8c2d666896b4adc3a42b8366bab4c31955250a8602e809a350` |
| `content/authored/steel-meanies.js` | `0a15a77a5625b14fc22ca7330ffcecfb6e3c607e5769c57b1fc7bcb90f558eba` |
| `src/domain/gameplay/scenes.js` | `a6605b34be9a77b1dbe790306623b788717e7ccdc8f3d14a40c68ee88feeed42` |
| `src/domain/gameplay/steel.js` | `aef1ce374f996b10b262a6291abbf1340d57f9fe0fe1cdb579bf99f57d8e7a5c` |
| `src/domain/gameplay/friends.js` | `bb520a26c8f018d171c87bc16034b309cf9d6314516db7fbc3779ab64bbb33e0` |
| `src/domain/gameplay/steel-meanies-scenes.js` | `5e2623249591558df1f2d8212af0002cf2b2de56617193406360547d8ff200dd` |

## Integration handoff boundaries

This file supplies music requests/provenance only. Domain/event producers remain with the writer: real leader displacement, visible miss and precisely source-qualified messages are the currently admitted small effect scope. Nothing here authorizes interpreting generic conditionChanged/itemChanged/attackResolved as damage, pickup, use, victory or reward without a precise current owner.

Writer integration must preserve saved scene/cursor, pending continuation/result/learning ownership (including v24 learning-continuing), revision/event admission and transient UI/iframe gesture ownership. No music selection mutates any game state or advances scene, turn, RNG, day, save, quest or event clocks. Source-gap/silent rows are explicit degradations, not claims that all current native PCs have been reproduced. Root owns final immutable integration review and publication; human audition remains separate.

## Live v24 port qualification

The selected authored owner is now `content/authored/escort-work.js`, which
overrides the two old `friends.js` Caterpie scenes. Its two inside24 stages
retain the base request1 after the cold prologue. The ten outside31 stages map
to the actual source order: greeting0 uses1; Caterpie arrival/request1–2 use
silence after native line4213 FADEOUT; rivals3–7 use10 from line4253; departure
and reassurance8–9 use silence after line4331 FADEOUT. After the final real ACK,
the actual group32/base ground uses1, matching CALL_STATION32/FADEIN1 at4163–4164.
These are immediate requests at original browser stage boundaries; native
frame/fade timing is not reproduced. Dialogue remains original browser writing.

Current v24 command registration is in `escort-commands.js`; the original
`commands.js`, all predecessor factories and schema remain frozen. Shared
retained-menu rebuilding preserves the real work-two and Caterpie-ready exits,
the selected roster1–3 plus temporary guest, and scene-origin saved learning.
The live audio port requires its own independent review. Original score/device
audition, Blue binary parity and full-game acceptance remain open.
