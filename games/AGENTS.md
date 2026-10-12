# Browser games

- Each game owns its runtime, framework/language lint, types and distribution.
  Root ESLint and TypeScript exclude game builds without relaxing source quality.
- Keep browser assets local and URLs relative. The website exports selected
  resources through `scripts/export-games.mjs` and each game's `distribution.json`.
- Authoring tools and disposable previews belong under `tools/`, outside games.
- Never import or execute game modules in automated checks, run native game code,
  or automate playthroughs. Use static checks and inert website fixtures.
- Follow the [Blue opening instructions](pokemon-dungeon-reimagined/AGENTS.md)
  for the only current game. Its authoring package owns `npm run check`.
- Human keyboard instructions belong in [PLAYER-GUIDE.md](PLAYER-GUIDE.md).
  The two additional arcade cards are placeholders, not announced games.
