# Opening portrait and thought presentation

The browser story uses authored wording and combines some original beats. This
mapping follows the nearest corresponding portrait instructions in the pinned
[Red Rescue Team ground source](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground).
It establishes the intended emotions, not exact script or timing equivalence.

Starter portrait slots are 0 normal, 1 happy, 4 worried, 9 determined (the
downloaded file calls this `special`), 10 joyous, 11 inspired and 12 shocked.
Caterpie uses its own three slots: 0 normal, 1 inspired and 2 sad/teary-eyed.
The ground instructions access its extra slots with `0x41` and `0x42`.
Butterfree has only a normal portrait; do not invent a worried variant.

The arrays below correspond to the current browser story's zero-based lines.
`none` means no portrait is shown.

| Phase | Emotions in line order |
| --- | --- |
| Awakening | none, none, normal, normal, normal, normal, worried, shocked, worried |
| Named | joyous, worried, none, normal |
| Trouble | normal, normal, shocked, normal, normal, normal |
| Clearing | teary-eyed, normal, teary-eyed, normal, normal, normal |
| Reunion | normal, normal, normal, special, normal, none, inspired, happy, normal, happy |

The original hero's internal reactions use `MSG_QUIET`: retain the portrait but
omit the speaker-name prefix for awakening lines 5 and 7, named line 1 and reunion
line 7. The opening dreams have neither a name nor portrait. The first offscreen
cry, corresponding to named line 2, is `MSG_NPC(-1)` and likewise has no name or
portrait; Butterfree's portrait begins after she arrives.

Pixel checks provide direct Blue corroboration beyond the comparative source.
The native Butterfree normal portrait matches all 1,600 pixels in the original
Blue press screenshot `ss02` at lower-screen (64,24), and Pikachu's inspired
portrait matches all 1,600 pixels in `ss04` at (24,80), after the documented DS
display color expansion. The source screenshots and URL/hash inventory are in
`art/blue/native-reference`; checks are recorded in
`portrait-pixel-corroboration.json`. Portrait positions do not receive the world
camera's (1,12) offset.

## Runtime selection

The browser ships 89 portraits while all 213 source images and both Blue pixel
proofs remain offline. Every hero retains normal, happy, worried and shocked;
the ten partner-pool species additionally retain joyous and special. Caterpie
retains its three portraits, Butterfree normal remains, and Pelipper normal is
kept so every existing fallback survives. No saved field or user input supplies
another emotion. Runtime portrait lookup and its aliases are unchanged.

The original awakening, retry, rescue and reunion scripts contain 38 portrait
commands covering the same 88 requested records. The extra raw sprite −2 command
explicitly clears the portrait. Twelve called/common helpers add no portrait;
ordinary dungeon Talk, level-up and tutorial messages pass none. Native role
lookups preserve the sixteen-hero/ten-partner identities across retries.

The exporter verifies and decodes the complete source inventory, including the
omitted Pikachu-inspired image, before emitting the selected atlas. An independent
checker requires the exact 89-key coverage and all nineteen normal fallbacks.
The selection proof preserved all 142,400 retained crop pixels in the 320x480
atlas and reduced decoded RGBA by 768,000 bytes. Current encoded sizes belong
to the asset manifest; later lossless PNG optimization superseded old byte counts.
The movement-only Enter gate has no dialogue portrait row. Source/pixel proofs
do not establish complete Blue script or timing parity.
