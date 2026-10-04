# Decisions for Justin

**Blue Rescue Team is fixed.** The original Nintendo DS game is the baseline;
Red Rescue Team is comparative research only. There is no edition selector.

Five choices remain. Recommendations below are proposals, not approvals.

## Choices needing input

| ID | Choice | Recommendation | Alternative and consequence |
| --- | --- | --- | --- |
| D03 | Visual direction | **A: cinematic stylized 3D.** Use candidate A as the future cavern loading background and target its lighting/material treatment for the 3D art review. | **B: bold cel-shaded 3D.** Use candidate B, with cleaner material shapes and stronger graphic separation. Either choice still needs actual character/model and browser-scene approval at P06/P10. |
| D04 | Blue hardware/network and historic event access | **Browser equivalents:** static rescue codes/file exchange, browser equivalents for Blue's extra modes, and clearly labeled archived event expeditions, preserving their content and progression. Keep original-code compatibility only where sourced and demonstrable. | **Require cartridge interoperability:** original DS/GBA-compatible exchange becomes a hard completion gate, with additional codec/region research and separately approved verification. Do not promise compatibility before that work. |
| D05 | Manual game acceptance | **Allow human play and visual review.** Keep all automated tests that import/execute game source prohibited; website tests use inert fixtures. | **Static review only:** no game playthrough acceptance. The plan must then label gameplay/performance unverified and revisit its playable-completion gate. |
| D06 | Separate Groudon practice option | **Omit it.** Keep the original campaign route to Groudon and take the final arcade screenshot from actual campaign play. | **Add an optional isolated practice encounter** after P18, with no campaign-save, item, recruitment or unlock changes. This adds scope and never replaces the campaign battle. |
| D08 | Source language | **JavaScript with JSDoc and strict independent static type checks:** directly served ES modules; authoring tools outside `games/`. | **TypeScript:** stronger source syntax with a separate reproducible compilation/output workflow agreed before P04. |

Suggested compact response: `D03 A; D04 browser equivalents; D05 manual review;
D06 omit practice; D08 JavaScript`. Adjust any choice individually.

## Actual generated asset candidates

These are usable **1536 × 1024 loading-background assets**, created with built-in
image generation and encoded as WebP. The selected file will be copied unchanged
into the future local game asset manifest; neither is a 3D model or gameplay capture.

| Candidate | Intended use after selection | File |
| --- | --- | --- |
| A — cinematic stylized 3D | Cavern chapter/loading background; visual reference for detailed basalt and lava bounce light | [a-cinematic-cavern.webp](art-candidates/a-cinematic-cavern.webp) |
| B — bold cel-shaded 3D | Alternative cavern chapter/loading background; visual reference for broad shapes and graphic shading | [b-cel-shaded-cavern.webp](art-candidates/b-cel-shaded-cavern.webp) |

### A — cinematic stylized 3D (recommended)

![Candidate A: cinematic basalt cavern with warm lava bounce light](art-candidates/a-cinematic-cavern.webp)

### B — bold cel-shaded 3D

![Candidate B: graphic volcanic cavern with simpler shading and saturated depth](art-candidates/b-cel-shaded-cavern.webp)

The image service rejected the earlier character-art requests. These successful
candidates show original empty environments; character appearance, rigs and
animation remain a later approval based on actual authored assets, not this art.

Exact [prompts](art-candidates/PROMPTS.md) and [provenance/hashes](art-candidates/provenance.json)
are committed with the files. They must never replace the requested real Groudon
gameplay screenshot on the arcade card.

## Already settled

| Item | Recorded instruction or requirement |
| --- | --- |
| D01: edition | Original Blue Rescue Team, explicitly selected by Justin on 2026-10-04 |
| D02: fidelity research | Full approved scope, source-backed numerical data; no guessed values or generic proxies labeled complete |
| D07: release cadence | Runtime work remains off `main` until the full release gate and explicit publication authorization; disabling Play alone does not hide a direct game URL |
| Touch controls | Semi-transparent emulator-style controls that appear on the lower half, with accessible show/hide and keyboard alternatives |
| Asset generation | Consistent master prompts and approved references; bulk sheets with explicit grids/cropping/provenance, as detailed in ASSET-PIPELINE.md |
| Packaging | A static game folder is allowed; proposed entry is `games/pokemon-dungeon-reimagined/index.html` |
| Planning hold | Finish the plan and setup, then stop for Justin's review; no implementation is authorized by this document |
| Documentation | Full plan stays inside this game's `plan/`; parent `games/README.md` is the concise arcade/live/WIP catalog; root README stays unchanged |
| Website and game quality | DRY/SOLID; thorough website tests with inert game fixtures; no automated game-source tests |

## Research questions the implementer owns

- Exact Blue stat/growth, move/effect, encounter, recruitment and legacy-code data.
- Source conflicts, original floor/scene semantics, trigger timing and form rules.
- Asset provenance, browser budgets, accessibility/input implementation and static tooling.

These are tracked with owners and blocking gates in [DATA.md](DATA.md),
[CAMPAIGN.md](CAMPAIGN.md), [SYSTEMS.md](SYSTEMS.md) and [RESEARCH.md](RESEARCH.md).
They are not requests for Justin to supply cartridge facts or choose arbitrary numbers.

## Later approval checkpoints

- Authorize moving past planning and beginning the first dependency-ready package.
- Review actual authored characters, animation and a rendered 3D quality slice at P06/P10 before mass asset production; these loading images do not pass that gate.
- Review the complete P37 release and explicitly authorize merge/deployment.

See [PLAN.md](PLAN.md) for package order and [PROGRESS.md](PROGRESS.md) for the
current hold. A decision response only approves the choices explicitly stated.
