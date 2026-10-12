# Customization Guide

Configure the portfolio and browser chatbot with public, factual information.
See [Development](DEVELOPMENT.md) for setup and [Diagrams](DIAGRAMS.md) for flow.

## Quick Setup

1. Fork the repo, optionally rename it to your username, and select GitHub
   Actions as the Pages source.
2. In `src/config/site.ts`, set `name`, `fullName`, `githubUsername`,
   `githubBioFallback`, `repository.owner`, `repository.name`, `seo.imageUrl`,
   `resumeFileId`, and `socialLinks`.
3. Set `identity.subject` and public facts in `src/config/public-profile.json`.
4. Install the pinned toolchain, run `npm install` and `npm run dev`, then check
   `localhost:3000`.
5. Install pre-commit with `uv tool install pre-commit` or
   `pipx install pre-commit`; install and run the
   [hooks](CONTRIBUTING.md#validation), then `npm run flight-check`.
6. Push to `main` for Pages Actions deployment. Alternatively, `npm run deploy`
   publishes `out/` to `gh-pages` manually.

`SITE_CONFIG.repository.name` determines the production `basePath`
(`/justinthelaw` here); never hardcode it. The exported `githubBioFallback`
is visible to crawlers and visitors; hydration refreshes it from GitHub and
keeps the fallback on failure. Use a public absolute HTTPS `seo.imageUrl`
suitable for the favicon, Open Graph, and Twitter preview.

## Configuration Map

| File | Controls |
| --- | --- |
| `src/config/site.ts` | Identity, resume, links, derived site settings |
| `src/config/public-profile.json` | Shared chatbot facts, identity, retrieval and scoring metadata |
| `src/config/models.ts` | Model ID, download size, context limit, dtype policy |
| `src/config/prompts.ts` | Messages and generation settings |
| `src/config/arcade.ts` | Game cards and previews |
| `next.config.mjs` | Static export, base path, asset prefix |
| `ml/profile-qa/` | Local training, evaluation, ONNX export, publishing |

## Resume and Social Links

Upload the resume PDF to Google Drive, share it as "Anyone with the link", and
copy the ID from `drive.google.com/file/d/[FILE_ID]/view` into
`SITE_CONFIG.resumeFileId`.

An empty `SITE_CONFIG.socialLinks` value hides that link. To add one, set its
URL, add a 48×48px PNG in `public/`, and add a `LinkIconButton` in
`src/pages/index.tsx`.

## Arcade

The top-right joystick opens `/arcade/`; it uses shared 28/32/36px icon sizes.
Edit `ARCADE_GAMES` in `src/config/arcade.ts`:

| Field | Value |
| --- | --- |
| `id`, `title`, `description` | Stable identifier and short card text |
| `blobVariant` | `blue`, `lavender`, or `apricot`; animated unless reduced motion is preferred |
| `entryPoint` | For example, `/games/my-game/index.html`; omitted means Play is disabled |
| `preview` | For example, `{ src: "/arcade/game.gif", alt: "Description of the game" }`; omitted keeps the pixel blob |

Put a static game build in `games/my-game/`, with local relative asset URLs.
`npm run build` copies it to `out/games/`: `distribution.json` limits export to
its declared files; games without a manifest use the complete-tree fallback.
Place preview images/GIFs in `public/arcade/`; local preview and entry-point
URLs receive the configured base path. Absolute HTTPS preview URLs also work.

Play opens a page-filling iframe modal; Back to games restores Play focus.
The Pokémon adaptation covers the original DS opening through Tiny Woods and
Caterpie's rescue. Its preview is a native browser gameplay capture; later
chapters are outside scope, and exact cartridge fidelity is not claimed.

Touch devices show emulator controls; desktop input uses the focused iframe.
Show/Hide controls toggles the overlay. It emits keys to the same-origin game,
which must implement them:

| Control | Keys |
| --- | --- |
| D-pad | Arrows; two held arrows for diagonals |
| A / B | Z / X |
| Start / Select / Menu | Enter / Shift / Escape |

Trailing-slash export produces `out/arcade/index.html`, supporting direct
`/arcade/` visits and reloads on Pages.

## Chatbot Context

Edit only `src/config/public-profile.json` for facts. `src/config/site.ts`
imports it as `PROFILE_SECTIONS`; `ml/profile-qa/profile_qa/public_profile.py`
loads it for training. `PERSONAL_CONTEXT` remains a derived compatibility value.

| Field | Purpose |
| --- | --- |
| Identity `subject` | `name`, `shortName`, `subjectPronoun`, `objectPronoun`, `possessivePronoun`; shared by browser welcome/status/system prompts and synthetic questions, histories, refusals, and training instructions |
| Section `id`, `title`, `priority`, `alwaysInclude`, `keywords` | Reusable categories and browser retrieval order |
| Fact `id`, `text`, `keywords` | Public evidence and retrieval terms |
| Fact `terms`, named `termGroups` | Deterministic evaluation; grouped QA selects one minimum-complete term group per evidence fact |

Keep section IDs generic and prioritize `current_role`, `experience`, `projects`,
`education`, `recommendations`, `skills`, then `interests`. Experience outranks
education; recommendations follow education and precede hobbies or personality.
Put person-specific names and employers in fact text and keywords.

The prompt builder always includes identity, retrieves sections using the latest
question and recent turns, and fits sections/history before trimming user input.
Scoring groups must require what every question variant asks, not unrelated
implementation details or a tool list in place of the workload problem.

## Browser Model

Edit `src/config/models.ts`:

```typescript
export const MODEL_ID = "justinthelaw/teapot-profile-qa-browser-1024";
export const MODEL_DOWNLOAD_SIZE_MB = 820;
export const MODEL_CONTEXT_LIMIT = 1024;
```

The consent prompt must disclose the approximate download size of one dtype
(currently 820 MB) and a possible similarly sized compatibility fallback.
Automatic loading uses `int8`, then `uint8`; do not default to `q4` unless
ONNX Runtime Web can reliably load it without external tensor sidecars.

Use a Transformers.js-compatible model. A task change also requires updating
`src/services/ai/modelLoader.ts` and `src/services/ai/worker.ts`. Before changing
the default, pass the [promotion gate](../ml/profile-qa/README.md#promotion-gate),
including embedded-tensor `int8`/`uint8` artifacts and desktop/mobile Chromium
smoke checks.

## AI Responses

Edit `GENERATION_PARAMS` in `src/config/prompts.ts`:

```typescript
export const GENERATION_PARAMS: GenerationParams = {
  temperature: 0.3,
  maxTokens: 128,
  topK: 30,
  repetitionPenalty: 1.5,
};
```

## Fine-Tuning Handoff

Use the optional [local pipeline](../ml/profile-qa/README.md) when context and
prompt changes are insufficient:

1. Update canonical identity, facts, retrieval metadata, `terms`, and `termGroups`.
2. If a fact change invalidates question/history wording, update the matching
   `FACT_QA`, `TARGETED_COMPLETENESS_QA`, `MULTI_HOP_QA`, or `FOLLOW_UP_QA` entry
   in `ml/profile-qa/profile_qa/synthetic_data.py`. Names/pronouns render from
   `identity.subject` automatically.
3. Generate data, train LoRA/QLoRA, evaluate, merge, export ONNX, prepare artifacts,
   and publish as described in the pipeline guide.
4. After promotion passes, update `MODEL_ID` and `MODEL_CONTEXT_LIMIT`, then run
   `npm run flight-check`.

## Troubleshooting

| Issue | Check |
| --- | --- |
| Resume missing | Google Drive sharing is public |
| Chat unresponsive | Browser console and model ID |
| Build failure | `npm run flight-check` output |
