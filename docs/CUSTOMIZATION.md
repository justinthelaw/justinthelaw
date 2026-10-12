# Customization

Configure the portfolio and browser chatbot with public, factual information.
Use [Development](DEVELOPMENT.md) for setup and [Diagrams](DIAGRAMS.md) for flow.

## Configuration map

| File | Controls |
| --- | --- |
| `src/config/site.ts` | Identity, GitHub bio fallback, resume, social links, SEO, repository URLs |
| `src/config/public-profile.json` | Canonical chatbot identity, public facts, retrieval and evaluation metadata |
| `src/config/models.ts` | Model ID, download size, context limit, dtype policy |
| `src/config/prompts.ts` | Chat text, input limit, generation parameters |
| `src/config/arcade.ts` | Game cards, previews, entry points |
| `next.config.mjs` | Static export, trailing slashes, base path, asset prefix |
| `llm/` | Optional local training, evaluation, ONNX export, model packaging/publishing |
| `plugins/develop/` | Development skills distributed separately from the website |

## Identity, resume, and deployment

In `SITE_CONFIG`, set `name`, `fullName`, `githubUsername`, `githubBioFallback`,
`repository`, `seo`, `resumeFileId`, and `socialLinks`. Set matching public
identity and facts in `src/config/public-profile.json`.

`DERIVED_CONFIG` computes production URLs from the repository owner/name.
Project repositories use `/<repository>`; an `<owner>.github.io` repository
uses the domain root. Development uses no base path. Do not hardcode either
case in components or assets.

The exported GitHub bio uses `githubBioFallback`. Hydration fetches the live
bio and keeps the fallback on failure. Use a public absolute HTTPS `seo.imageUrl`
for the favicon and social previews.

Share the resume PDF through Google Drive as Anyone with the link, then copy
the ID from `drive.google.com/file/d/[FILE_ID]/view` into `resumeFileId`.
Empty social-link values hide those links. To add a link, configure its URL,
add a 48x48px PNG in `public/`, and add an item to `socialLinks` in
`src/pages/index.tsx`.

After `npm run flight-check`, authorized changes to `main` that match the
Pages workflow's paths deploy through GitHub Actions. Configure Actions as
the repository's Pages source. `npm run deploy` is the separate manual route
that builds and publishes `out/` to `gh-pages`; run it only when deployment
is authorized.

## Arcade

Edit `ARCADE_GAMES` in `src/config/arcade.ts`:

| Field | Meaning |
| --- | --- |
| `id`, `title`, `description` | Stable identifier and short card text |
| `blobVariant` | `blue`, `lavender`, or `apricot` placeholder |
| `entryPoint` | Local path such as `/games/my-game/index.html`; absent disables Play |
| `preview` | `{ src: "/arcade/game.gif", alt: "Description" }`; absent shows an animated blob |

Put a static browser build in `games/my-game/` using relative asset URLs.
The postbuild exporter copies a game's declared `distribution.json` files to
`out/games/`; without a manifest it copies the complete folder. Keep authoring
material outside the distribution. A missing `games/` directory is a no-op.

Store preview images/GIFs in `public/arcade/`. Local preview and entry-point
URLs receive the configured base path; previews may also use absolute HTTPS
URLs. Preserve capture [provenance](../public/arcade/PROVENANCE.md).

Play opens a viewport-filling iframe while cards remain mounted. Back to games
restores Play focus. Touch controls emit arrows, Z/X, Enter/Shift/Escape to the
same-origin game; desktop input uses iframe focus. See the
[player guide](../games/PLAYER-GUIDE.md) for controls. The selected Pokémon game
covers the DS opening through Tiny Woods and Caterpie's rescue; exact cartridge
fidelity is not claimed.

## Chatbot context

Edit facts only in `src/config/public-profile.json`. Both `src/config/site.ts`
and `llm/persona/public_profile.py` consume this source; `PERSONAL_CONTEXT`
is derived compatibility text.

| Field | Purpose |
| --- | --- |
| Identity `subject` | Name, short name, and subject/object/possessive pronouns for prompts and synthetic data |
| Section `id`, `title`, `priority`, `alwaysInclude`, `keywords` | Generic categories and retrieval order |
| Fact `id`, `text`, `keywords` | Public evidence and retrieval terms |
| Fact `terms`, named `termGroups` | Minimum-complete evidence used by deterministic evaluation |

Prioritize current role, experience, projects, education, recommendations,
skills, then interests. Keep names/employers in facts and keywords. The prompt
builder always includes identity, retrieves facts using the question and recent
turns, and budgets context/history before trimming user input.

When changed facts invalidate question/history wording, update corresponding
entries in `llm/persona/synthetic_data.py`. Scoring terms must express what each
question asks, not unrelated details. Identity names and pronouns render from
`identity.subject` automatically.

## Browser model and responses

`src/config/models.ts` currently selects
`justinthelaw/teapot-profile-qa-browser-1024`, a 1024-token context limit, and an
approximate 820 MB download for one dtype. Consent also discloses a possible
similarly sized compatibility fallback. Automatic loading tries `int8`, then
`uint8`; `q4` is excluded from automatic fallback.

`GENERATION_PARAMS` in `src/config/prompts.ts` supplies `maxTokens`,
`repetitionPenalty`, `temperature`, and `topK`. The worker currently sets
`do_sample: false`, so changing temperature/topK alone does not enable sampling.
A model-task change also requires compatible loader and worker changes.

Try fact/context/prompt improvements before training. Use the
[local pipeline and promotion gate](../llm/AGENTS.md#promotion-gate) to train,
evaluate, export, and verify a replacement. Pass embedded-tensor `int8`/`uint8`
artifact checks and desktop/mobile Chromium smoke checks before changing
`MODEL_ID`; keep context and download-size settings accurate.
