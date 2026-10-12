# Website test instructions

Playwright tests exercise the static export, website services, and integration
boundaries. They never execute game source or establish gameplay fidelity.

- Run `npm run flight-check` from the repository root. For a standalone test
  run, build first with `npm run build`, then `npm run test`.
- `playwright.config.ts` starts a fresh production preview on port 3000 and
  refuses to reuse an existing server. Stop any competing server and ensure
  `out/` matches the source under review.
- Retain Chromium, Firefox, WebKit, Pixel 5, and iPhone 12 coverage. Check
  navigation, accessibility, focus, mobile layout, error handling, animations,
  reduced motion, and game loading for affected UI.
- UI specs import `test` from `fixtures.ts`, which stubs profile, avatar, and
  resume requests. Profile-response tests explicitly override these routes.
  Review screenshots separately require a freshly fetched live GitHub bio.
- Use inert HTML and key-recording fixtures for iframe paths, export copying,
  typing protection, key ownership, cancellation, and focus restoration. Use
  temporary directories for exporter/cleanup checks. Never import game modules,
  test code inside `games/`, or automate a game playthrough.
- Test profile-trim warnings using real component/export styles and a fixture
  that trims regardless of the current profile's length.
- Record network or browser-install limitations honestly. GitHub/Hugging Face
  can fail in sandboxes; development PDF previews can encounter CORS failures.
