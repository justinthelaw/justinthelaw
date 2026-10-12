---
name: upgrade
description: Use when upgrading repository dependencies, runtimes or toolchains to supported stable or LTS releases, consolidating dependency PRs, resolving migration failures or revisiting deferred upgrades.
---

# Upgrade

Produce one verified upgrade PR per changed repository and account for every dependency considered.

## Start

Read [the shared contract](../develop/references/contract.md). Reuse its targets, invocation and adversarial checkpoints. Unspecified targets mean all owned, non-archived `justinthelaw` repositories.

**Required dependencies:** use [iterate](../iterate/SKILL.md) for repository preparation, implementation, publication, CI and review; invoke [clean](../clean/SKILL.md) in prepare mode for verified unused build caches. Preserve its resource measurements; a no-op is valid.

Default to all dependency categories and dependency-related PRs. Narrow requests stay narrow. Include unrelated feature PRs only when explicitly requested. This skill owns dependency scope, ledger, source-PR mapping and the combined report; iterate owns delivery.

## Workflow

1. **Inventory.** Inspect manifests, runtime/toolchain pins, lockfiles, CI and prior deferrals. Include runtime, development/test, optional/peer, build, package-manager, CI-action, container and transitive constraints. Capture in-scope PR URLs, head/base SHAs, intent, dependencies and review status, including drafts and human-authored work.
2. **Integrate.** Reuse a suitable consolidated PR/isolated branch or start from the current default branch. Apply source changes in dependency order without duplicates; preserve attribution, histories and intended behavior. Regenerate lockfiles natively. Map every source intent to incorporation or a concrete blocker.
3. **Choose targets.** Verify current releases, support dates, compatibility, migrations and security/deprecation notices from official registries/upstream sources; record links and check dates. Prefer supported stable releases and appropriate runtime/platform LTS lines with current compatible patches. Evaluate major and intermediate migrations, avoid prereleases unless requested, and explain targets below newest stable. Upgrade compatible dependency families together; inspect transitive changes through the native resolver instead of blindly overriding leaves.
4. **Diagnose.** Reproduce failures against the known-good baseline. Identify changed contracts and affected call sites; distinguish migration defects from pre-existing failures or access/infrastructure problems. Test reasonable documented migrations, compatible peer/runtime combinations, upstream fixes, small maintained adapters or in-scope supported alternatives. Fix shared causes once; preserve behavior and meaningful regression coverage. Keep tests and security/type checks intact.
5. **Defer with evidence.** After reasonable options are tested or ruled out, retain the best verified supported version and successful upgrades. Record attempted targets, alternatives, failure, retained version, evidence and retry condition. If support/compatibility cannot be verified, report `Blocked/unverified`. Put a concise deferral beside the pin/integration when syntax permits, otherwise in nearby maintained dependency documentation; never edit generated lockfiles by hand. Reconsider deferrals next run and remove resolved notes.
6. **Deliver.** Follow iterate's validation, publication and current-head review gates. Verify reproducible installation, migration regressions, generated artifacts and the full consolidated diff. Include ledger, source map, deferrals and actual validation in the PR template.

Close source PRs only with explicit closure authorization or a request for one remaining consolidated PR, after iterate's incorporation and readiness checks. Preserve branches and incomplete sources. Continue unaffected repositories; never create empty PRs or merge without authorization.

## Report

Complete the shared evidence checkpoint and iterate's current-head checks. Return clean's measured resource summary plus:

| Repository | Final PR | Result and validation/review evidence |
| --- | --- | --- |

| Dependency | Before | Considered target | Final | Outcome and reason/evidence |
| --- | --- | --- | --- | --- |

Use `Upgraded`, `Already current`, `Deferred` or `Blocked/unverified`. Account for every target, source intent and considered dependency; use separate rows for distinct attempts. Link upstream evidence, checks/reviews, deferral notes, source PRs and final PRs. For failures, give cause, tested alternatives and retry condition. Use `—` for missing PRs or unverified versions.
