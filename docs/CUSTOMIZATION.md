# Customization Guide

Make this static portfolio your own. The browser chatbot answers from reusable
public profile sections, so configuration should stay factual, public, and easy
to sync with the optional training pipeline.

For a system map, see [diagrams.md](diagrams.md).

## Quick Setup

- [ ] Fork this repo to your GitHub account
- [ ] Rename to `[your-username]` (recommended)
- [ ] Set GitHub Pages source to GitHub Actions for CI deploys
- [ ] Set `name` to your name
- [ ] Set `githubUsername` to your username
- [ ] Set `repository.owner` and `repository.name`
- [ ] Set `resumeFileId` (from Google Drive share link)
- [ ] Update `socialLinks` (empty string hides a link)
- [ ] Summarize public resume/profile knowledge in `PROFILE_SECTIONS`
- [ ] Update `CHATBOT_CONFIG.welcomeMessages`
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

## Configuration Map

| File                    | Purpose                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `src/config/site.ts`    | Personal info, resume, and chatbot profile sections        |
| `src/config/models.ts`  | AI model ID and browser dtype policy                       |
| `src/config/prompts.ts` | Chatbot messages and generation settings                   |
| `next.config.ts`        | Static export, GitHub Pages `basePath`, and asset prefix   |
| `ml/profile-qa/`        | Local training, eval, ONNX export, and publishing          |

The default browser model is
`justinthelaw/teapot-profile-qa-browser-1024`, a browser ONNX profile-QA model
published with `int8` and `uint8` variants.

## Resume

Upload your PDF to Google Drive, share it as "Anyone with the link", copy the
file ID from `drive.google.com/file/d/[FILE_ID]/view`, and paste it into
`SITE_CONFIG.resumeFileId`.

## Chatbot Context

Edit `PROFILE_SECTIONS` in `src/config/site.ts`. Keep the section IDs generic
so forks can reuse the retrieval behavior:

```typescript
export const PROFILE_SECTIONS = [
  {
    id: "identity",
    title: "Identity",
    priority: 100,
    alwaysInclude: true,
    keywords: ["name", "location", "identity"],
    facts: [
      {
        id: "identity_location",
        text: "Your Name is based in Your Location.",
        keywords: ["your name", "your location"],
      },
    ],
  },
  // current_role, experience, projects, education, skills, interests,
  // and recommendations follow the same shape.
] as const satisfies readonly ProfileSection[];
```

`PERSONAL_CONTEXT` is derived from these sections for compatibility. The
browser prompt builder always includes identity facts, retrieves relevant
sections from the latest question plus recent turns, and trims user input only
after selected sections and history fit the active model budget.

Put reusable categories in section IDs and person-specific terms in fact text or
fact keywords. Keep generic sections temporally prioritized: `current_role`,
`experience`, `projects`, `education`, `recommendations`, `skills`, then
`interests`. Experience should outrank education; recommendations should sit
just below education and above hobbies/interests or personality-trait sections.

If you plan to fine-tune a model, mirror public facts in
`ml/profile-qa/profile_qa/public_profile.py`. The browser reads the TypeScript
config; the training pipeline reads the Python profile file.

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
export const MODEL_CONTEXT_LIMIT = 1024;
```

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

| Step | Action |
| --- | --- |
| 1 | Update public facts in both `src/config/site.ts` and `ml/profile-qa/profile_qa/public_profile.py` |
| 2 | Follow [ml/profile-qa/README.md](../ml/profile-qa/README.md) to generate data, train LoRA/QLoRA, evaluate, merge, export ONNX, prepare Hugging Face artifacts, and publish |
| 3 | After promotion passes, update `MODEL_ID` and `MODEL_CONTEXT_LIMIT` in `src/config/models.ts` |
| 4 | Run `npm run flight-check` |

## Troubleshooting

| Issue | Check |
| --- | --- |
| Resume not displaying | Check Google Drive link is public |
| Chatbot not responding | Check browser console and verify model ID |
| Build failures | Run `npm run flight-check` for details |
