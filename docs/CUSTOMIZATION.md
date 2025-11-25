# Customization Guide

Make this website your own by updating **`src/config/site.ts`** - a single file containing all customizable values.

For development guidance, see [`.github/copilot-instructions.md`](../.github/copilot-instructions.md).

## Quick Setup Checklist

### 1. Fork & Configure Repository

- [ ] Fork this repository to your GitHub account
- [ ] Rename to `[your-username].github.io` (optional)
- [ ] Update `basePath` in `next.config.ts` if you changed the repo name

### 2. Update `src/config/site.ts`

#### Basic Information

- [ ] `name` - Your full name
- [ ] `githubUsername` - Your GitHub username (auto-fetches bio)
- [ ] `seo.title` and `seo.description` - SEO metadata

#### Resume

- [ ] Upload resume PDF to Google Drive → Share → "Anyone with the link"
- [ ] Copy file ID from URL: `https://drive.google.com/file/d/[FILE_ID]/view`
- [ ] Update `resumeFileId` with your file ID

#### Social Links

- [ ] Update URLs for `github`, `linkedin`, `huggingface`, `gitlab`
- [ ] Set to `""` to hide a link
- [ ] To add new links: update `socialLinks` + add icon to `public/` + edit `src/pages/index.tsx`

#### AI Chatbot Profile

Update the `PROFILE` object with your information:

```typescript
export const PROFILE: ProfileSection = {
  role: "Your Job Title at Company",
  company: "Company description",
  background: "Professional background",
  education: "Education details",
  military: "Military service (or remove this field)",
  skills: "Key skills",
  personality: "Personality traits",
  interests: "Hobbies and interests",
};
```

- [ ] Update all fields with your information
- [ ] Remove non-applicable fields (e.g., `military`)
- [ ] Update `RELEVANT_TERMS` with keywords about you
- [ ] Adjust `CONTEXT_PRIORITIES` weights/keywords if needed

### 3. Assets

- [ ] Verify social icons exist in `public/` (github.png, linkedin.png, etc.)
- [ ] Add any custom 48x48px PNG icons needed

### 4. Test & Deploy

```bash
# Test locally
npm run dev                    # Development at localhost:3000
npm run flight-check           # Full verification (clean, install, lint, build, test)

# Deploy
npm run deploy                 # Builds and pushes to gh-pages branch
```

- [ ] Enable GitHub Pages: Settings → Pages → Source: `gh-pages` / `root`
- [ ] Verify live at `https://your-username.github.io/your-repo-name/`

## Common Customizations

### Hide a social link

```typescript
socialLinks: {
  huggingface: "", // Hides HuggingFace icon
}
```

### Add a social link

1. Add to `SITE_CONFIG.socialLinks`
2. Add icon PNG to `public/`
3. Add `LinkIconButton` in `src/pages/index.tsx`

### Change AI model

Edit `DEFAULT_MODEL_SIZE` in `src/config/models.ts`

### Customize AI prompts

Edit `SYSTEM_INSTRUCTIONS` in `src/config/prompts.ts`

### Styling

- Global styles: `src/styles/globals.css`
- Tailwind config: `tailwind.config.ts`
- Follow patterns in `.github/copilot-instructions.md`

## Troubleshooting

### Resume not displaying

- Verify Google Drive link is public
- Check browser console for CORS errors
- Consider hosting PDF elsewhere and updating `ResumeViewer.tsx`

### GitHub bio not loading

- Verify `githubUsername` is correct
- Check GitHub API rate limits

### Icons not appearing

- Verify files exist in `public/` (case-sensitive)
- Ensure PNG format

### Build/deployment issues

- Check `basePath` in `next.config.ts` matches repo name
- Review GitHub Actions logs
- Ensure `gh-pages` branch exists

## Architecture

**Configuration**: All customizable values in `src/config/`

- `site.ts` - Personal info, resume, social links, profile
- `models.ts` - AI model configuration
- `prompts.ts` - AI prompt templates

**Features**: Organized by domain (`chat`, `profile`, `resume`)

**Services**: External integrations (AI worker, GitHub API)

**Testing**: `npm run flight-check` runs full validation suite

See [`.github/copilot-instructions.md`](../.github/copilot-instructions.md) for detailed architecture, code standards, and development patterns.

## Support

Issues or questions? Open an issue on the [original repository](https://github.com/justinthelaw/justinthelaw).
