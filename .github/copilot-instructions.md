# Justin Law Personal Website

Justin Law's personal website built with Next.js, React, TypeScript, and Tailwind CSS. Features an AI-powered chatbot using HuggingFace transformers for answering questions about Justin's background and experience.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Prerequisites and Setup
- Node.js v20+ is required (currently using v20.19.4)
- npm v10+ is required (currently using v10.8.2)
- Install dependencies: `npm install` -- takes ~2 minutes. NEVER CANCEL. Set timeout to 5+ minutes.

### Development Workflow
- Start development server: `npm run dev` -- starts on http://localhost:3000 in ~2 seconds
- Build for production: `npm run build` -- takes ~20 seconds. NEVER CANCEL. Set timeout to 2+ minutes.
- Lint code: `npm run lint` -- takes ~3 seconds (has 1 known warning in ModelSelector.tsx)
- Run E2E tests: `npm run test` -- runs Playwright tests against dev server
- Deploy: `npm run deploy` -- builds and deploys to GitHub Pages via gh-pages

### Production and Testing
- **IMPORTANT**: `npm run start` does NOT work - this is a static export configuration
- To serve production build locally: `npx serve@latest out` after running `npm run build`
- **NEVER CANCEL** any build commands - wait for completion
- No test suite exists in this repository

## Validation

### Manual Testing Requirements
After making any changes, **ALWAYS**:
1. Run `npm run lint` to check for linting issues
2. Run `npm run build` to ensure production build succeeds
3. Run `npm run test` to verify E2E tests pass (may fail in restricted environments)
4. Test the development server with `npm run dev`
5. Open http://localhost:3000 and verify:
   - Main page loads with "Justin Law" header
   - Social media icons appear in footer (GitHub, LinkedIn, HuggingFace, GitLab)
   - AI Chatbot button appears in bottom right
   - Clicking AI Chatbot opens the chat interface
   - Resume/cover letter viewer displays (may show error due to external API)

### Expected Behavior
- **External API limitations**: GitHub API and HuggingFace model loading may fail in sandboxed environments
- **PDF viewer**: Resume viewer may show "blocked by Chrome" in development due to CORS
- **AI Chatbot**: May display "Model failed to load" due to external dependencies
- **E2E Tests**: Playwright tests may fail in sandboxed/restricted environments due to browser installation issues
- These are expected behaviors in constrained environments

## Technology Stack and Architecture

### Core Technologies
- **Next.js 15.3.3**: React framework with static export configuration
- **React 19**: UI library with hooks and context
- **TypeScript 5**: Type safety and development experience
- **Tailwind CSS 3.4+**: Utility-first CSS framework
- **HuggingFace Transformers**: AI model integration for chatbot
- **Playwright**: End-to-end testing framework for browser automation

### Key Files and Structure
```
├── src/
│   ├── components/
│   │   ├── ChatBox/           # AI chatbot implementation
│   │   ├── GitHubProfileDescription.tsx
│   │   ├── LinkIconButton.tsx
│   │   └── ResumeCoverLetterViewer.tsx
│   ├── pages/
│   │   ├── _app.tsx          # App wrapper
│   │   └── index.tsx         # Main homepage
│   └── styles/
│       └── globals.css       # Global CSS styles
├── tests/
│   └── example.spec.ts       # Playwright E2E tests
├── public/                   # Static assets (social media icons)
├── .github/
│   └── workflows/
│       ├── deploy.yml        # GitHub Actions CI/CD for deployment
│       └── test.yml          # GitHub Actions for E2E testing
├── playwright.config.ts      # Playwright test configuration
├── next.config.ts            # Next.js configuration (GitHub Pages setup)
├── package.json              # Dependencies and scripts
└── tailwind.config.ts        # Tailwind CSS configuration
```

### Configuration Details
- **Static Export**: Configured for GitHub Pages deployment
- **Base Path**: Uses `/justinthelaw.github.io` prefix in production
- **Asset Optimization**: Images unoptimized for static hosting
- **Webpack Aliases**: Sharp and ONNX runtime disabled for static build

## Deployment and CI/CD

### GitHub Actions Workflow
- **Trigger**: Push to main branch with changes to src/, public/, or config files
- **Process**: Install dependencies → Build → Deploy to GitHub Pages
- **Node Version**: Uses Node.js 20 with npm
- **Cache**: Optimizes builds with Next.js cache and dependency cache

### E2E Testing Workflow  
- **Trigger**: Pull requests to main branch
- **Process**: Install dependencies → Install Playwright browsers → Run E2E tests
- **Browsers**: Tests run on Chromium, Firefox, and WebKit
- **Reports**: Test artifacts uploaded on failure for debugging

### E2E Testing Patterns
```typescript
// Use data-testid for stable selectors
const header = page.getByTestId('main-header');
await expect(header).toBeVisible();

// Test user interactions
await page.getByTestId('ai-chatbot-button').click();

// Handle dynamic content with timeouts
await expect(page.getByTestId('github-bio')).toBeVisible({ timeout: 10000 });

// Verify external links
await expect(page.locator('a[href*="github.com"]')).toBeVisible();
```

### Local Development vs Production
- **Development**: Use `npm run dev` with hot reload on localhost:3000
- **Production Build**: Creates static files in `out/` directory
- **Serving**: Use `npx serve@latest out` for local production testing

## Common Issues and Solutions

### Build Issues
- **Lint Warning**: ModelSelector.tsx has unused eslint-disable (can be ignored)
- **Static Export**: Production server requires static file server, not `npm start`
- **External APIs**: GitHub API and HuggingFace may fail in restricted environments

### Development Tips
- **Hot Reload**: Works properly with `npm run dev`
- **CSS Changes**: Tailwind classes compile automatically
- **Component Updates**: React hot reload maintains state
- **Type Safety**: TypeScript compiler catches errors during build

## Performance Expectations

### Build and Development Times
- **Dependency Install**: ~2 minutes (442 packages)
- **Production Build**: ~20 seconds
- **Development Startup**: ~2 seconds
- **Linting**: ~3 seconds

### Bundle Size (Production)
- **Main Page**: 7.42 kB + 106 kB First Load JS
- **Framework**: 57.5 kB (React/Next.js core)
- **Application**: 38.7 kB (custom code)
- **Total**: ~102 kB shared JavaScript

Always ensure builds complete successfully and test functionality manually before committing changes.
