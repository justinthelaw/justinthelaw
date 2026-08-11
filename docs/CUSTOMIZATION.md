# Customization Guide

Make this static portfolio your own. The browser chatbot answers from reusable
public profile sections, so configuration should stay factual, public, and easy
to reuse in the optional training pipeline.

For a system map, see [DIAGRAMS.md](DIAGRAMS.md).

## Quick Setup

- [ ] Fork this repo to your GitHub account
- [ ] Rename to `[your-username]` (recommended)
- [ ] Set GitHub Pages source to GitHub Actions for CI deploys
- [ ] Set `name` and `fullName` for the page UI
- [ ] Set `githubUsername` to your username
- [ ] Set `githubBioFallback` to a short, durable profile summary
- [ ] Set `repository.owner` and `repository.name`
- [ ] Set `seo.imageUrl` to a public, absolute HTTPS image URL
- [ ] Set `resumeFileId` (from Google Drive share link)
- [ ] Update `socialLinks` (empty string hides a link)
- [ ] Set `identity.subject` and summarize public facts in `src/config/public-profile.json`
- [ ] Install `npm` based on your development environment
- [ ] `npm install`
- [ ] `npm run dev` (test at localhost:3000)
- [ ] `uv tool install pre-commit` (or `pipx install pre-commit`)
- [ ] `pre-commit install`
- [ ] `pre-commit run --all-files`
- [ ] `npm run flight-check`
- [ ] `npm run deploy`

`SITE_CONFIG.repository.name` controls the production GitHub Pages `basePath`.
For this repository, that means `/justinthelaw`; forks should not hardcode it.

The `main` branch deploys through `.github/workflows/deploy.yml` using GitHub
Pages Actions. `npm run deploy` is the manual path and publishes `out/` to a
`gh-pages` branch.

`SITE_CONFIG.githubBioFallback` is included in the static export so crawlers and
visitors always receive a profile summary. After hydration, the browser still
refreshes it from GitHub and keeps the configured text if that request fails.

`SITE_CONFIG.seo.imageUrl` is reused for the browser favicon, the Open Graph
`og:image`, and the Twitter card `twitter:image`. Use a publicly reachable image
that works both as a small icon and as the preview image when the site is shared.

## Configuration Map

| File                             | Purpose                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| `src/config/site.ts`             | Personal info, resume, links, and derived site settings          |
| `src/config/public-profile.json` | Chatbot identity, facts, retrieval metadata, and scoring terms   |
| `src/config/models.ts`           | AI model ID and browser dtype policy                             |
| `src/config/prompts.ts`          | Chatbot messages and generation settings                         |
| `next.config.mjs`                | Static export, GitHub Pages `basePath`, and asset prefix         |
| `ml/profile-qa/`                 | Local training, eval, ONNX export, and publishing                |

The default browser model is
`justinthelaw/teapot-profile-qa-browser-1024`, a browser ONNX profile-QA model
published with `int8` and `uint8` variants. Each active dtype is about 820 MB,
so the chat asks visitors before starting the download and warns that a browser
compatibility fallback can transfer a second dtype of similar size. Keep this
disclosure accurate when changing artifacts.

## Resume

Upload your PDF to Google Drive, share it as "Anyone with the link", copy the
file ID from `drive.google.com/file/d/[FILE_ID]/view`, and paste it into
`SITE_CONFIG.resumeFileId`.

## Chatbot Context

Edit `src/config/public-profile.json`. This is the only checked-in source for
chatbot facts used by both browser retrieval and Python dataset generation.
Keep section IDs generic so forks can reuse the retrieval behavior:

```json
[
  {
    "id": "identity",
    "title": "Identity",
    "subject": {
      "name": "Your Full Name",
      "shortName": "Your Name",
      "subjectPronoun": "they",
      "objectPronoun": "them",
      "possessivePronoun": "their"
    },
    "priority": 100,
    "alwaysInclude": true,
    "keywords": ["name", "location", "identity"],
    "facts": [
      {
        "id": "identity_location",
        "text": "Your Name is based in Your Location.",
        "keywords": ["your name", "your location"],
        "terms": ["Your Name", "Your Location"]
      }
    ]
  }
]
```

