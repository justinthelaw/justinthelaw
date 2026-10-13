# Arcade player guide

The playable card is **Pokémon Mystery Dungeon: Roux's Adventure**. It starts
at the menu and keeps the personality test, partner selection, three Tiny Woods
floors, Caterpie's reunion and the rescue reward. The other
two cards say "Coming soon". Later chapters are not included.

Choose the naughty or energetic quiz answers to lean toward Roux. The final
treat question always appears: **Blueberries, chicken, and bananas!** recommends
Roux. You can also choose **Play as Roux** beside any original quiz result.
All sixteen original heroes and the original partner choices remain available.

Roux is a non-evolving Normal/Ground Pokémon with Pickup and Keen Eye. He starts
with Bite and Growl, learns Dig at level 6, and gains a mix of canine and Ground
moves. Dig takes two turns and one PP; he is underground until his next action.
Pickup has one 20% chance to find an Oran or Pecha Berry on entering a floor when
his held-item slot is empty. Full growth supports retries through level 100.

| Action | Keyboard |
| --- | --- |
| Move | Arrow keys; two arrows or numpad for diagonals |
| Confirm / regular attack | Z or A |
| Cancel / menu | X or B; Enter or Escape also opens the menu |
| Run | Hold X/B with a direction |
| Face without moving | Hold C/Y with a direction |
| Map | Shift or S |
| Wait | Space, or A+B |
| Use set move | Hold Q and press Z/A |
| Diagonal-only movement | Hold R with directions |

Controls are implemented in `pokemon-dungeon-reimagined/src/blue/input.js`.
The website also offers a touch overlay. Naming fields retain text entry;
the game handles confirmation and validation.
