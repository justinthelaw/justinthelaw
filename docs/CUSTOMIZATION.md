# Customization Guide

Make this website your own with an AI chatbot that answers questions about you
using a plain personal context block from the site configuration.

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
- [ ] Summarize resume, cover letter, and personal knowledge in `PERSONAL_CONTEXT`
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
| `src/config/site.ts`    | Personal info, resume, and chatbot context |
| `src/config/models.ts`  | AI model ID and browser dtype policy       |
| `src/config/prompts.ts` | Chatbot messages and generation settings   |

The default browser model is `teapotai/teapotllm`.

## Common Customizations

### Update Chatbot Context

Edit `PERSONAL_CONTEXT` in `src/config/site.ts`:

```typescript
export const PERSONAL_CONTEXT = `
Paste your resume, cover letter, biography, project notes, recommendations,
or any other public information the chatbot should use here.
`.trim();
```

The chatbot receives this text block as its source of truth. Keep it concise:
roughly 150-220 words is a good target for Teapot LLM, leaving room for the
prompt and the visitor's question. Short paragraphs and high-signal
bullet-style sentences work best.

Put the most important facts first. If the profile text is still too long for
the browser model, the app trims from the tail and shows a small warning icon
under the first chat message. Hover or focus the icon for exact overage details.
The chat input also shows a warning icon when a visitor's message would exceed
the remaining prompt budget before tail trimming.

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
export const MODEL_ID = "teapotai/teapotllm";
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
