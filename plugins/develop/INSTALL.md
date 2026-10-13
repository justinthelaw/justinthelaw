# Install Develop

Source: [justinthelaw/justinthelaw, plugins/develop](https://github.com/justinthelaw/justinthelaw/tree/main/plugins/develop). The plugin uses portable root `plugin.json` and `skills/`, plus a generated `.codex-plugin/plugin.json` for Codex compatibility. Both manifests resolve assets from the plugin root. The repository catalog lives at `.agents/plugins/marketplace.json` and points to `./plugins/develop`. A checkout or Git push does not install or enable it elsewhere.

## Local client

Choose a Git ref containing the plugin; replace `main` below when testing an unmerged branch.

```sh
codex plugin marketplace add justinthelaw/justinthelaw --ref main
codex plugin marketplace list
```

In Codex CLI, open `/plugins` and install and enable Develop from the justinthelaw marketplace. In ChatGPT desktop, restart the app, open Plugins, select that marketplace, and install Develop. Start a new chat and verify the skills are available. For a local checkout, register the repository root with `codex plugin marketplace add /absolute/path/to/justinthelaw`.

Install and enable [Superpowers](https://github.com/obra/superpowers) separately for implementation through `iterate` and for `upgrade`. If unavailable, implementation routes perform read-only preparation and report the dependency blocker before changing code. Publishing already-prepared changes and read-only monitoring use the bundled delivery procedure without a new design/planning dependency; code repairs return to the implementation gates. This package does not automatically install dependencies or grant repository access.

Ask directly, for example:

- `develop iterate: fix this repository's failing build. Preserve its public API.`
- `develop iterate: publish the prepared changes in this checkout and monitor CI. Prefer signing when available; allow unsigned commits.`
- `develop upgrade: upgrade dependencies in justinthelaw/example.`
- `develop clean: inspect disk and memory usage; do not delete anything.`
- `adversarial-loop: fact-check this draft and check its tone against my style guide; report findings only.`

`adversarial-loop` also works independently on facts, visuals, writing, and other artifacts. It requires fresh matching reviewers, but no repository, router, or Superpowers.

Cleanup adapts to Windows, Linux, and macOS. Every invocation requires fresh independent adversarial review, including blocked and no-op outcomes. A runtime without fresh non-forked agents using the original model and effort cannot complete that gate; report it as blocked or unverified.

Commit signing is a thread-scoped preference, not a prerequisite: use an existing
noninteractive signer when available and fall back unsigned when only signing
is unavailable or fails. No key setup, persistent Git configuration changes or
repeated prompts are required. Real repository/server restrictions remain in
effect. See the [shared contract](skills/develop/references/contract.md#nonblocking-commit-signing).

## Dot and cloud

| Surface | Required setup |
| --- | --- |
| Dot using your laptop | Connect the laptop in the dot's profile; keep it online with ChatGPT open. Verify the local task can load both plugins. |
| Dot or ChatGPT Work in the cloud | Make the plugin available through a supported account/workspace distribution flow, then install, enable, and verify it in a new cloud task. Local installation alone is insufficient. |
| Separate VM running Codex CLI | Install through that VM's own client; verify repository access, Superpowers, and reviewer-agent capability there. |

For workspace distribution, an admin can select **Admin > Plugins > Add > Import marketplace**, use `https://github.com/justinthelaw/justinthelaw` as Source, leave Path empty, and select the intended branch/tag/commit. Review import results and configure role access. Workspace imports support daily sync and **Sync now**. Workspace policies apply independently of the repository catalog. This does not promise personal GitHub sync or automatic installation across devices.

## Update and verify

Refresh a configured Git marketplace with `codex plugin marketplace upgrade justinthelaw`. Update local checkouts through Git; use workspace sync for imported copies. Restart the desktop app, begin a new chat, and verify the active revision and skill contents. Do not edit installed caches.

From the repository root, with Python 3.10 or newer:

```sh
python plugins/develop/scripts/generate_codex_manifest.py
python plugins/develop/scripts/validate.py --marketplace-root .
python -m unittest discover -s plugins/develop/tests -p test_validate.py
python -m unittest discover -s plugins/develop/skills/iterate/scripts -p 'test_*.py'
```

Regenerate the compatibility manifest after changing root `plugin.json` and commit both files. Validation checks the shipped manifest without rewriting it. These checks validate package structure, not runtime behavior. For a detached installed payload, run its `scripts/validate.py` without `--marketplace-root`. Run [agent scenarios](tests/scenarios.md) and verify installation, references, Superpowers, and fresh-agent review on each intended surface. See [AGENTS.md](AGENTS.md) for maintenance instructions. No installation or publication is implied by this guide.

## Migrating standalone skills

Version 0.2.0 consolidates the Git publication/inventory/watcher behavior into
`iterate` and the bounded lane-contract behavior into `adversarial-loop`.
The five canonical entry points remain `develop`, `iterate`, `upgrade`, `clean`
and `adversarial-loop`. Bundled Python helpers are explicitly invoked from their
installed skill directory; they are not hooks, services or automatic actions.

Keep existing `git-commit-push-fix-loop` and `adversarial-review-loop` installations
and their source repositories intact during qualification. Test the packaged
payload from an unrelated working directory, then verify the intended installed
plugin's version, source revision, helper paths and behavior in a fresh chat.
Invoke the marketplace plugin explicitly during coexistence; do not assume
duplicate-name precedence or edit installed caches. A local package test is not
proof of installation or successful remote CI monitoring.

Only after the marketplace version has passed that verification should callers
switch to `iterate` and `adversarial-loop`. Retiring old active links/copies is a
separate authorized migration step; use Trash where supported and retain source
history. No legacy aliases or local-installation changes are made by this release.

Official references: [packaging and marketplaces](https://developers.openai.com/plugins/build/plugins), [installation](https://learn.chatgpt.com/docs/plugins), [workspace GitHub sync](https://learn.chatgpt.com/docs/enterprise/plugin-management), [Dot access](https://learn.chatgpt.com/docs/dots/computers-and-apps).
