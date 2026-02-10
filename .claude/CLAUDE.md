# Claude Code Instructions

Read and follow `/AGENTS.md` for all project conventions, architecture, code standards, and commands.

## Claude-Specific Notes

- After making changes, run `npm run flight-check` to validate (clean, lint, build, test).
- This is a static export site. Never introduce server-side features (API routes, server actions, SSR).
- Use the `@/` import alias for all `src/` imports.
- Prefer editing existing files over creating new ones.
