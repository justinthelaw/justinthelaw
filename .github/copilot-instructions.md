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
- Run E2E tests: `npm run test` -- executes Playwright suite (run `npx playwright install` once)
  (Tests live in `e2e/` and intercept external API calls for GitHub, Google Drive and HuggingFace.)
- Deploy: `npm run deploy` -- builds and deploys to GitHub Pages via gh-pages

### Production and Testing
- **IMPORTANT**: `npm run start` does NOT work - this is a static export configuration
- To serve production build locally: `npx serve@latest out` after running `npm run build`
- **NEVER CANCEL** any build commands - wait for completion
- E2E tests: `npm run test` (requires `npx playwright install` once)

## Validation

### Manual Testing Requirements
After making any changes, **ALWAYS**:
1. Run `npm run lint` to check for linting issues
2. Run `npm run build` to ensure production build succeeds
3. Run `npm run test` to execute Playwright E2E tests
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
- These are expected behaviors in constrained environments

## Technology Stack and Architecture

### Core Technologies
- **Next.js 15.3.3**: React framework with static export configuration
- **React 19**: UI library with hooks and context
- **TypeScript 5**: Type safety and development experience
- **Tailwind CSS 3.4+**: Utility-first CSS framework
- **HuggingFace Transformers**: AI model integration for chatbot

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
├── public/                   # Static assets (social media icons)
├── .github/
│   └── workflows/
│       ├── ci.yml           # Lint, build, and test workflow
│       └── deploy.yml       # GitHub Pages deployment
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

### GitHub Actions Workflows
- **CI (`ci.yml`)**: Runs on pull requests touching source, test, or config files and on pushes to `main`. Executes lint, build, and Playwright tests.
- **Deploy (`deploy.yml`)**: Builds and publishes to GitHub Pages after the CI workflow succeeds on `main`.
- **Node Version**: Uses Node.js 20 with npm
- **Cache**: Optimizes builds with Next.js cache and dependency cache

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
