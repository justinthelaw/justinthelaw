# Customization Guide

Make this website your own with an AI chatbot that answers questions about you
using reusable public resume/profile sections from the site configuration.

## Quick Setup Checklist

### 1. Fork Repository (~5 min)

- [ ] Fork this repo to your GitHub account
- [ ] Rename to `[your-username]` (recommended)
- [ ] Enable GitHub Pages: Settings -> Pages -> Source: `gh-pages` / `root`

### 2. Configure Website (~10 min)

Edit `src/config/site.ts` and `src/config/prompts.ts`:

- [ ] Set `name` to your name
- [ ] Set `githubUsername` to your username
- [ ] Set `repository.owner` and `repository.name`
- [ ] Set `resumeFileId` (from Google Drive share link)
- [ ] Update `socialLinks` (empty string hides a link)
- [ ] Summarize resume, cover letter, and personal knowledge in `PROFILE_SECTIONS`
- [ ] Update `CHATBOT_CONFIG.welcomeMessages`

### 3. Upload Resume (~2 min)

- [ ] Upload PDF to Google Drive
- [ ] Share -> "Anyone with the link"
- [ ] Copy file ID from URL: `drive.google.com/file/d/[FILE_ID]/view`
- [ ] Paste into `SITE_CONFIG.resumeFileId`

### 4. Test & Deploy (~5 min)

- [ ] Install `npm` based on your development environment
- [ ] `npm install`
- [ ] `npm run dev` (test at localhost:3000)
- [ ] `uv tool install pre-commit` (or `pipx install pre-commit`)
- [ ] `pre-commit install`
- [ ] `pre-commit run --all-files`
- [ ] `npm run flight-check`
- [ ] `npm run deploy`

Pre-commit hooks mirror the repo's current lint checks:

- `app-eslint` runs `npm run lint`

## Configuration Files

| File                    | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `src/config/site.ts`    | Personal info, resume, and chatbot profile sections |
| `src/config/models.ts`  | AI model ID and browser dtype policy       |
| `src/config/prompts.ts` | Chatbot messages and generation settings   |

The default browser model is
`justinthelaw/teapot-profile-qa-browser-1024`, a browser ONNX profile-QA model
published with `int8` and `uint8` variants.

## Common Customizations

### Update Chatbot Context

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
Avoid employer- or person-specific section IDs. If selected profile sections or
visitor input exceed the browser model budget, the chat UI shows a small
warning icon with exact overage details.

### Hide a Social Link

```typescript
socialLinks: {
  huggingface: "", // Empty = hidden
}
```

### Add a Social Link

- [ ] Add URL to `SITE_CONFIG.socialLinks`
- [ ] Add 48x48px PNG icon to `public/`
- [ ] Add `<LinkIconButton>` in `src/pages/index.tsx`

### Change the Browser Model

Edit `src/config/models.ts`:

```typescript
export const MODEL_ID = "justinthelaw/teapot-profile-qa-browser-1024";
export const MODEL_CONTEXT_LIMIT = 1024;
```

Use a model that is compatible with Transformers.js browser inference. If the
model uses a different Transformers.js task, update
`src/services/ai/modelLoader.ts` and `src/services/ai/worker.ts` to match.

### Tune AI Responses

Edit `src/config/prompts.ts`:

```typescript
export const GENERATION_PARAMS: GenerationParams = {
  temperature: 0.3,
  maxTokens: 128,
  topK: 30,
  repetitionPenalty: 1.5,
};
```

## Troubleshooting

- **Resume not displaying**: Check Google Drive link is public
- **Chatbot not responding**: Check browser console, verify model ID
- **Build failures**: Run `npm run flight-check` for details
