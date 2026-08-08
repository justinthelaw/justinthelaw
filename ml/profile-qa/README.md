# Local NVIDIA Profile-QA Pipeline

This directory contains the local-only training and promotion pipeline for a
browser profile Q&A model targeting a 1024-token prompt budget. Generated data,
checkpoints, merged weights, ONNX exports, and reports are ignored by git.

For the end-to-end app and promotion handoff, see
[docs/diagrams.md](../../docs/diagrams.md).

The profile ontology is intentionally generic for fork reuse: section IDs should
stay in resume categories such as `identity`, `current_role`, `experience`,
`projects`, `education`, `recommendations`, `skills`, and `interests`. Keep
that order temporal and practical: experience outranks education, and
recommendations sit just below education but above hobbies/interests or
personality-trait sections. Put person-specific names, employers, schools, and
projects in fact text and keywords.

When changing public facts for a promoted model, keep this Python profile data
aligned with `src/config/site.ts`; the app reads the TypeScript config, while
this pipeline reads `profile_qa/public_profile.py`.

## Prerequisites

| Need | Detail |
| --- | --- |
| NVIDIA access | Run from a host shell with visible `/dev/nvidia*` devices or a container with NVIDIA device passthrough |
| CUDA | CUDA-enabled PyTorch wheels are sufficient for v1; `nvcc` is optional unless a dependency needs CUDA extension compilation |
| Python | Python 3.14.6 is pinned in the repository `.python-version` |
| Python dependencies | Install with the commands below |

```bash
uv python install
uv venv ml/profile-qa/.venv
uv pip sync --python ml/profile-qa/.venv --require-hashes ml/profile-qa/requirements.lock
uv venv ml/profile-qa/.venv-export
uv pip sync --python ml/profile-qa/.venv-export --require-hashes \
  ml/profile-qa/requirements-export.lock
. ml/profile-qa/.venv/bin/activate
```

After changing `requirements.txt`, refresh the reproducible Python 3.14 lock:

```bash
uv pip compile --python-version 3.14 --generate-hashes \
  --output-file ml/profile-qa/requirements.lock \
  ml/profile-qa/requirements.txt
uv pip compile --python-version 3.14 --generate-hashes \
  --output-file ml/profile-qa/requirements-export.lock \
  ml/profile-qa/requirements-export.txt
```

The main training/evaluation environment uses current Transformers 5 and Hub 1
releases. ONNX export is isolated because Optimum ONNX 0.1 currently requires
Optimum 2.1.x, Transformers 4.57.x, and Hub 0.x. Only use the export environment
with the trusted local merged model produced by this pipeline; do not use it to
load arbitrary model repositories or checkpoints. The exporter remains on
Transformers 4.57.x because the current Optimum ONNX stack is incompatible with
the patched Transformers 5.x releases. CI therefore records explicit
`pip-audit` exceptions for the known Transformers advisories; treat the export
environment as trusted-local-only and revisit those exceptions when the
exporter supports Transformers 5.

## Commands

```bash
PYTHONPATH=ml/profile-qa python -m profile_qa.gpu_health
PYTHONPATH=ml/profile-qa python -m profile_qa.synthetic_data --output ml/profile-qa/data/profile_qa.jsonl
PYTHONPATH=ml/profile-qa python -m profile_qa.train_lora --dataset ml/profile-qa/data/profile_qa.jsonl
PYTHONPATH=ml/profile-qa python -m profile_qa.merge_adapter --adapter-model-id ml/profile-qa/checkpoints/teapot-profile-qa-lora/checkpoint-400 --output-dir ml/profile-qa/merged/teapot-profile-qa
PYTHONPATH=ml/profile-qa python -m profile_qa.evaluate --dataset ml/profile-qa/data/profile_qa.jsonl --model-id teapotai/teapotllm --split test --output ml/profile-qa/reports/profile_qa_eval_baseline_test.json
PYTHONPATH=ml/profile-qa python -m profile_qa.evaluate --dataset ml/profile-qa/data/profile_qa.jsonl --model-id ml/profile-qa/merged/teapot-profile-qa --split validation --output ml/profile-qa/reports/profile_qa_eval_candidate_validation.json
PYTHONPATH=ml/profile-qa python -m profile_qa.evaluate --dataset ml/profile-qa/data/profile_qa.jsonl --model-id ml/profile-qa/merged/teapot-profile-qa --split test --output ml/profile-qa/reports/profile_qa_eval_candidate_test.json
PYTHONPATH=ml/profile-qa ml/profile-qa/.venv-export/bin/python -m profile_qa.export_onnx --model ml/profile-qa/merged/teapot-profile-qa --output-dir ml/profile-qa/onnx/candidate
PYTHONPATH=ml/profile-qa python -m profile_qa.prepare_hf_artifacts --model-browser-dir ml/profile-qa/onnx/candidate/browser --baseline-report ml/profile-qa/reports/profile_qa_eval_baseline_test.json --validation-report ml/profile-qa/reports/profile_qa_eval_candidate_validation.json --test-report ml/profile-qa/reports/profile_qa_eval_candidate_test.json
PYTHONPATH=ml/profile-qa python -m profile_qa.publish --repo-id justinthelaw/teapot-profile-qa-browser-1024 --artifact-dir ml/profile-qa/hf/model
PYTHONPATH=ml/profile-qa python -m profile_qa.publish --repo-type dataset --repo-id justinthelaw/profile-qa-synthetic-public-v1 --artifact-dir ml/profile-qa/hf/dataset
```

