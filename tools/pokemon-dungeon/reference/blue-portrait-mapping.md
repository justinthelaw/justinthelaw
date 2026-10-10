# Opening portrait and thought presentation

The browser story uses original wording and combines some original beats. This
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
| Enter | normal, normal |
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
