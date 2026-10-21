# Roux menu and sprite review — 2026-10-21

These are **static asset compositions**, not browser screenshots or gameplay
captures. Game modules and native game code were not imported or executed.

| Image | Dimensions | Bytes | Contents |
| --- | --- | ---: | --- |
| [Before / after](before-after.png) | 1584×1296 | 30,050 | Matching new-save menus, with New Game selected, enlarged three times. |
| [Current menu](menu-after.png) | 768×1224 | 22,853 | Current title/menu composition with its static-preview label. |
| [Sprite review](sprite-review.png) | 1280×1600 | 112,010 | Shipped body poses, four portrait expressions and status attachment placements. |

The **before** column uses baseline
`c089ac58e3feda52ea2a909003c935fede294114`: its brown title/menu backgrounds,
source-sized native blue windows, native glyph/cursor masks, and first idle
gameplay frame enlarged two times without a shadow. Geometry, colors, text,
clipping and frame offsets were transcribed from that revision's `render-ui-art`,
`render-menus`, font, UI and sprite source files, read only as text. Generated
data literals were parsed with `JSON.parse`; PNG and character metadata were
decoded as inert assets. This reconstructs the selected static state rather than
establishing browser rendering or animation timing.

The **after** column uses the current PNGs and the menu geometry transcribed into
the offline preview. Its dedicated title avatar comes directly from the approved
larger concept A front/rest source using one uniform scale, instead of enlarging
the gameplay atlas. Source URLs, pinned hashes, crop and rights qualifications
remain in the [menu source note](../../../tools/pokemon-dungeon/reference/roux-menu.md)
and [generated manifest](../../../games/pokemon-dungeon-reimagined/assets/roux/menu-manifest.json).

`sprite-review.png` is an unchanged copy of the final generated
`/workspace/roux-sprite-review.png` review artifact. It shows static artwork and
attachment positions; it does not establish animation playback or gameplay
acceptance. Its SHA-256 is
`61366c9a402f9640eb54f0daa9e8a44ff6e8cc79d6186ae2f3687377ce83cac2`.

Visual inspection found legible labels/helper text and no title-avatar, banner
or frame overlap/clipping in the composed state. The comparison generator,
cached baseline blobs and detailed source/output hashes remain under ignored
`tools/pokemon-dungeon/.work/roux-menu/`; they are not runtime dependencies or
part of the game distribution. Original source assets were preserved.
