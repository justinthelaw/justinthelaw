# Opening runtime

Follow the [game scope](../../AGENTS.md). This is JavaScript ES modules with
JSDoc, two 256x192 Canvas 2D displays and local assets.

| Owners | Boundary |
| --- | --- |
| `app.js`, `input.js`, `menus.js`, `naming.js`, `onboarding.js`, `story.js` | Scene/input ownership and character creation |
| `mechanics*.js` | Synchronous turns, targeting, AI, items, generation and admission |
| `battle-events.js`, `battle-presentation.js`, `battle-item-flight.js` | Detached evidence and bounded presentation |
| `renderer.js`, `render-*.js`, camera/map modules | Drawing, geometry and resource lifetime |
| `audio*.js` | Gesture-unlocked effects, bounded voices and cancellation |
| `save.js`, `preferences.js` | Versioned journals and browser preferences |

- Rendering/audio consume decided facts; never repeat gameplay, RNG draws or
  target scans. Presentation evidence stays outside saves.
- Preserve input release/focus guards, paused clocks, aborts and bitmap/audio
  disposal. Retired callbacks must not publish or replay.
- Keep save compatibility, exact-receipt stale-write checks and historical
  namespaces. Unsupported payloads must not silently become writable.
- Generated `*-data.js` modules come from the authoring package. Change their
  inputs/exporters and regenerate; preserve source pins and admission limits.
- Validate through `tools/pokemon-dungeon` static checks. No automated imports,
  execution or playthroughs of these modules.
