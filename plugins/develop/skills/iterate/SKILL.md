---
name: iterate
description: Implement or review repository changes, publish selected existing work, and monitor or repair CI and review findings on GitHub, GitLab, Bitbucket or Hugging Face.
---

# Iterate

Deliver repository work through scoped changes, verified publication and current-commit review.

## Start

Read [the shared contract](../develop/references/contract.md); reuse its intent, authorization, signing preference, target selection and adversarial checkpoints. Reading this skill does not authorize publication or other external writes.

Choose the mode that matches the request; change modes only within its authorized scope:

| Mode | Target default and workflow |
| --- | --- |
| **Implement** | Build, fix or maintain behavior. Unless narrowed by the request, use the contract's dynamic owned-repository discovery. Load applicable installed Superpowers guidance for design, planning, isolation, debugging, tests, review and verification. |
| **Publish existing changes** | Use the selected checkout and its initialized recursive submodules; otherwise resolve the current checkout. Never expand to the account-wide repository default or siblings. Read [publication](references/publication.md). No new design/plan or Superpowers dependency is required to inspect, validate, commit and publish already-selected work. |
| **Monitor/fix** | Use the selected published repository/ref/SHA and its selected submodules. Monitor through native provider tools, or use the [GitHub adapter](references/github-monitoring.md). Read-only monitoring needs no Superpowers planning. Actual code repairs re-enter implementation requirements for that bounded target. |

For review-only or monitoring-only requests, inspect and report the selected artifact; do not repair or publish without authorization. An unavailable implementation dependency does not prevent safe publication-only preparation or read-only monitoring. If publication validation exposes a code defect, use the implementation workflow for an authorized repair instead of quietly expanding delivery scope.

## Implementation workflow

1. **Resolve.** Parse exact provider hosts: `github.com`, `gitlab.com`, `bitbucket.org` or `huggingface.co`; bare `owner/repo` defaults to GitHub. Inspect local origin/upstream. Establish self-managed GitLab or explicitly selected GitHub Enterprise through metadata/configuration; reject unsupported hosts without rerouting. Preserve nested groups, change-request paths and model/dataset/Space namespaces.
2. **Prepare.** Inspect access, current default branch, related PRs/issues, instructions/templates, `CODEOWNERS`, security/CLA/DCO requirements, CI, manifests, lockfiles and pinned tools. Honor required maintainer acceptance; create prerequisite issues only when required and authorized. Reuse matching branches/requests in an isolated checkout. Preserve dirty/untracked work, stashes, unpublished commits and other worktrees. Start new work from the current default branch; use an authorized fork if upstream writes are unavailable.
3. **Implement.** Reproduce defects, fix root causes, preserve interfaces and avoid unrelated refactoring. For behavior changes, use meaningful regression coverage; avoid tests that mirror implementation. Generate lockfiles/artifacts with pinned native tools.
4. **Validate.** Run repository-required formatting, lint, types, tests, build, packaging, security and contribution checks. Inspect the full diff and `git diff --check`. Distinguish defects from infrastructure/access failures. Resolve material adversarial findings and rerun affected checks.
5. **Publish.** When authorized, follow [publication](references/publication.md) for scoped staging, submodule order, nonblocking signing and remote readback. Open/update the native change request only within granted authority, preserving its template and stating purpose, behavior and actual validation evidence. Use [optional issue tracking](references/issue-tracking.md) when requested or required by repository policy; a normal delivery does not create an issue automatically.
6. **Verify each head.** Reconcile expected checks with actual provider results and complete required CI and configured/requested reviews for the unchanged current SHA. Diagnose failures; rerun unchanged code only for evidenced transient problems and within authorization. Inspect comments and unresolved threads, fix actionable findings and support disagreements with evidence. Resolve addressed threads only when that external write is authorized. Every push invalidates affected checks and reviews.

For GitHub CI and Codex review details, read the [GitHub adapter](references/github-monitoring.md). The bundled watcher is read-only and GitHub-specific; retain native checks, reviews and identities for GitLab, Bitbucket and Hugging Face. Do not send their targets to GitHub or treat unsupported monitoring as success.

An explicit request for one remaining consolidated PR permits closing fully incorporated source PRs only after replacement readiness. Re-read source heads/inventory, incorporate new in-scope work and reverify before closure. Cross-link sources to the replacement; preserve branches and incomplete sources.

## Report

Complete the final adversarial checkpoint and reread the current head, required checks, reviews and threads. Claim readiness only when applicable gates pass; list outstanding human approvals separately. Never merge without authorization. Continue unaffected targets. Report remaining protected unrelated work rather than cleaning it to manufacture a clean-worktree result.

Use the caller's format, otherwise:

| Repository | Change | Result and evidence |
| --- | --- | --- |

Link actual change requests and current-head evidence. Include commits/destinations, signed or unsigned status, executed validation, branch updates and any authorized history replacement or issue tracking. Report no-ops/blockers; use `—` for unpublished work.