`src/config/site.ts` imports this file as `PROFILE_SECTIONS`, and
`ml/profile-qa/profile_qa/public_profile.py` loads the same JSON for synthetic
data generation. The identity section's `subject` object supplies the browser
welcome, inference-status, and system-prompt identity as well as the names and
pronouns rendered into synthetic questions, conversation histories, refusal
examples, and the training instruction. `PERSONAL_CONTEXT` is derived from
these sections for compatibility. The browser prompt builder always includes
identity facts, retrieves relevant sections from the latest question plus
recent turns, and trims user input only after selected sections and history fit
the active model budget.

Put reusable categories in section IDs and person-specific terms in fact text or
fact keywords. Browser retrieval uses section `priority`, section `keywords`,
and fact `keywords`; deterministic Python evaluation uses each fact's `terms`.
Facts also define named `termGroups` for grouped questions. Each grouped QA
entry selects one group per evidence fact containing the minimum terms every
question variant requires. For example, an operator follow-up selects the
workload problem without accepting a list of tools as a complete answer or
requiring extra implementation details that the question did not request.
Keep generic sections temporally prioritized: `current_role`, `experience`,
`projects`, `education`, `recommendations`, `skills`, then `interests`.
Experience should outrank education; recommendations should sit just below
education and above hobbies/interests or personality-trait sections.

## Social Links

Hide a link by setting it to an empty string:

```typescript
socialLinks: {
  huggingface: "", // Empty = hidden
}
```

To add a new link:

- [ ] Add URL to `SITE_CONFIG.socialLinks`
- [ ] Add 48x48px PNG icon to `public/`
- [ ] Add `<LinkIconButton>` in `src/pages/index.tsx`

## Browser Model

Edit `src/config/models.ts`:

```typescript
export const MODEL_ID = "justinthelaw/teapot-profile-qa-browser-1024";
export const MODEL_DOWNLOAD_SIZE_MB = 820;
export const MODEL_CONTEXT_LIMIT = 1024;
```

Set `MODEL_DOWNLOAD_SIZE_MB` to the approximate transfer size of one active
model dtype so the consent prompt remains accurate. A compatibility fallback
can download a second dtype of similar size.

Use a model that is compatible with Transformers.js browser inference. If the
model uses a different Transformers.js task, update
`src/services/ai/modelLoader.ts` and `src/services/ai/worker.ts` to match.

Automatic browser loading uses `int8` first with `uint8` fallback. Do not make
`q4` the default unless ONNX Runtime Web can reliably load the artifact without
external `.onnx.data` files.

Before changing the default browser model, satisfy the promotion gate in
[ml/profile-qa/README.md](../ml/profile-qa/README.md#promotion-gate). At
minimum, the promoted artifact must include browser-safe `int8` and `uint8`
ONNX files, no external `.onnx.data` files, and browser smoke coverage for
desktop and mobile Chromium.

## AI Responses

Edit `src/config/prompts.ts`:

```typescript
export const GENERATION_PARAMS: GenerationParams = {
  temperature: 0.3,
  maxTokens: 128,
  topK: 30,
  repetitionPenalty: 1.5,
};
```

## Fine-Tuning Handoff

The optional local pipeline lives in `ml/profile-qa/`. Use it when a fork needs
a custom browser model instead of only prompt/context changes.

The canonical JSON owns the training subject identity, answers, evidence, and
scoring terms. Natural language question and history templates are centralized in
`ml/profile-qa/profile_qa/synthetic_data.py`. If a changed fact makes one of
those prompts inaccurate—for example, it names an employer, school, product,
or role that no longer applies—update the matching `FACT_QA`,
`TARGETED_COMPLETENESS_QA`, `MULTI_HOP_QA`, or `FOLLOW_UP_QA` entry in that one
file. Names and pronouns do not need a template edit; they render from
`identity.subject` automatically.

| Step | Action |
| --- | --- |
| 1 | Update identity, facts, retrieval metadata, scoring terms, and named `termGroups` in `src/config/public-profile.json` |
| 2 | Update the centralized question/history entry in `synthetic_data.py` when changed factual wording makes it inaccurate |
| 3 | Follow [ml/profile-qa/README.md](../ml/profile-qa/README.md) to generate data, train LoRA/QLoRA, evaluate, merge, export ONNX, prepare Hugging Face artifacts, and publish |
| 4 | After promotion passes, update `MODEL_ID` and `MODEL_CONTEXT_LIMIT` in `src/config/models.ts` |
| 5 | Run `npm run flight-check` |

## Troubleshooting

| Issue | Check |
| --- | --- |
| Resume not displaying | Check Google Drive link is public |
| Chatbot not responding | Check browser console and verify model ID |
| Build failures | Run `npm run flight-check` for details |
