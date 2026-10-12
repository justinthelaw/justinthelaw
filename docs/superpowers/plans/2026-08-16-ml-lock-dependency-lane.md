# Archived ML dependency-lane plan - 2026-08-16

Historical design, superseded by the current [LLM guide](../../../llm/AGENTS.md),
[requirements](../../../llm/requirements.txt),
[export requirements](../../../llm/requirements-export.txt) and
[workflow](../../../.github/workflows/llm.test.yml). Do not execute the old plan.
[Original plan and proposed tests](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/docs/superpowers/plans/2026-08-16-ml-lock-dependency-lane.md).

The plan addressed Dependabot combining incompatible Python lanes under the former
`ml/profile-qa/` path. Training targeted Hub `>=1.27.0` / Transformers `>=5.15.0`;
export targeted Hub `>=0.36.2,<1`, Optimum `>=2.1.0,<2.2` and Transformers
`>=4.57.6,<4.58`. It proposed excluding exporter manifests from pip updates,
regression tests for that boundary, and hashed locks generated for Python 3.14
with uv 0.11.29. Intended validation included deterministic regeneration, the
full Python suite, contribution checks and current-head CI on a draft PR.

Those checkboxes were planned work, not proof of execution. Both current Python
lanes use Hub 2 / Transformers 5 and native ONNX export without Optimum, so the
old exclusion/range assertions and command paths are obsolete. The current
package is `llm.persona`; follow current source and instructions for commands.
