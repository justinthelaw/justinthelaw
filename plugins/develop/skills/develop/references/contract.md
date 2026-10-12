# Shared invocation contract

Read once for develop workflows and direct `iterate`, `upgrade` or `clean` calls. Standalone `adversarial-loop` follows its own protocol: no repository discovery, Superpowers dependency or implementation gate.

## Intent and ownership

Use one invocation ID and coordinator. Preserve original and ordered steering messages verbatim, with secrets/unrelated private content redacted. Record outcome, targets, constraints, acceptance criteria, authorized actions, artifact revision and original coordinator model/effort. Summaries supplement the messages. Keep packets private; never commit transcripts.

New steering supersedes conflicting requirements, preserves other goals and increments the intent revision. Invalidate affected reviews. Capture model/class and effort from runtime metadata or documented inheritance; never guess them.

## Targets

For unspecified `iterate` and `upgrade` targets, discover **all repositories owned by `justinthelaw` on GitHub that are not archived** using complete authenticated pagination. Include owned forks; activity, stars, PR counts and remembered lists do not define active. Report discovered disabled/inaccessible targets as blocked.

Explicit repositories, URLs, providers, exclusions or an unambiguous continuation override that default. A checkout is selected only when the request/context refers to it. Preserve other providers' identities.

Prefer connected provider tools, then permitted authenticated CLI/API and Git. Selected-repository integrations and public-only search provide partial coverage: report that limit and continue verified targets. Recheck archive status before writes; archived targets need explicit authorization. Report no-ops without manufacturing changes or empty PRs.

## Dependencies and autonomy

- Required chain: `upgrade → iterate → superpowers`. Upgrade also calls `clean` in prepare mode. Every workflow uses `adversarial-loop`.
- Resolve qualified installed skills, or read their packaged sibling files. Do not substitute unrelated cloud skills, vendor Superpowers, reinterpret skills as APIs or invent MCP dependencies.
- Use applicable Superpowers design, planning, isolation, debugging, testing and verification guidance. Under the owner's standing preference, replace skill-internal design/plan/execution approval prompts with adversarial checkpoints and proceed with scoped work.
- Preserve repository instructions, contribution requirements, host approvals, access controls and explicit user stops. Review cannot supply missing authorization. Merges, destructive actions, production changes and person-directed messages require applicable authorization.
- If a required dependency or fresh matching reviewer is unavailable, finish safe read-only discovery/preparation and report the exact gap before implementation. Try permitted existing access paths; do not install/connect integrations without authorization. Continue unaffected targets.
- Publishing follows the requested delivery scope. Preserve unrelated work and never force-push over others' changes.

## Handoffs

Pass the invocation/intent revisions, literal messages, targets, applicable instructions, authorization, acceptance criteria, protected work, original model/effort, artifact paths and revisions, evidence and open findings.

Return handled scope, current artifacts, changes/no-op, verification and limitations, findings, blockers and next gate. `iterate` owns repository/CI delivery; `upgrade` owns its dependency ledger and combined report; `clean` owns resource measurements. The coordinator integrates results.

## Review gates

The coordinator runs `adversarial-loop` at **intent** before consequential work and **evidence** before completion, including read-only, blocked and no-op invocations. Review the actual discovery result when there is no diff. Nested workers reuse these gates; reviewers never recurse.

Repeat affected checkpoints after material steering, design/scope changes, repairs or a new pushed head. Identify both intent and artifact revisions. Missing fresh agents or unverified model/effort means blocked/unverified, never a solo substitute or pass.

Completion requires task validation and current independent review without unresolved material findings. Internal review does not replace required tests, CI, provider reviews or human approvals, and never authorizes merging.
