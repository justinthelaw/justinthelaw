import { freezeData } from '../../src/domain/state/validate.js';
/** Exact comparative source provenance; browser RNG remains separately qualified. */
export const MOVE_LEARNING_FACTS = freezeData({
  "commit": "6bcbec4f906938c0243aa2026bcbd41b577bab85",
  "qualification": "pinned-red-comparative-not-blue-binary-proof",
  "maxCandidates": 16,
  "ultimateIq": 333,
  "sourceFiles": [
    {
      "path": "src/dungeon_leveling.c",
      "sha256": "d7cab87c271db8bcc9f83a53625ba6cb5a860d717510f21eebd596fbcd581476",
      "locators": "AddExpPoints49–66; EnemyEvolution89–132; LevelUp369–466; sub_8072778 558–626"
    },
    {
      "path": "src/pokemon.c",
      "sha256": "ca46804becf408ad3a3a8cad21d7ac16309b2e43fd80bf4945a29951b66aa58b",
      "locators": "GetMovesLearnedAtLevel1062–1104"
    },
    {
      "path": "src/moves.c",
      "sha256": "bc1ed7fe1cbdeb2fd294c1329913b158b9c1365538f547f177877968dd345916",
      "locators": "InitPokemonMove114–121; unk_CopyMoves4To8AndClearFlag2Unk4 1419–1439"
    },
    {
      "path": "src/dungeon_menu_moves.c",
      "sha256": "94035a3ead7f2faf4608abb4c44706bb2a137354269a1732bde35cc45e988e92",
      "locators": "confirmed selected+linked-tail deletion1047–1055; compaction1060–1078"
    },
    {
      "path": "src/dungeon_data.c",
      "sha256": "ca56c6807cb1a2918e9fee4bf4f8410fbde21ad52e3bcbfdffaa6d5766af66b4",
      "locators": "four actual ultimate IQ thresholds504–507"
    }
  ]
});
