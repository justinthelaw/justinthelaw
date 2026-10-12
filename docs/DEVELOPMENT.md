# Development

## Local website

Use the versions pinned in `.nvmrc`, `package.json`, and `.python-version`.
The website currently targets Node 24 with npm 12.2.0. From the repository root:

```bash
nvm install
nvm use
npm install --global npm@12.2.0
npm ci
npm run dev
```

The development server uses an empty base path. Production uses the configured
GitHub Pages path; preview the built output when checking deployment behavior.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local Next.js development |
| `npm run build` | Static export to `out/`, then game export |
| `npm start` | Serve existing `out/`; build first |
| `npm run flight-check` | Required clean, lint, build, and Playwright checks |
| `npm run clean` | Remove disposable website build/test output |

For a standalone browser test run, run `npm run build` followed by `npm run test`.
Playwright starts a fresh production preview on port 3000 and never reuses a
running server. Stop any competing server first. See
[Contributing](CONTRIBUTING.md) for hooks and review evidence.

## Other packages

| Area | Entry point |
| --- | --- |
| Website architecture | [Diagrams](DIAGRAMS.md) |
| Site configuration | [Customization](CUSTOMIZATION.md) |
| Arcade controls | [Player guide](../games/PLAYER-GUIDE.md) |
| Game authoring/static checks | [Tool instructions](../tools/pokemon-dungeon/AGENTS.md) |
| Local model pipeline | [LLM instructions](../llm/AGENTS.md) |
| Development skills/plugin | [Plugin instructions](../plugins/develop/AGENTS.md) |

The Python pipeline lives directly in `llm/`; run its modules from the repository
root as `python -m llm.persona.<module>`. Follow its instructions for isolated
training/export environments and the required validation commands.

## Dependency decisions

Treat manifests, lockfiles, and CI as current configuration. Website and game
TypeScript lanes are intentionally separate; Node types follow the website's
Node major. Review the dated [dependency records](dependency-upgrades/) before
changing retained constraints, and record fresh evidence rather than treating
an old version recommendation as current.
