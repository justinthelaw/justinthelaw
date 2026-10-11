# Original Blue ground-scene ordering

Three transient movement gates preserve the visible order around the awakening
and Tiny Woods rescue. They use the pause-aware foreground clock and do not add
save fields. Reduced motion preserves each full interval while drawing actors at
their settled positions.

The timing and waypoints come from pinned comparative Red commit
`013475aa04f5be3191e5527c186d9bfceae7cae0`. They are not proof of exact Blue DS
frame duration. Dialogue remains an authored adaptation.

## Butterfree arrival — `named:3`

The offscreen cry remains `named:2`. Advancing saves `named:3`, clears input and
withholds the partner's reply for 172 nominal frames: Butterfree's eight
`WALK_GRID(256, ...)` commands take 152 ticks including their completion checks,
followed by a 20-tick settled hold. The source admits Butterfree only after the
cry and partner reaction, walks links 0–7, coordinates the actor cues, and waits
before the partner asks what is wrong
([player script lines 195–221](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h#L195-L221),
[Butterfree lines 327–348](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h#L327-L348),
[links 0–7](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h#L812-L820)).

The original Blue video independently shows the cry at 6:20, an empty text box
at 6:21, the approach at 6:22, both rescuers settled at 6:23, and the partner's
reply at 6:24. These sparse observations establish order, not frame equivalence.

## Tiny Woods departure — `enter:0`

After the partner resolves to help, the browser uses a 120-frame movement-only
entry. The two actors follow the separate westbound link sequences at comparative
speed 384 before B1F is created. The native player path is links 8–10 and the
partner path is links 11–13
([player lines 248–259](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h#L248-L259),
[partner lines 316–324](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h#L316-L324),
[links 8–13](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h#L821-L826)).
The source proceeds directly to the dungeon without a rescue-choice menu.

## Caterpie clearing — `clearing:1`

After Caterpie's opening cry, the browser withholds line 1 for 148 frames: a
30-frame wait, the existing 88-frame rescuers' walk, and a 30-frame settled
wait. The comparative end-room script clears Caterpie's text, waits, cues both
rescuers to walk, waits again, and only then begins the partner's reply
([player lines 39–68](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p02_station.h#L39-L68),
[partner lines 79–85](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p02_station.h#L79-L85)).
The Blue video shows the same cry, empty, walk, settle, reply order at 6:20–6:24.

## Save and presentation boundaries

The gates are reconstructed from their saved boundaries on Continue. Historical
`help-choice:0` and `enter:0/1` checkpoints are admitted and normalized to the
movement-only `enter:0`; `named:3` and `clearing:1` retain their existing line
indices. Input ownership is cleared at each gate's start and end. Hidden,
unfocused, loading and Help time does not advance the foreground clock.

Hero naming and its confirmation retain the Tiny Woods ground/map backdrop,
while pre-adventure partner naming and confirmation retain the personality-test
aura. The Blue video directly shows the ground/map behind the hero keyboard at
2:30. The recorded observations are preserved in
`.work/blue-ready-20261011/source-video/root-observations.json`.

These source and video checks do not establish complete commercial-dialogue
parity or manual acceptance of the current candidate gates.
