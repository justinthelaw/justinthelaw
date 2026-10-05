# Species and form authoring inventory

These catalogs are P02 identity inventories, not runtime content or completed
PMD species records. `sourceStatus: supported` covers identity and the limited
classification identified by `provenanceSources.fieldScope`. Every record is
`unstarted` / `pending`; each record's `blockerIds` references shared
`blockerDefinitions` with explicit fields and reasons. Field-specific variants
of the same research issue use distinct definition IDs.

| File / record kind | Count | Boundary |
| --- | ---: | --- |
| `species.json` / species | 386 | National Dex 001–386; generations 151 + 100 + 135 |
| `forms.json` / Unown forms | 28 | A–Z, `!`, `?`; one species |
| `forms.json` / Castform forms | 4 | Normal, Sunny, Rainy, Snowy; one species |
| `forms.json` / Deoxys forms | 4 | Normal, Attack, Defense, Speed; one species |
| `forms.json` / NPC identity exceptions | 2 | Munchlax and the purple Kecleon shopkeeper |

## Evidence

`G1` and `T1` point to DATA.md's source register. Species names are copied from
its checked-in Appendix A identity ledger, derived from the pinned PokéAPI
names/species input. No upstream CSV was downloaded or main-series statistics
imported. Generation follows the ledger's stated National Dex boundaries.
Slugs are authoring keys; they do not assert original game spellings.

`G6`, `G7`, `G8` and P01's `systems:shops` were rechecked on 2026-10-05 at the
URLs and original-edition subsections recorded in `forms.json`. G7 supports
distinct recruitable Unown search identities. G8 supports four Deoxys forms,
Normal appearance outside dungeons, and form selection on new floors. Those
facts do not establish a complete transition or learnset implementation.
G6 establishes Munchlax as an unobtainable Square cameo. `systems:shops`
establishes the purple Kecleon Wares merchant in the originals.

### P02-S-UNOWN

[Unown](https://bulbapedia.bulbagarden.net/wiki/Unown_(Pok%C3%A9mon)), Biology /
Forms and Game data / Form data, retrieved 2026-10-05: labels A–Z plus the two
punctuation shapes. This supplies label vocabulary alongside G7's original
game inclusion; core-series personality-value rules are not imported.

### P02-S-CASTFORM

[Castform](https://bulbapedia.bulbagarden.net/wiki/Castform_(Pok%C3%A9mon)), Side
game data / Normal, Sunny Form, Rainy Form and Snowy Form, retrieved 2026-10-05:
each subsection explicitly includes a Red and Blue Rescue Team table. Only
the four identity labels are consumed.

### P02-S-FORECAST

[Forecast](https://bulbapedia.bulbagarden.net/wiki/Forecast_(Ability)), In other
games / Pokémon Mystery Dungeon series, retrieved 2026-10-05: the original
Red/Blue paragraphs distinguish type changes from Castform appearance changes
and identify a fog exception. This supports the weather-associated form
family, not a full timing, suppression or weather transition program.

## Contract and remaining work

- Every `speciesId` on a form resolves to the 386-species catalog. Each species
  lists its explicit `formIds`; the other 383 species use `formId: null` for
  ordinary appearance. This authoring convention does not decide P07's save
  schema or create 383 named default forms.
- `persistent` identifies separately collected Unown identities. `temporary`
  identifies changeable Castform/Deoxys forms, including their Normal states;
  it does not specify duration or serialization. All `transitionRuleId` values
  are explicitly unbound. P07 must distinguish a validated not-applicable
  transition from an unresolved one before runtime projection.
- Munchlax has `speciesId: null` because it is outside the collectible catalog;
  it is not species 387. Purple Kecleon references `pokemon-352` with no form
  ID: its story appearance is not an extra collectible species or form.
  These two exceptions do not enumerate the whole town/campaign cast.
- P17 owns collectible roster integration; P13–P14 still own combat data and
  learning/abilities. Castform's form behavior belongs to P14 with P15 weather;
  P20 owns the NPC events. P32 owns assets for every entry. No asset or
  acceptance evidence is claimed by these catalogs.
- DATA-01/02/04/05/06/07 and `P02-SPECIES-CROSSWALK` remain for original stats,
  EXP, learning, abilities, recruitment, movement/size, Friend Areas,
  evolution, encounters, indices, localized spellings and types. Verify
  original-specific tables per field before binding records. DATA-03 also
  blocks Deoxys learning and precise form effects (the catalog IDs
  `DATA-03-species-learning-effects` and `DATA-03-deoxys-form-bindings` identify
  its distinct field scopes); neither FRLG form learnsets
  nor guessed floor-selection probabilities supply those facts.
- Spinda pattern state, gender presentation, transformed Ditto, other story
  appearances and decorative later-generation statues still need explicit
  classification. No additional form is inferred from modern catalogs.
  Audit original visuals and source records before expanding form/actor IDs.
- Source locators identify checked-in evidence plus live subsection locations;
  they are not immutable web snapshots or independent primary-source proof.
  Complete Blue/regional and internal-index verification remains P01/P33 work.

Static verification may parse these JSON files, compare the checked-in names,
and check IDs, references and schema. It must not import or execute game code.
