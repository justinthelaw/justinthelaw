# Light Screen and the shared Reflect effect

The retained learners are Pikachu at level 50 and Chikorita at level 36. These
levels remain reachable through repeated Tiny Woods attempts. The reference is
comparative Red source at `013475aa04f5be3191e5527c186d9bfceae7cae0`; exact Blue
engine, image and sound parity remains unverified.

Light Screen targets its user and shares one status slot with Reflect and
Counter. Fresh applications replace that slot; duplicates emit their result
without drawing another timer. Light Screen stores 11–12 opportunities. The
three application helpers create no bitmap and do not drain an existing effect.
The ordinary move target effect is a separate owner, so duplicate use can still
show effect 319. Existing Reflect and Counter save keys remain valid; a new
Light Screen state cannot coexist with them or belong to another learner.

Ordinary damage halves the special modifier for Light Screen and the physical
modifier for Reflect. Both request effect 369 during damage calculation, before
the second accuracy check and after applicable ability announcements. A later
miss does not undo that request. Early one-damage exceptions and direct-HP moves
bypass it. Both callers first drain existing effects; Light Screen then waits
for its new effect, while Reflect returns with that effect still running. The
100-update loop is a maximum wait, not a fixed animation length.

Effect 319 uses file 6, animation 0, palette 10 and sequence 851. Effect 369 uses
file 0, animation 17, palette 10 and sequence 890. The yellow shield is the existing
status strip rendered with palette 3 and bit 10. Earlier effect/status pixels
and timing were preserved at admission; current inventories belong to
[battle visuals](blue-battle-visuals.md) and [status indicators](blue-status-effects.md).

Sequence 851 has two notes ending at PCM frame 32 and reuses wave 110. Sequence
890 has one wave-44 note starting at frame 2 and ending at frame 24, including
release; its FINE frame is 10. It can outlast the ten-tick defense bitmap. The
controller retains separate rejection bounds of two application requests and
74 shared Reflect/Light Screen defense requests per result. Existing voice
limits remain 15 for SE5, five for SE6, and 32 shared. Those bounds do not assert
that every competing sound will be audible.

Static source, type, data, pixel-preservation and distribution checks cover this
increment. A manual high-level playthrough and exact Blue sound audition have
not been performed.

Owning pinned sources:
[status handlers](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/move_orb_effects_4.c),
[damage order](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_damage.c),
[effect helpers](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_8041AD0.c),
and [effect definitions](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/effect_data.c).