The training, continuation, merge, and export commands are Teapot-only. Training
always starts from `teapotai/teapotllm`; adapter continuation and merge reject
checkpoints whose PEFT metadata records a different base model; export expects
the merged model directory produced by `profile_qa.merge_adapter` and publishes
the encoder plus merged decoder ONNX files for the T5 browser runtime.

For targeted continuation from an existing LoRA adapter:

```bash
PYTHONPATH=ml/profile-qa python -m profile_qa.train_lora \
  --dataset ml/profile-qa/data/profile_qa.jsonl \
  --adapter-model-id ml/profile-qa/checkpoints/teapot-profile-qa-lora/checkpoint-400 \
  --output-dir ml/profile-qa/checkpoints/teapot-profile-qa-lora-v2 \
  --max-steps 160 \
  --learning-rate 7e-5 \
  --lr-scheduler-type constant_with_warmup
```

If Teapot cannot pass the 1024-token promotion gate, keep the lineage on
`teapotai/teapotllm` and fix the Teapot path directly: improve the public-profile
dataset, adjust LoRA hyperparameters, continue from a stronger adapter checkpoint,
or repair export/browser packaging issues. Do not switch base models.

## Promotion Gate

Do not update the app's browser `MODEL_ID` or default `MODEL_CONTEXT_LIMIT`
until all of these are true:

### Automated report gates

`profile_qa.evaluate` fingerprints the evaluated model and full dataset and
records the evaluated split. `profile_qa.export_onnx` adds a manifest binding the
browser files to their source-model fingerprint. Pass all three report paths
explicitly to `profile_qa.prepare_hf_artifacts`; it verifies this provenance and
the browser-file digest before replacing any model or dataset payload. This
prevents a passing report from an older candidate, another dataset, or the wrong
split from authorizing a new payload. A `--predictions-json` file must be an
object with `predictions` and `provenance` fields; its provenance must exactly
match the model, dataset, and split requested on the evaluation command. Inputs
that change while evaluation or export is running are rejected. A packageable
browser candidate requires a complete export and quantization run; either export
skip flag intentionally omits the provenance manifest, so artifact preparation
will reject that development-only output.

The candidate `browser_sha256` has one payload boundary: every regular file
under the directory containing `profile_qa_candidate_provenance.json`, at any
depth, except the manifest itself. Export records the initial browser directory;
artifact preparation refreshes the same digest after generating the model card,
and model publishing verifies it again immediately before upload. Adding,
removing, or changing any payload file after preparation therefore blocks
publication. Source-model fingerprints similarly cover every regular file under
the local merged-model directory.

Metric reports also fail closed when required scores are missing, non-numeric,
non-finite, outside `[0, 1]`, or when promoted validation/test reports omit the
`refusal` or `multi_turn` task. Each required task score must agree with its
corresponding top-level accuracy. Artifact preparation additionally rescores
every reported prediction against the fingerprinted dataset and requires the
stored per-record, per-task, and aggregate scores to match. The full published
`profile_qa.jsonl` preserves the evaluated source bytes; derived split files use
the canonical JSONL writer.

| Gate | Automated requirement |
| --- | --- |
| Baseline | Promoted test macro is at least `baseline test macro * 1.15`; the baseline macro must be greater than zero |
| Refusal | Promoted validation and promoted test `by_task.refusal` and matching top-level refusal accuracy are each at least 95% |
| Multi-turn | Promoted validation and promoted test `by_task.multi_turn` and matching top-level multi-turn accuracy are each at least 80% |

### Manual release gates

These checks are not encoded in the packaged evaluation reports. Confirm them
before running artifact preparation and retain the supporting logs or reports
with the release notes.

| Gate | Manual requirement |
| --- | --- |
| GPU health | `python -m profile_qa.gpu_health` passes on the training host |
| Training | Completed locally on the NVIDIA GPU with the 8GB-safe defaults |
| Loss | Eval loss <= 0.12 and recent training-loss windows <= 0.05 on a split-isolated validation set |
| Context | Promoted model accepts 1024-token prompts without truncating below 1024 |
| Browser smoke | Loads and answers a 900-1024 token prompt in Chromium desktop and Mobile Chrome without worker crashes |
| ONNX artifacts | Include `int8` and `uint8` variants; artifact preparation separately rejects `.onnx.data` files |

## Tests

The Python tests cover deterministic generation, schema validation, split
isolation, evidence references, no private-data leakage in non-refusal examples,
promotion-report validation, pre-mutation gating, and GPU health-check behavior:

```bash
PYTHONPATH=ml/profile-qa python -m pytest ml/profile-qa/tests
```

Pull requests run this lightweight suite. A scheduled and manually dispatchable
workflow also recreates the complete locked ML environment and smoke-tests every
direct dependency without requiring a GPU training run.
