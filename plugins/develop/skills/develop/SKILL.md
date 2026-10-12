---
name: develop
description: Use when the user invokes develop for repository work, dependency upgrades, environment cleanup, independent review, or a combination of these tasks.
---

# Develop

Route the user's intent into verified work.

## Start

Read [the shared contract](references/contract.md). Preserve one invocation and its original/steering messages across handoffs. A bare `develop` permits context discovery; ask for the missing outcome only if it remains unclear.

## Route

| Intent | Required skill | Handoff |
| --- | --- | --- |
| Implement, fix, maintain, review or publish repository work | [iterate](../iterate/SKILL.md) | Targets, outcome, constraints |
| Upgrade dependencies or consolidate dependency PRs | [upgrade](../upgrade/SKILL.md) | Targets, dependency and PR scope |
| Inspect or reclaim disk/RAM; investigate processes | [clean](../clean/SKILL.md) | Environment, exact scope, protected work |
| Challenge facts, visuals, writing, plans or results | [adversarial-loop](../adversarial-loop/SKILL.md) | Intent, artifacts, evaluation criteria |

For mixed requests, use the smallest ordered combination and one coordinator. Run the contract's intent and evidence checkpoints; nested skills share these reviews. Continue authorized work through routine internal decisions.

## Report

Use the selected skill's report. For mixed work, combine target, result and evidence with required dependency/resource details; identify incomplete gates.
