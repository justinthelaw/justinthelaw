---
name: iterate
description: Use when implementing, fixing, maintaining, publishing or reviewing repositories, pull requests, merge requests, issues, CI failures or review findings on GitHub, GitLab, Bitbucket or Hugging Face.
---

# Iterate

Deliver repository work through verified changes and review.

## Start

Read [the shared contract](../develop/references/contract.md); reuse its invocation, target selection and adversarial checkpoints. Unspecified targets mean all owned, non-archived `justinthelaw` repositories.

**Required dependency:** load applicable installed Superpowers skills for brainstorming, planning, isolated work, execution, debugging, meaningful tests, review and verification. Follow the contract's autonomous internal gates and dependency fallback.

## Workflow

1. **Resolve.** Parse exact provider hosts: `github.com`, `gitlab.com`, `bitbucket.org` or `huggingface.co`; bare `owner/repo` defaults to GitHub. Inspect local origin/upstream. Establish self-managed GitLab through metadata/configuration; reject unsupported hosts without rerouting. Preserve nested groups, change-request paths and model/dataset/Space namespaces.
2. **Prepare.** Inspect access, current default branch, related PRs/issues, instructions/templates, `CODEOWNERS`, security/CLA/DCO requirements, CI, manifests, lockfiles and pinned tools. Honor required maintainer acceptance; create prerequisite issues only when required and authorized. Reuse matching branches/requests in an isolated checkout. Preserve dirty/untracked work, stashes, unpublished commits and other worktrees. Start new work from the current default branch; use an authorized fork if upstream writes are unavailable.
3. **Implement.** Reproduce defects, fix root causes, preserve interfaces and avoid unrelated refactoring. For behavior changes, use meaningful regression coverage; avoid tests that mirror implementation. Generate lockfiles/artifacts with pinned native tools.
4. **Validate.** Run repository-required formatting, lint, types, tests, build, packaging, security and contribution checks. Inspect the full diff and `git diff --check`. Distinguish defects from infrastructure/access failures. Resolve material adversarial findings and rerun affected checks.
5. **Publish.** Commit scoped paths under repository policy. Open/update the native change request when requested, preserving its template and stating purpose, behavior and actual validation evidence.
6. **Verify each head.** Complete required CI and configured/requested reviews for the unchanged current SHA. Diagnose failures; rerun unchanged code only for evidenced transient problems. Inspect comments and unresolved threads, fix actionable findings and support disagreements with evidence. Resolve addressed threads. Every push repeats affected checks and reviews.

For explicitly requested GitHub Codex Code Review, use the [official trigger](https://learn.chatgpt.com/docs/third-party/github#request-a-codex-review): post `@codex review` only if none is queued/completed for the current head. Require a completed review/run or documented no-findings signal tied to that SHA. Silence, reactions, old reviews and an empty findings list are insufficient. Poll sensibly; report unavailable review without spamming triggers.

An explicit request for one remaining consolidated PR permits closing fully incorporated source PRs only after replacement readiness. Re-read source heads/inventory, incorporate new in-scope work and reverify before closure. Cross-link sources to the replacement; preserve branches and incomplete sources.

## Report

Complete the final adversarial checkpoint and reread the current head, required checks, reviews and threads. Claim readiness only when applicable gates pass; list outstanding human approvals separately. Never merge without authorization. Continue unaffected targets.

Use the caller's format, otherwise:

| Repository | Change | Result and evidence |
| --- | --- | --- |

Link actual change requests and current-head evidence. Report no-ops/blockers; use `—` for unpublished work.
