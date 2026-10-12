# Website instructions

The pages-router website uses React, TypeScript, Tailwind, Zustand, and
Transformers.js. Root static-export and game-execution boundaries apply.

## Structure and conventions

- Group UI by feature in `components/` with `index.ts` exports. Components
  render; hooks own business logic; services own integrations; stores own
  shared state. Keep responsibilities clear and reuse existing primitives.
- Use explicit types and return types, `interface` for object shapes, `type`
  for unions/callbacks, functional components, and no `any`. Custom hooks
  expose named values. Use `data-testid` where needed for stable UI checks.
- Use `@/` imports, grouped Tailwind utilities, and responsive prefixes.
  If adding localStorage persistence, use Zustand `persist`, not direct access.
  Provide error fallbacks and narrow unknown errors with `instanceof Error`.
- Keep pages in `pages/`, shared settings in `config/`, integrations in
  `services/`, types in `types/`, and global styles in `styles/globals.css`.
- Keep root ESLint/TypeScript separate from independent game builds without
  relaxing game source quality. Games own their framework/language checks.

## Profile and browser inference

- `config/public-profile.json` is the canonical public-fact source, consumed by
  `config/site.ts` and `llm/persona/public_profile.py` from the repository root.
  Keep section IDs generic; place names/employers in facts and keywords.
- Prioritize current role, experience, projects, education, recommendations,
  skills, then interests. Preserve identity metadata, retrieval keywords, and
  minimum-complete evaluation `terms`/`termGroups` when editing facts.
- `services/ai/worker.ts` owns inference; `service.ts` owns worker lifecycle.
  Use `WorkerAction`/`WorkerStatus` enums. Preserve streaming, load progress,
  retry/error states, generation locking, and cleanup on interruption.
- Automatic model loading uses `int8`, then `uint8`, on every viewport. Do not
  default to `q4` without verified browser-worker support for external ONNX data.
  Pass the [promotion gate](../llm/AGENTS.md#promotion-gate) before changing
  `MODEL_ID`; keep download size and context limit accurate.
- Preserve plain download consent, one Start chat action, icon-only Send/clear/
  close, concise help, browser-local chat disclosure, and screen-reader roles.
  Disclose both initial and possible fallback download sizes.
- Reserve room beside the first message for profile-trim warnings. Verify with
  real component/export styles and a trimmed fixture independent of live facts.

## Shared UI

- Keep the arcade portal top-right and chatbot bottom-right. Use shared Button,
  Tooltip, `CornerIconButton`, and `responsiveIconStyles`: controls are
  40/44/48px and icons 28/32/36px at default/sm/md breakpoints.
- Match the portal decoration's font sizes to the icons. Derive its tooltip
  from the configured name. Preserve the robot's colors, centered 20:16 shape,
  and `viewBox="1 1 22 22"` without stretching it square; the silhouette fills
  at least 90% of the icon width.
- Corner insets mirror page/footer padding plus border (21px with the default
  root font size); align chat with the social buttons, not their container.
- Give buttons and button-style links concise 2-5 word action/destination tooltips
  through `tooltip`/`tooltipSide`. Keep independent accessible names, native
  disabled semantics, and focusable wrappers for disabled-button tooltips.
  Prompt-limit tooltips retain touch toggle and exact trimmed character counts.
- Preserve the system sans-serif stack and GitHub bio hydration. Review captures
  verify the rendered font and use a freshly fetched live GitHub bio, not the
  fallback. Disclose paused animation or stubbed resume iframes in review evidence.

## Arcade layout and loading

- `config/arcade.ts` owns cards; `pages/arcade.tsx` supplies static props.
  Keep Home as the only navigation control, one scrolling card column up to
  620px wide, side padding, and a non-shrinking wrapper with 40px bottom padding.
- Center padded previews, put short text below, and Play bottom-right. Display
  the native Tiny Woods preview uncropped at 4:3 with crisp scaling. Lavender/
  apricot placeholders say Coming soon. Original 32px SVG blobs animate unless
  reduced motion is preferred; do not add OpenAI branding or copied accessories.
- Missing `entryPoint` disables Play. Local preview/iframe URLs receive the
  configured base path; preview images may also use absolute HTTPS URLs.
- Create the iframe only after Play in a viewport-filling dialog. Keep cards
  mounted behind it, safe-area Back to games, and focus restoration to Play.
  Keep `trailingSlash: true` for direct `/arcade/` visits and reloads.

## Input bridge

`GameControls`/`useGameControls` belong to the website and supply no simulation.
They send same-origin iframe keydown/keyup pairs: arrows (including diagonals),
A/Z, B/X, Start/Enter, Select/Shift, and Menu/Escape. Desktop keys use native
iframe focus. The touch-default overlay remains toggleable with targets at
least 44px and releases held keys on hiding, interruption, navigation, or disposal.

Typing surfaces suppress overlay input. Only focused, enabled, editable text
inputs marked `data-game-controls-confirm="submit"` may receive A/Start.
Movement, B, Select/Menu, readonly fields, other typing surfaces, and host
typing remain protected. The game owns submission, validation, and scene guards.

Restore the exact captured iframe document and recipient before delivery.
Enter/Space control actions wait for host key release; interruption, navigation,
or recipient changes cancel them. A release in the current child clears host
ownership without replaying a cancelled action. First loads preserve deliberate
overlay focus; later loads preserve host focus so held activation cannot reach
a replacement game. Test with inert key-recording fixtures only.
