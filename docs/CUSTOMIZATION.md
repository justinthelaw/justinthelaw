# Customization Guide

Make this website your own with an AI chatbot that answers questions about you.

## Two AI Models

| Model       | Description                        | Setup                     |
| ----------- | ---------------------------------- | ------------------------- |
| **DUMBER**  | Generic model with profile context | Edit `src/config/site.ts` |
| **SMARTER** | Fine-tuned on your resume          | Run `/pipeline`           |

**Start with DUMBER**, then upgrade to SMARTER for better responses.

## Quick Setup Checklist

### 1. Fork Repository (~5 min)

- [ ] Fork this repo to your GitHub account
- [ ] Rename to `[your-username]` (recommended)
- [ ] Enable GitHub Pages: Settings → Pages → Source: `gh-pages` / `root`

### 2. Configure Website (~10 min)

Edit `src/config/site.ts` and `src/config/prompts.ts`:

- [ ] Set `name` to your name
- [ ] Set `githubUsername` to your username
- [ ] Set `repository.owner` and `repository.name`
- [ ] Set `resumeFileId` (from Google Drive share link)
- [ ] Update `socialLinks` (empty string hides a link)
- [ ] Update `PROFILE` object for DUMBER model context
- [ ] Update `CHATBOT_CONFIG.welcomeMessages`

### 3. Upload Resume (~2 min)

- [ ] Upload PDF to Google Drive
- [ ] Share → "Anyone with the link"
- [ ] Copy file ID from URL: `drive.google.com/file/d/[FILE_ID]/view`
- [ ] Paste into `SITE_CONFIG.resumeFileId`

### 4. Test & Deploy (~5 min)

- [ ] `npm install`
- [ ] `npm run dev` (test at localhost:3000)
- [ ] `npm run flight-check`
- [ ] `npm run deploy`
- [ ] Go to localhost:6006 to check Phoenix OTEL traces for a quick LLM output vibe check

## Upgrade to SMARTER Model (~3-4 hours)

See [`/pipeline/README.md`](../pipeline/README.md) for full instructions.
For config knob rationale, use [`/pipeline/HYPERPARAMETER.md`](../pipeline/HYPERPARAMETER.md).

Before pushing a new model, run the pipeline evaluation suite:

- `cd pipeline`
- `make eval-smoke` for a quick deterministic regression check
- `make eval-full` for full threshold-gated evaluation
- review reports in `pipeline/data/eval_reports/<timestamp>/summary.md`

## Configuration Files

| File                    | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `src/config/site.ts`    | Personal info, profile, chatbot messages |
| `src/config/models.ts`  | AI model IDs                             |
| `src/config/prompts.ts` | Generation parameters                    |
| `pipeline/config.yaml`  | Fine-tuning settings                     |

## Common Customizations

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

### Tune AI Responses

Edit `src/config/prompts.ts`:

```typescript
[ModelType.SMARTER]: {
  temperature: 0.1,      // Lower = more consistent
  maxTokens: 150,        // Response length
  repetitionPenalty: 1.4 // Higher = less repetition
}
```

## Troubleshooting

- **Resume not displaying**: Check Google Drive link is public
- **Chatbot not responding**: Check browser console, verify model ID
- **Build failures**: Run `npm run flight-check` for details
