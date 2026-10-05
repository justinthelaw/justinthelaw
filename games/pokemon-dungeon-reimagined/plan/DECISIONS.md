# Recorded decisions

Justin approved all recommendations except the design recommendation on
**2026-10-04**, selecting **B: bold cel-shaded 3D**. All current product choices
are resolved. Justin later authorized implementation on the same date;
merge, deployment and arcade activation remain subject to release approval.

## Binding choices

| ID | Decision | Approved selection and consequence |
| --- | --- | --- |
| D01 | Reference edition | Original Nintendo DS **Blue Rescue Team**; Red is comparative research only, with no edition selector |
| D02 | Fidelity research | Research obligation: preserve full scope, resolve source-backed numerical data, and never label guessed values or generic proxies complete |
| D03 | Visual direction | **B: bold cel-shaded 3D**, locked `style-b-v1`. Candidate B is the selected future cavern loading background; A remains an archived comparison. The 2026-10-05 continuation accepts the shown P06 scene/motion-study direction; full clip/rig/device and P10 quality review remain |
| D04 | Blue hardware/network and historic events | **Browser equivalents:** static rescue codes/file exchange, equivalents for Blue's extra modes, and labeled archived event expeditions preserving their content/progression. Original cartridge interoperability is not a completion gate; claim it only where sourced and demonstrably verified |
| D05 | Manual game acceptance | **Allow human play and visual review.** All automated tests that import/execute game source remain prohibited; website tests use inert fixtures. The separate implementation-start instruction was received on 2026-10-04 |
| D06 | Standalone Groudon practice | **Omit it.** Keep the original campaign route and take the final arcade screenshot from actual campaign play |
| D07 | Release cadence | Keep runtime off `main` until the full release gate and explicit publication authorization; a disabled Play button does not hide the direct game URL |
| D08 | Source language | **JavaScript with JSDoc and strict independent static type checks:** directly served ES modules; authoring tools outside `games/` |

## Selected generated asset

| Asset | Status and intended use | File |
| --- | --- | --- |
| B — bold cel-shaded 3D | Selected future cavern chapter/loading background and reference for broad shapes, graphic shading and strong silhouettes | [b-cel-shaded-cavern.webp](art-candidates/b-cel-shaded-cavern.webp) |
| A — cinematic stylized 3D | Archived comparison; excluded from the selected style and future runtime asset manifest | [a-cinematic-cavern.webp](art-candidates/a-cinematic-cavern.webp) |

### B — selected

![Selected B: graphic volcanic cavern with broad shading and saturated depth](art-candidates/b-cel-shaded-cavern.webp)

### A — archived comparison

![Archived A: cinematic basalt cavern with warm lava bounce light](art-candidates/a-cinematic-cavern.webp)

- Both images are actual **1536 × 1024 raster loading illustrations**, generated and encoded as WebP; neither is a 3D model or gameplay screenshot.
- After implementation is separately authorized, copy B unchanged into the future local asset manifest. Selecting B does not begin that work.
- Earlier character-art requests were rejected by the image service; these successful images depict original empty environments. Character appearance, rigs, animation and browser rendering remain future authored work.
- Exact [prompts](art-candidates/PROMPTS.md) and [provenance/hashes](art-candidates/provenance.json) remain with the files.
- The final arcade preview must show actual Groudon campaign gameplay, not either loading illustration.

## Other settled requirements

| Item | Recorded requirement |
| --- | --- |
| Tactical overlay | Player-toggleable explored-map/selected-move-range overlay, initially closed, always available through Map; respects knowledge masks and consumes no turn |
| Browser saving | One current campaign with primary/backup recovery, automatic checkpoints after complete canonical state transactions, manual save/export and explicit backup recovery; SYSTEMS S03 defines the fixed platform adaptation, with no strict cartridge quicksave mode |
| Touch controls | Semi-transparent emulator-style controls on the lower half, with accessible show/hide and keyboard alternatives |
| Asset generation | Consistent master prompts and approved references; bulk sheets with explicit grids, verified cropping and provenance, following ASSET-PIPELINE.md |
| Packaging | A static game folder is allowed; future entry is `games/pokemon-dungeon-reimagined/index.html` |
| Execution authorization | Planning PR #387 merged; Justin separately authorized implementation on 2026-10-04. Resume the first incomplete dependency-ready package; preserve later quality/release gates |
| Documentation | Full plan stays in this game's `plan/`; parent `games/README.md` uses headings, tables and bullets for the arcade/live/WIP catalog; root README stays unchanged |
| Quality | DRY/SOLID; thorough website tests with inert game fixtures; no automated game-source tests |

## Research owned by the implementer

- Exact Blue stat/growth, move/effect, encounter, recruitment and legacy-code data.
- Source conflicts, original floor/scene semantics, trigger timing and form rules.
- Asset provenance, browser budgets, accessibility/input implementation and static tooling.
- Owners and blocking gates: [DATA.md](DATA.md), [CAMPAIGN.md](CAMPAIGN.md), [SYSTEMS.md](SYSTEMS.md) and [RESEARCH.md](RESEARCH.md).
- These are factual/engineering obligations, not requests for Justin to supply cartridge facts or choose arbitrary numbers.

## Later review checkpoints

1. Completed: Justin authorized moving past planning on 2026-10-04; record accepted package evidence in PROGRESS.md.
2. Review actual authored characters, animation and a rendered 3D quality slice at P06/P10 before mass asset production; the selected loading image does not satisfy that gate.
3. Review the complete P37 release and obtain explicit merge/deployment authorization.

See [PLAN.md](PLAN.md) for package order and [PROGRESS.md](PROGRESS.md) for the
current execution state and remaining gates. Do not ask the resolved product choices again.
